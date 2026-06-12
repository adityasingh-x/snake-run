import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = 'http://localhost:5173/snake-run/';
const OUT = 'docs/investigations/perf-data';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();

// Page-side metrics accumulator (collected via page.evaluate at the end)
await page.exposeFunction('logPerf', (data) => {
  console.log('PERF-EVT:' + JSON.stringify(data));
});

await page.addInitScript(() => {
  window.__perf = {
    fps: [],
    longTasks: [],
    cellAddOps: 0,
    cellRemoveOps: 0,
    reactProfilerCommits: [],
    observerAttached: false,
    initialCellCount: 0,
    currentCellCount: 0,
    fiberRenderCounts: {},
  };

  // FPS
  let frames = 0; let lastReport = performance.now(); let lastFrame = lastReport;
  const longFrames = [];
  function loop(t) {
    const dt = t - lastFrame; lastFrame = t;
    if (dt > 32) longFrames.push(dt);
    frames++;
    if (t - lastReport > 1000) {
      const fps = (frames * 1000) / (t - lastReport);
      const worst = longFrames.length ? Math.max(...longFrames) : 0;
      window.__perf.fps.push({ fps, worst, longFrameCount: longFrames.length });
      frames = 0; lastReport = t; longFrames.length = 0;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Long task
  if ('PerformanceObserver' in window) {
    try {
      const po = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          window.__perf.longTasks.push({ duration: e.duration, startTime: e.startTime });
        }
      });
      po.observe({ entryTypes: ['longtask'] });
    } catch {}
  }

  // Mutation observer on board
  const boardObserver = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const n of m.addedNodes) {
        if (n.nodeType === 1 && n.getAttribute && n.getAttribute('role') === 'gridcell') {
          window.__perf.cellAddOps++;
        }
      }
      for (const n of m.removedNodes) {
        if (n.nodeType === 1 && n.getAttribute && n.getAttribute('role') === 'gridcell') {
          window.__perf.cellRemoveOps++;
        }
      }
    }
  });

  function attachObserver() {
    const board = document.querySelector('[role="grid"]');
    if (board && !window.__perf.observerAttached) {
      boardObserver.observe(board, { childList: true });
      window.__perf.observerAttached = true;
      window.__perf.initialCellCount = board.querySelectorAll('[role="gridcell"]').length;
      window.__perf.boardEl = board;
      return true;
    }
    return false;
  }

  // Use a more robust attach: when DOMContentLoaded, then poll, then also listen to navigation events
  document.addEventListener('DOMContentLoaded', () => {
    const interval = setInterval(() => {
      if (attachObserver()) clearInterval(interval);
    }, 50);
    setTimeout(() => clearInterval(interval), 30000);
  });

  // React Profiler hook: monkey-patch React's reconciler if possible
  // Use the React DevTools global hook if available
  setTimeout(() => {
    const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (hook) {
      window.__perf.devtoolsHookAvailable = true;
    }
  }, 100);
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/01-main-menu.png` });

// Navigate to Runner Mode
const runnerBtn = page.getByRole('button', { name: /runner mode/i });
await runnerBtn.click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/02-runner-ready.png` });

// Start
const startBtn = page.getByRole('button', { name: /^start$/i });
await startBtn.click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/03-runner-started.png` });

// Verify observer attached
const observerStatus1 = await page.evaluate(() => ({
  attached: window.__perf.observerAttached,
  initialCells: window.__perf.initialCellCount,
  currentCells: window.__perf.cellAddOps,
}));
console.log('Observer status after start:', JSON.stringify(observerStatus1));

// Play for 8 seconds
const PLAY_MS = 8000;
console.log(`Recording for ${PLAY_MS}ms...`);
await page.waitForTimeout(PLAY_MS);

// Capture mid-play screenshot
await page.screenshot({ path: `${OUT}/04-runner-midplay.png` });

// Trigger lane changes
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(150);
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(PLAY_MS);
await page.screenshot({ path: `${OUT}/05-runner-after-changes.png` });

// Pause
await page.keyboard.press(' ');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/06-runner-paused.png` });

// Now extract: render counts via walking the fiber tree (current instances)
// and use React Profiler-internal hook to read commit counts
const fiberInfo = await page.evaluate(() => {
  const root = document.getElementById('root');
  if (!root) return { error: 'no root' };
  const fiberKey = Object.keys(root).find(k => k.startsWith('__reactContainer$'));
  if (!fiberKey) return { error: 'no fiber' };

  const container = root[fiberKey];
  const startFiber = container.stateNode?.current;
  if (!startFiber) return { error: 'no current' };

  // Walk the fiber tree, but ALSO count by following the `alternate` chain
  // to find unique render "instances"
  const componentInstances = {};

  function walkNode(fiber, depth) {
    if (!fiber || depth > 60) return;
    const type = fiber.type;
    if (type && (typeof type === 'function' || typeof type === 'object')) {
      const name = type.displayName || type.name || 'Anon';
      if (['Board', 'Cell', 'RunnerGame', 'Game', 'RunnerHUD', 'ScoreBoard', 'RunnerGameOver', 'PauseMenu', 'GameOver'].includes(name)) {
        componentInstances[name] = (componentInstances[name] || 0) + 1;
      }
    }
    if (fiber.child) walkNode(fiber.child, depth + 1);
    if (fiber.sibling) walkNode(fiber.sibling, depth + 1);
  }

  walkNode(startFiber, 0);

  // Count Cell components specifically - look for ones in the Board
  // Find Board, then count its children
  const boardFiber = (() => {
    function findBoard(f, d) {
      if (!f || d > 60) return null;
      if (f.type && f.type.displayName === 'Board') return f;
      return findBoard(f.child, d + 1) || findBoard(f.sibling, d + 1);
    }
    return findBoard(startFiber, 0);
  })();

  let cellCount = 0;
  let boardRenderAttempts = 0;
  if (boardFiber) {
    // Count by following alternate chain (each render produces a new fiber in the chain)
    let f = boardFiber;
    while (f && boardRenderAttempts < 10000) {
      boardRenderAttempts++;
      f = f.alternate;
    }
  }

  return {
    componentInstances,
    boardRenderAttempts,
  };
});

console.log('Fiber info:', JSON.stringify(fiberInfo, null, 2));

// Get the full perf data
const perfData = await page.evaluate(() => ({
  fps: window.__perf.fps,
  longTasks: window.__perf.longTasks,
  cellAddOps: window.__perf.cellAddOps,
  cellRemoveOps: window.__perf.cellRemoveOps,
  observerAttached: window.__perf.observerAttached,
  initialCellCount: window.__perf.initialCellCount,
  devtoolsHookAvailable: window.__perf.devtoolsHookAvailable,
}));

const fps = perfData.fps.map(s => s.fps);
const summary = {
  config: {
    playwrightHeadless: true,
    viewport: { width: 1024, height: 768 },
    browserVersion: browser.version(),
    sampleCount: fps.length,
    totalDurationMs: PLAY_MS * 2,
  },
  fps: {
    samples: fps.length,
    min: fps.length ? Math.min(...fps).toFixed(1) : 'n/a',
    max: fps.length ? Math.max(...fps).toFixed(1) : 'n/a',
    avg: fps.length ? (fps.reduce((a, b) => a + b, 0) / fps.length).toFixed(1) : 'n/a',
    median: fps.length ? fps.slice().sort((a, b) => a - b)[Math.floor(fps.length / 2)].toFixed(1) : 'n/a',
    longFrameStats: perfData.fps.length ? {
      totalLongFrames: perfData.fps.reduce((a, b) => a + b.longFrameCount, 0),
      worstFrameMs: Math.max(...perfData.fps.map(s => s.worst)).toFixed(1),
    } : null,
  },
  longTasks: {
    count: perfData.longTasks.length,
    worstMs: perfData.longTasks.length ? Math.max(...perfData.longTasks.map(t => t.duration)).toFixed(1) : 0,
  },
  cellDomOps: {
    mutationObserverAttached: perfData.observerAttached,
    initialCells: perfData.initialCellCount,
    totalAdditions: perfData.cellAddOps,
    totalRemovals: perfData.cellRemoveOps,
    addsPerSec: (perfData.cellAddOps / (PLAY_MS * 2 / 1000)).toFixed(2),
    removesPerSec: (perfData.cellRemoveOps / (PLAY_MS * 2 / 1000)).toFixed(2),
  },
  componentInstances: fiberInfo.componentInstances || {},
  boardRendersFromFiber: fiberInfo.boardRenderAttempts || 0,
};

writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 2));
console.log('\n===== FINAL SUMMARY =====');
console.log(JSON.stringify(summary, null, 2));

await browser.close();

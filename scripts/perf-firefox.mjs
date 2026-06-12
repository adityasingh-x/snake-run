import { firefox } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = 'http://localhost:5173/snake-run/';
const OUT = 'docs/investigations/perf-data';

mkdirSync(OUT, { recursive: true });

const browser = await firefox.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();

await page.addInitScript(() => {
  window.__perf = {
    fps: [],
    longTasks: [],
    cellAddOps: 0,
    cellRemoveOps: 0,
    observerAttached: false,
    initialCellCount: 0,
  };

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
      return true;
    }
    return false;
  }
  document.addEventListener('DOMContentLoaded', () => {
    const interval = setInterval(() => {
      if (attachObserver()) clearInterval(interval);
    }, 50);
    setTimeout(() => clearInterval(interval), 30000);
  });
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/ff-01-main-menu.png` });

await page.getByRole('button', { name: /runner mode/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/ff-02-runner-ready.png` });

// Helper: run a single game attempt, record renders
async function playRun(durationMs) {
  // Reset counters
  await page.evaluate(() => { window.__rc = {}; });

  // Start (or restart)
  let startBtn = await page.$('button:has-text("Start")');
  if (!startBtn) startBtn = await page.$('button:has-text("Play Again")');
  if (startBtn) {
    await startBtn.click();
  }
  await page.waitForTimeout(50);

  const initialRc = await page.evaluate(() => ({ ...window.__rc }));

  const t0 = Date.now();
  await page.waitForTimeout(durationMs);
  const t1 = Date.now();

  const finalRc = await page.evaluate(() => ({ ...window.__rc }));

  // Compute deltas
  const deltas = {};
  for (const k of new Set([...Object.keys(initialRc), ...Object.keys(finalRc)])) {
    deltas[k] = (finalRc[k] || 0) - (initialRc[k] || 0);
  }

  return { durationMs: t1 - t0, deltas, finalRc };
}

await page.screenshot({ path: `${OUT}/ff-03-runner-started.png` });

// Play first run
console.log('--- Run 1 (start speed, 200ms tick) ---');
const run1 = await playRun(2000);
console.log('Run 1 result:', JSON.stringify(run1, null, 2));
await page.screenshot({ path: `${OUT}/ff-04-run1-end.png` });

// Run 2: longer, after restart
console.log('\n--- Run 2 (after game over, restart) ---');
const run2 = await playRun(2000);
console.log('Run 2 result:', JSON.stringify(run2, null, 2));
await page.screenshot({ path: `${OUT}/ff-05-run2-end.png` });

// Get final perf data
const result = await page.evaluate(() => ({
  fps: window.__perf.fps,
  longTasks: window.__perf.longTasks,
  cellAddOps: window.__perf.cellAddOps,
  cellRemoveOps: window.__perf.cellRemoveOps,
  observerAttached: window.__perf.observerAttached,
  initialCellCount: window.__perf.initialCellCount,
  finalRc: window.__rc,
}));

const fps = result.fps.map(s => s.fps);
const totalDurationMs = (run1.durationMs + run2.durationMs) || 4000;

const summary = {
  measurement: {
    browser: 'firefox headless',
    viewport: { width: 1024, height: 768 },
    measurementWindowMs: totalDurationMs,
  },
  fps: {
    min: fps.length ? Math.min(...fps).toFixed(1) : 'n/a',
    max: fps.length ? Math.max(...fps).toFixed(1) : 'n/a',
    avg: fps.length ? (fps.reduce((a, b) => a + b, 0) / fps.length).toFixed(1) : 'n/a',
    median: fps.length ? fps.slice().sort((a, b) => a - b)[Math.floor(fps.length / 2)].toFixed(1) : 'n/a',
  },
  longTasks: {
    count: result.longTasks.length,
    worstMs: result.longTasks.length ? Math.max(...result.longTasks.map(t => t.duration)).toFixed(1) : 0,
  },
  cellDomOps: {
    mutationObserverAttached: result.observerAttached,
    initialCells: result.initialCellCount,
    totalAdditions: result.cellAddOps,
    totalRemovals: result.cellRemoveOps,
  },
  runs: [run1, run2],
  renderCounts: {
    note: 'Counts include StrictMode double-render. Window: each run resets counter at start of that run.',
    finalCounts: result.finalRc,
  },
};

writeFileSync(`${OUT}/ff-summary.json`, JSON.stringify(summary, null, 2));
console.log('\n===== FINAL SUMMARY =====');
console.log(JSON.stringify(summary, null, 2));

await browser.close();

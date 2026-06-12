import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = 'http://localhost:5173/snake-run/';
const OUT = 'docs/investigations/perf-data';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--no-sandbox',
  ],
});
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
    rafThrottled: false,
  };

  // Detect rAF throttling
  let rafTimes = [];
  let lastRaf = performance.now();
  function detectThrottle(t) {
    rafTimes.push(t);
    if (rafTimes.length > 60) rafTimes.shift();
    if (rafTimes.length === 60) {
      const intervals = [];
      for (let i = 1; i < rafTimes.length; i++) {
        intervals.push(rafTimes[i] - rafTimes[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      window.__perf.rafThrottled = avg > 20; // > 20ms = throttled
    }
    requestAnimationFrame(detectThrottle);
  }
  requestAnimationFrame(detectThrottle);

  // FPS measurement
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
await page.bringToFront();
await page.waitForTimeout(500);

// Reset render counter
await page.evaluate(() => { window.__rc = {}; });

// Probe game distance every 1s to see actual tick rate
const distanceProbe = [];
for (let i = 0; i < 10; i++) {
  const d = await page.evaluate(() => {
    // distance is displayed in the RunnerHUD
    const distanceEl = document.querySelector('[aria-live="polite"]');
    return distanceEl ? distanceEl.textContent : null;
  });
  distanceProbe.push({ t: i * 1000, snapshot: d });
  await page.waitForTimeout(1000);
}
console.log('Distance probe (HUD text snapshots):');
distanceProbe.forEach(d => console.log(`  t=${d.t}ms: ${d.snapshot}`));

await page.screenshot({ path: `${OUT}/01-main-menu.png` });

await page.getByRole('button', { name: /runner mode/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/02-runner-ready.png` });

await page.getByRole('button', { name: /^start$/i }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/03-runner-started.png` });

const stateAfterStart = await page.evaluate(() => ({
  rc: window.__rc,
  rafThrottled: window.__perf.rafThrottled,
  fps: window.__perf.fps.slice(-1)[0],
}));
console.log('After start:', JSON.stringify(stateAfterStart, null, 2));

// Reset counter for measurement
await page.evaluate(() => { window.__rc = {}; });

const PLAY_MS = 10000;
console.log(`Recording for ${PLAY_MS}ms...`);
await page.waitForTimeout(PLAY_MS);

const midState = await page.evaluate(() => ({
  rc: window.__rc,
  rafThrottled: window.__perf.rafThrottled,
  fps: window.__perf.fps.slice(-3),
}));
console.log('Mid-play:', JSON.stringify(midState, null, 2));

await page.screenshot({ path: `${OUT}/04-runner-midplay.png` });

// Lane changes
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(50);
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(PLAY_MS);
await page.screenshot({ path: `${OUT}/05-runner-after-changes.png` });

const lateState = await page.evaluate(() => ({
  rc: window.__rc,
  rafThrottled: window.__perf.rafThrottled,
  fps: window.__perf.fps.slice(-3),
}));
console.log('Late-play:', JSON.stringify(lateState, null, 2));

await page.keyboard.press(' ');
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/06-runner-paused.png` });

const result = await page.evaluate(() => ({
  fps: window.__perf.fps,
  longTasks: window.__perf.longTasks,
  cellAddOps: window.__perf.cellAddOps,
  cellRemoveOps: window.__perf.cellRemoveOps,
  observerAttached: window.__perf.observerAttached,
  initialCellCount: window.__perf.initialCellCount,
  finalRc: window.__rc,
  rafThrottled: window.__perf.rafThrottled,
}));

const totalDurationMs = PLAY_MS * 2;
const fps = result.fps.map(s => s.fps);

const summary = {
  measurement: {
    browser: 'chromium headless',
    flags: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'],
    viewport: { width: 1024, height: 768 },
    measurementWindowMs: totalDurationMs,
    rafThrottled: result.rafThrottled,
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
    addsPerSec: (result.cellAddOps / (totalDurationMs / 1000)).toFixed(2),
    removesPerSec: (result.cellRemoveOps / (totalDurationMs / 1000)).toFixed(2),
  },
  renderCounts: {
    note: 'Counts include StrictMode double-render. Window: gameplay only (20s after reset).',
    counts: result.finalRc,
    rates: {
      Board: (result.finalRc.Board / (totalDurationMs / 1000)).toFixed(2),
      Cell: (result.finalRc.Cell / (totalDurationMs / 1000)).toFixed(2),
      RunnerGame: (result.finalRc.RunnerGame / (totalDurationMs / 1000)).toFixed(2),
      RunnerHUD: (result.finalRc.RunnerHUD / (totalDurationMs / 1000)).toFixed(2),
    },
  },
};

writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 2));
console.log('\n===== FINAL SUMMARY =====');
console.log(JSON.stringify(summary, null, 2));

await browser.close();

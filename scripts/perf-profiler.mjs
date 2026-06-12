import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const URL = 'http://localhost:5173/snake-run/';
const OUT = 'docs/investigations/perf-data';

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
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
await page.screenshot({ path: `${OUT}/01-main-menu.png` });

// Navigate to Runner Mode
await page.getByRole('button', { name: /runner mode/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/02-runner-ready.png` });

// Start
await page.getByRole('button', { name: /^start$/i }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/03-runner-started.png` });

// Reset commit counter at the start of measurement
await page.evaluate(() => { window.__commits.length = 0; });

// Play for 10 seconds
const PLAY_MS = 10000;
console.log(`Recording for ${PLAY_MS}ms...`);
await page.waitForTimeout(PLAY_MS);

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

// Get all measurements
const result = await page.evaluate(() => {
  const commits = window.__commits.slice();
  const fps = window.__perf.fps;
  const longTasks = window.__perf.longTasks;

  // Group commits by id
  const byId = {};
  for (const c of commits) {
    if (!byId[c.id]) byId[c.id] = { count: 0, totalDuration: 0, phases: {} };
    byId[c.id].count++;
    byId[c.id].totalDuration += c.actualDuration;
    byId[c.id].phases[c.phase] = (byId[c.id].phases[c.phase] || 0) + 1;
  }

  return {
    totalCommits: commits.length,
    byId,
    fps,
    longTasks,
    cellAddOps: window.__perf.cellAddOps,
    cellRemoveOps: window.__perf.cellRemoveOps,
    observerAttached: window.__perf.observerAttached,
    initialCellCount: window.__perf.initialCellCount,
  };
});

const totalDurationMs = PLAY_MS * 2;
const fps = result.fps.map(s => s.fps);

const summary = {
  measurement: {
    browser: 'chromium headless',
    viewport: { width: 1024, height: 768 },
    measurementWindowMs: totalDurationMs,
    fpsSamples: fps.length,
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
  reactProfiler: {
    totalCommits: result.totalCommits,
    commitsPerSec: (result.totalCommits / (totalDurationMs / 1000)).toFixed(2),
    byId: result.byId,
  },
};

writeFileSync(`${OUT}/summary.json`, JSON.stringify(summary, null, 2));
console.log('\n===== FINAL SUMMARY =====');
console.log(JSON.stringify(summary, null, 2));

await browser.close();

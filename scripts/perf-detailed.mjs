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
      window.__perf.fps.push({ fps: (frames * 1000) / (t - lastReport), worst: longFrames.length ? Math.max(...longFrames) : 0, longFrameCount: longFrames.length });
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
        if (n.nodeType === 1 && n.getAttribute && n.getAttribute('role') === 'gridcell') window.__perf.cellAddOps++;
      }
      for (const n of m.removedNodes) {
        if (n.nodeType === 1 && n.getAttribute && n.getAttribute('role') === 'gridcell') window.__perf.cellRemoveOps++;
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

await page.getByRole('button', { name: /runner mode/i }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: /^start$/i }).click();
await page.waitForTimeout(50);
await page.screenshot({ path: `${OUT}/ff-detailed-01-start.png` });

// Sample 1: at start (200ms tick)
await page.evaluate(() => { window.__rc = {}; window.__sampleStart = performance.now(); });
await page.waitForTimeout(2000);
const sample1 = await page.evaluate(() => ({
  rc: window.__rc,
  elapsed: performance.now() - window.__sampleStart,
  hud: document.querySelector('[aria-live="polite"]')?.textContent,
}));
console.log('Sample 1 (start, 200ms tick):', JSON.stringify(sample1, null, 2));

await page.screenshot({ path: `${OUT}/ff-detailed-02-after-2s.png` });

// Sample 2: another 2s window
await page.evaluate(() => { window.__rc = {}; window.__sampleStart = performance.now(); });
await page.waitForTimeout(2000);
const sample2 = await page.evaluate(() => ({
  rc: window.__rc,
  elapsed: performance.now() - window.__sampleStart,
  hud: document.querySelector('[aria-live="polite"]')?.textContent,
}));
console.log('Sample 2 (mid, 200ms tick):', JSON.stringify(sample2, null, 2));

await page.screenshot({ path: `${OUT}/ff-detailed-03-after-4s.png` });

// Now check: is the game over? If so, restart
const gameState = await page.evaluate(() => ({
  hasGameOver: !!document.querySelector('[data-win], [role="dialog"], [aria-label*="Game Over"], [aria-label*="Run Over"]'),
  hasPlayAgain: !!document.querySelector('button:has-text("Play Again")'),
  hudText: document.querySelector('[aria-live="polite"]')?.textContent,
}));
console.log('Game state:', JSON.stringify(gameState, null, 2));

// If game over, click Play Again to start a new run
const playAgain = await page.$('button:has-text("Play Again")');
if (playAgain) {
  console.log('Restarting game...');
  await playAgain.click();
  await page.waitForTimeout(50);
  await page.screenshot({ path: `${OUT}/ff-detailed-04-restart.png` });

  // Sample 3: new run, first 2s
  await page.evaluate(() => { window.__rc = {}; window.__sampleStart = performance.now(); });
  await page.waitForTimeout(2000);
  const sample3 = await page.evaluate(() => ({
    rc: window.__rc,
    elapsed: performance.now() - window.__sampleStart,
    hud: document.querySelector('[aria-live="polite"]')?.textContent,
  }));
  console.log('Sample 3 (restart, 200ms tick):', JSON.stringify(sample3, null, 2));
  await page.screenshot({ path: `${OUT}/ff-detailed-05-after-restart-2s.png` });
}

// Get final perf data
const result = await page.evaluate(() => ({
  fps: window.__perf.fps,
  longTasks: window.__perf.longTasks,
  cellAddOps: window.__perf.cellAddOps,
  cellRemoveOps: window.__perf.cellRemoveOps,
  observerAttached: window.__perf.observerAttached,
  initialCellCount: window.__perf.initialCellCount,
}));

const fps = result.fps.map(s => s.fps);
const summary = {
  browser: 'firefox headless',
  fps: {
    samples: fps.length,
    min: Math.min(...fps).toFixed(1),
    max: Math.max(...fps).toFixed(1),
    avg: (fps.reduce((a, b) => a + b, 0) / fps.length).toFixed(1),
    median: fps.slice().sort((a, b) => a - b)[Math.floor(fps.length / 2)].toFixed(1),
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
    addsPerSec: (result.cellAddOps / 6).toFixed(2),
    removesPerSec: (result.cellRemoveOps / 6).toFixed(2),
  },
  samples: { sample1, sample2, sample3: sample3 || null },
};

writeFileSync(`${OUT}/ff-detailed-summary.json`, JSON.stringify(summary, null, 2));
console.log('\n===== DETAILED SUMMARY =====');
console.log(JSON.stringify(summary, null, 2));

await browser.close();

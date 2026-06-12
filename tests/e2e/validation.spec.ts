import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

const RECORDINGS_DIR = resolve(process.cwd(), 'docs/Milestone 14.1-validation/recordings');

test.beforeAll(() => {
  if (!existsSync(RECORDINGS_DIR)) {
    mkdirSync(RECORDINGS_DIR, { recursive: true });
  }
});

async function navigateToRunner(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Runner Mode' }).click();
  await expect(page.getByRole('heading', { name: 'Runner Mode' })).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('[role="grid"]')).toHaveAttribute('data-viewport-scrolling', 'true');
}

async function sampleInnerTransforms(page: Page, durationMs: number): Promise<{ t: number; f: number }[]> {
  return page.evaluate(
    async (durMs) => {
      const board = document.querySelector('[role="grid"]');
      const inner = board?.firstElementChild as HTMLElement | undefined;
      if (!inner) return [];
      const samples: { t: number; f: number }[] = [];
      const start = performance.now();
      return new Promise<{ t: number; f: number }[]>((resolve) => {
        function sample() {
          const t = performance.now() - start;
          const c = window.getComputedStyle(inner!).transform;
          const m = c.match(/matrix\(([^)]+)\)/);
          const f = m ? parseFloat(m[1].split(',')[5]) : 0;
          samples.push({ t: Math.round(t * 100) / 100, f });
          if (t < durMs) {
            requestAnimationFrame(sample);
          } else {
            resolve(samples);
          }
        }
        requestAnimationFrame(sample);
      });
    },
    durationMs,
  );
}

test.describe('M14.1 Smooth Runner Motion Validation', () => {
  test('viewport inner wrapper applies translateY animation (post-M14.1)', async ({ page }) => {
    test.setTimeout(60_000);
    await navigateToRunner(page);

    await page.waitForTimeout(300);

    const initialTransform = await page.evaluate(() => {
      const board = document.querySelector('[role="grid"]');
      const inner = board?.firstElementChild as HTMLElement | undefined;
      if (!inner) return null;
      const c = window.getComputedStyle(inner);
      return {
        transform: c.transform,
        animationName: c.animationName,
        animationDuration: c.animationDuration,
      };
    });
    expect(initialTransform).not.toBeNull();
    expect(initialTransform!.transform).not.toBe('none');
    expect(initialTransform!.animationName).toMatch(/viewportScroll/);
    // Animation duration = RUNNER_INITIAL_SPEED / RUNNER_SPEED_MULTIPLIER = 200/1.0 = 200ms = 0.2s
    // See: src/game/constants.ts
    expect(initialTransform!.animationDuration).toBe('0.2s');
  });

  test('continuous interpolation: matrix values span the full animation range', async ({ page }) => {
    test.setTimeout(60_000);
    await navigateToRunner(page);

    await page.waitForTimeout(300);

    const samples = await sampleInnerTransforms(page, 3_000);

    const fValues = samples.map((s) => s.f);
    const minF = Math.min(...fValues);
    const maxF = Math.max(...fValues);
    const distinctValues = new Set(fValues.map((f) => Math.round(f * 100) / 100)).size;

    const report = {
      totalFrames: samples.length,
      durationMs: 3_000,
      minF: Number(minF.toFixed(4)),
      maxF: Number(maxF.toFixed(4)),
      rangeF: Number((maxF - minF).toFixed(4)),
      distinctValues,
    };
    writeFileSync(join(RECORDINGS_DIR, 'motion-quality-report.json'), JSON.stringify(report, null, 2));

    expect(samples.length).toBeGreaterThan(150);
    expect(minF).toBeLessThan(0);
    expect(maxF).toBe(0);
    expect(maxF - minF).toBeGreaterThan(5);
    expect(distinctValues).toBeGreaterThan(20);
  });

  test('interpolation produces positive and negative deltas across ticks', async ({ page }) => {
    test.setTimeout(60_000);
    await navigateToRunner(page);

    await page.waitForTimeout(300);

    const samples = await sampleInnerTransforms(page, 3_000);

    const transitions: number[] = [];
    for (let i = 1; i < samples.length; i++) {
      const delta = samples[i].f - samples[i - 1].f;
      transitions.push(delta);
    }

    const positiveDeltas = transitions.filter((d) => d > 0.01).length;
    const negativeDeltas = transitions.filter((d) => d < -0.01).length;
    const maxPositive = Math.max(...transitions);
    const maxNegative = Math.min(...transitions);

    const report = {
      totalTransitions: transitions.length,
      positiveDeltas,
      negativeDeltas,
      maxPositive: Number(maxPositive.toFixed(4)),
      maxNegative: Number(maxNegative.toFixed(4)),
    };
    writeFileSync(join(RECORDINGS_DIR, 'transitions-report.json'), JSON.stringify(report, null, 2));

    expect(positiveDeltas).toBeGreaterThan(0);
    expect(negativeDeltas).toBeGreaterThan(0);
    expect(maxPositive).toBeGreaterThan(0.1);
    expect(maxNegative).toBeLessThan(-0.1);
  });

  test('runner mode is functional over 5 seconds of gameplay', async ({ page }) => {
    test.setTimeout(30_000);
    await navigateToRunner(page);

    await page.waitForTimeout(5_000);

    const state = await page.evaluate(() => {
      const board = document.querySelector('[role="grid"]');
      const cells = document.querySelectorAll('[role="gridcell"]');
      const head = document.querySelector('[aria-label^="Snake head"]');
      return {
        boardFound: !!board,
        cellCount: cells.length,
        headFound: !!head,
      };
    });

    expect(state.boardFound).toBe(true);
    expect(state.cellCount).toBe(400);
    expect(state.headFound).toBe(true);
  });

  test('classic mode board is unaffected by M14.1 changes', async ({ page }) => {
    test.setTimeout(30_000);
    await page.goto('/');
    await page.getByRole('button', { name: 'New Game' }).click();

    const startBtn = page.getByRole('button', { name: 'Start' });
    if (await startBtn.isVisible().catch(() => false)) {
      await startBtn.click();
    }

    await page.waitForTimeout(1_000);

    const result = await page.evaluate(() => {
      const board = document.querySelector('[role="grid"]');
      const inner = board?.firstElementChild as HTMLElement | undefined;
      if (!board || !inner) return null;
      return {
        viewportScrolling: board.getAttribute('data-viewport-scrolling'),
        innerClass: inner.className,
      };
    });

    expect(result).not.toBeNull();
    expect(result!.viewportScrolling).not.toBe('true');
    expect(result!.innerClass).not.toMatch(/boardAnimated/);
  });
});

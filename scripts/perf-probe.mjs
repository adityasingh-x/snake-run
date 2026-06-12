import { chromium } from 'playwright';

const URL = 'http://localhost:5173/snake-run/';

const browser = await chromium.launch({
  headless: true,
  args: [
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
  ],
});
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: 'networkidle' });
await page.bringToFront();
await page.waitForTimeout(500);

await page.getByRole('button', { name: /runner mode/i }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /^start$/i }).click();
await page.waitForTimeout(300);

// Probe game state every 500ms
const snapshots = [];
for (let i = 0; i < 20; i++) {
  const state = await page.evaluate(() => {
    const hud = document.querySelector('[aria-live="polite"]');
    return {
      hudText: hud ? hud.textContent : null,
      hudHTML: hud ? hud.outerHTML.slice(0, 500) : null,
      time: performance.now(),
    };
  });
  snapshots.push(state);
  await page.waitForTimeout(500);
}

console.log('Snapshots (every 500ms for 10s):');
for (const s of snapshots) {
  console.log(`  t=${s.time.toFixed(0)}ms: ${s.hudText}`);
}

await browser.close();

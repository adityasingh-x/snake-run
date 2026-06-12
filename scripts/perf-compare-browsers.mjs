import { chromium, firefox } from 'playwright';

const URL = 'http://localhost:5173/snake-run/';

console.log('--- Test 1: chromium headless (default) ---');
{
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'],
  });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.bringToFront();
  await page.getByRole('button', { name: /runner mode/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /^start$/i }).click();
  await page.waitForTimeout(100);
  for (let i = 0; i < 12; i++) {
    const state = await page.evaluate(() => {
      const hud = document.querySelector('[aria-live="polite"]');
      return hud ? hud.textContent : null;
    });
    console.log(`  t=${i * 500}ms: ${state}`);
    await page.waitForTimeout(500);
  }
  await browser.close();
}

console.log('\n--- Test 2: chromium headless=new ---');
try {
  const browser = await chromium.launch({
    headless: 'new',
    args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'],
  });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.bringToFront();
  await page.getByRole('button', { name: /runner mode/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /^start$/i }).click();
  for (let i = 0; i < 12; i++) {
    const state = await page.evaluate(() => {
      const hud = document.querySelector('[aria-live="polite"]');
      return hud ? hud.textContent : null;
    });
    console.log(`  t=${i * 500}ms: ${state}`);
    await page.waitForTimeout(500);
  }
  await browser.close();
} catch (e) {
  console.log('  chromium headless=new not available:', e.message);
}

console.log('\n--- Test 3: firefox headless ---');
try {
  const browser = await firefox.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /runner mode/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /^start$/i }).click();
  for (let i = 0; i < 12; i++) {
    const state = await page.evaluate(() => {
      const hud = document.querySelector('[aria-live="polite"]');
      return hud ? hud.textContent : null;
    });
    console.log(`  t=${i * 500}ms: ${state}`);
    await page.waitForTimeout(500);
  }
  await browser.close();
} catch (e) {
  console.log('  firefox not available:', e.message);
}

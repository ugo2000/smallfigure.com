const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('https://smallfigure.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#grid [data-id]', { timeout: 30000 });
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('#grid img'));
    for (const i of imgs.slice(0, 12)) { i.loading = 'eager'; await i.decode().catch(() => {}); }
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 620));
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'tools/_shot_modern.png' });
  console.log('done');
  await browser.close();
})();

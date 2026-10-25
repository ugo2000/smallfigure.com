const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
  await page.goto('https://smallfigure.com/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('#grid img'));
    for (const i of imgs.slice(0, 12)) { i.loading = 'eager'; await i.decode().catch(() => {}); }
  });
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelector('#grid').scrollIntoView());
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'tools/_shot_riders.png' });
  console.log('done');
  await browser.close();
})();

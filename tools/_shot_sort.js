const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('https://smallfigure.com/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('#grid img'));
    for (const i of imgs.slice(0, 40)) { i.loading = 'eager'; await i.decode().catch(() => {}); }
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'tools/_shot_sort_newest.png' });
  // 切到「原始顺序」看差异
  await page.selectOption('#sortBy', 'name');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'tools/_shot_sort_name.png' });
  console.log('done');
  await browser.close();
})();

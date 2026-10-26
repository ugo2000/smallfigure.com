/* 「旧时百工」新分类上线截图验收 */
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
const BASE = process.env.SF_BASE || 'https://smallfigure.com';
const OUT = require('path').resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.card', { timeout: 15000 });

  // 展开分类行
  const more = await page.locator('#chipsMore').count();
  if (more) {
    const vis = await page.locator('#chipsMore').isVisible();
    if (vis) { await page.locator('#chipsMore').click(); await page.waitForTimeout(400); }
  }
  await page.locator('#chips .chip[data-cat="trades"]').click();
  await page.waitForTimeout(600);
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/_trades_grid.png' });

  // 灯箱 + 故事
  await page.evaluate(() => {
    const c = document.querySelector('.card[data-id="trades-cooper"]');
    if (c) c.click();
  });
  await page.waitForSelector('#lightbox:not([hidden])', { timeout: 8000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: OUT + '/_trades_lightbox.png' });

  const story = await page.locator('#lbStoryText').textContent();
  const name = await page.locator('#lbName').textContent();
  console.log('灯箱标题:', name);
  console.log('故事长度:', (story || '').length, '字');
  console.log('故事开头:', (story || '').slice(0, 60));

  // 移动端
  const mp = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await mp.goto(BASE, { waitUntil: 'domcontentloaded' });
  await mp.waitForSelector('.card', { timeout: 15000 });
  await mp.waitForTimeout(1200);
  await mp.screenshot({ path: OUT + '/_trades_mobile.png' });

  await browser.close();
  console.log('截图完成');
})();

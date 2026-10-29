// 抓取指定素材在灯箱里的实际显示效果（用于人工比对可见性）
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'https://smallfigure.pages.dev';
const EXEC = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const OUT = process.env.OUT || 'D:/WB/smallfigure.com/outputs/vis_before';
const IDS = (process.env.IDS || 'constellation-teapot,hardware-scrollhinge,cr-cat,scare-crow,fusionfolk-ninja,impl-wand').split(',');

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#grid .card[data-id]', { timeout: 30000 });

  for (const id of IDS) {
    // 从线上数据里取该素材的名字，用名字搜索，再按 data-id 精确定位卡片
    const nm = await page.evaluate(async (id) => {
      const j = await (await fetch('data/images.json', { cache: 'no-store' })).json();
      const it = j.images.find(x => x.id === id);
      return it ? it.name : null;
    }, id);
    await page.fill('#search', nm || id);
    await page.waitForTimeout(600);
    await page.waitForFunction(() => {
      const c = document.querySelectorAll('#grid .card[data-id]');
      return c.length > 0 && Array.from(c).every(i => (i.querySelector('img') || {}).naturalWidth > 0);
    }, { timeout: 12000 }).catch(() => {});
    const found = await page.evaluate((id) => {
      const c = Array.from(document.querySelectorAll('#grid .card[data-id]'));
      const hit = c.find(x => x.dataset.id === id);
      if (hit) { hit.scrollIntoView(); return id; }
      return c.length ? c[0].dataset.id : null;
    }, id);
    if (found !== id) { console.log(id, '-> NOT FOUND (got', found + ')'); continue; }
    await page.click(`#grid .card[data-id="${id}"]`);
    await page.waitForFunction(() => {
      const im = document.querySelector('#lbStage img');
      return im && im.complete && im.naturalWidth > 0;
    }, { timeout: 20000 }).catch(() => {});
    await page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))));
    await page.waitForTimeout(250);
    await page.locator('#lbStage').screenshot({ path: OUT + '_' + id + '.png' });
    console.log('shot', id);
    await page.click('#lightbox .lb-close');
    await page.waitForTimeout(200);
  }
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });

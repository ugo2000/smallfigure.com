// 线上验收：批次六（仙童/奇食瓶罐/长毛皮鞋/古怪虫豸/怪诞星座）新增 30 项
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'https://91bbb14a.smallfigure.pages.dev';
const EXEC = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const NEW_CATS = ['fairykid', 'foodjar', 'hairyboot', 'oddbug', 'constellation'];

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  let fails = 0;
  const assert = (cond, msg) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg); if (!cond) fails++; };
  // 有界等待：等首屏前 30 张缩略图 naturalWidth>0，最多 12s
  const waitThumbs = (timeout = 12000) => page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll('#grid .card img'));
    return imgs.length > 0 && imgs.slice(0, 30).every(i => i.naturalWidth > 0);
  }, { timeout }).catch(() => {});

  try {
    console.log('STEP goto', BASE);
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#grid .card[data-id]', { timeout: 30000 });
    console.log('STEP grid present');
    await waitThumbs();
    console.log('STEP thumbs wait done');

    const info = await page.evaluate(() => {
      const countTxt = document.querySelector('#countLine') ? document.querySelector('#countLine').textContent : '';
      const chips = Array.from(document.querySelectorAll('.chip')).map(c => c.dataset.cat);
      const cards = Array.from(document.querySelectorAll('#grid .card[data-id]')).slice(0, 30)
        .map(c => ({ id: c.dataset.id, nw: (c.querySelector('img') || {}).naturalWidth || 0 }));
      return { countTxt, chips, cards };
    });

    assert(/237/.test(info.countTxt), 'count line 含 237: ' + info.countTxt.trim());
    const missingChips = NEW_CATS.filter(c => !info.chips.includes(c));
    assert(missingChips.length === 0, '5 个新分类 chip 都在' + (missingChips.length ? '（缺 ' + missingChips + '）' : ''));
    const firstIds = info.cards.map(c => c.id);
    const perCat = {};
    firstIds.forEach(id => { const k = id.split('-')[0]; perCat[k] = (perCat[k] || 0) + 1; });
    assert(firstIds.every(id => NEW_CATS.some(c => id.startsWith(c + '-'))), '首屏前 30 张全是新分类: ' + JSON.stringify(perCat));
    const broken = info.cards.filter(c => c.nw === 0).length;
    assert(broken === 0, '前 30 张缩略图全部加载: broken=' + broken);

    await page.click('.chip[data-cat="fairykid"]');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card[data-id]').length === 6, { timeout: 10000 }).catch(() => {});
    const fk = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('#grid .card[data-id]'));
      return { n: cards.length, broken: cards.filter(c => (c.querySelector('img') || {}).naturalWidth === 0).length };
    });
    assert(fk.n === 6, '仙童 chip 筛出 6 张: ' + fk.n);
    assert(fk.broken === 0, '仙童缩略图全部加载: broken=' + fk.broken);

    await page.screenshot({ path: 'tools/_verify_batch6.png', fullPage: false });
    assert(errors.length === 0, '控制台 0 错误' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  } catch (e) {
    console.log('FAIL 运行异常: ' + e.message);
    fails++;
  } finally {
    await browser.close();
  }
  console.log(fails === 0 ? '\n== 全部通过 ==' : '\n== 失败 ' + fails + ' 项 ==');
  process.exit(fails === 0 ? 0 : 1);
})();

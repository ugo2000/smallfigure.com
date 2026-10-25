// 线上验收：批次十九（立体公仔 toyfolk）新增 6 项
const { chromium } = require('playwright-core');
const BASE = process.env.BASE || 'https://smallfigure.pages.dev';
const EXEC = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox', '--no-proxy-server'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

  let fails = 0;
  const assert = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const waitThumbs = (t = 12000) => page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll('#grid .card img'));
    return imgs.length > 0 && imgs.slice(0, 6).every(i => i.naturalWidth > 0);
  }, { timeout: t }).catch(() => {});

  try {
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('#grid .card[data-id]', { timeout: 30000 });
    await waitThumbs();
    const info = await page.evaluate(() => {
      const countTxt = document.querySelector('#countLine') ? document.querySelector('#countLine').textContent : '';
      const chips = Array.from(document.querySelectorAll('.chip')).map(c => c.dataset.cat);
      const first = Array.from(document.querySelectorAll('#grid .card[data-id]')).slice(0, 6)
        .map(c => ({ id: c.dataset.id, nw: (c.querySelector('img') || {}).naturalWidth || 0 }));
      return { countTxt, chips, first };
    });
    assert(/315/.test(info.countTxt), 'count line 含 315: ' + info.countTxt.trim());
    assert(info.chips.includes('toyfolk'), '立体公仔 toyfolk chip 存在');
    assert(info.first.every(c => c.id.startsWith('toyfolk-')), '最新前 6 张全是立体公仔: ' + info.first.map(c => c.id).join(','));
    assert(info.first.every(c => c.nw > 0), '前 6 张缩略图全加载');

    await page.click('.chip[data-cat="toyfolk"]');
    await page.waitForFunction(() => document.querySelectorAll('#grid .card[data-id]').length === 6, { timeout: 10000 }).catch(() => {});
    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('#grid .card img'));
      return imgs.length > 0 && imgs.every(i => i.naturalWidth > 0);
    }, { timeout: 12000 }).catch(() => {});
    const fk = await page.evaluate(() => {
      const c = Array.from(document.querySelectorAll('#grid .card[data-id]'));
      return { n: c.length, broken: c.filter(x => (x.querySelector('img') || {}).naturalWidth === 0).length };
    });
    assert(fk.n === 6, '立体公仔 chip 筛出 6 张: ' + fk.n);
    assert(fk.broken === 0, '缩略图全加载: broken=' + fk.broken);
    const real = errors.filter(e => !/401/.test(e));
    assert(real.length === 0, '控制台 0 真错误（401 匿名预期已忽略）' + (real.length ? ': ' + real.slice(0, 2).join(' | ') : ''));
  } catch (e) {
    console.log('FAIL 运行异常: ' + e.message); fails++;
  } finally { await browser.close(); }
  console.log(fails === 0 ? '\n== 全部通过 ==' : '\n== 失败 ' + fails + ' 项 ==');
  process.exit(fails === 0 ? 0 : 1);
})();

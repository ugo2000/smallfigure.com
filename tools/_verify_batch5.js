/* 线上验收：5 个新分类（古怪老人/古怪小鬼/会飞的猛兽/古怪花草/古怪金银珠宝）共 30 项 */
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'https://smallfigure.com/';

function assert(cond, msg) {
  if (!cond) { console.log('FAIL: ' + msg); process.exitCode = 1; }
  else console.log('PASS: ' + msg);
}

const CATS = [
  { key: 'oldfolk',   zh: '古怪老人',     en: 'Eccentric Elders', n: 6 },
  { key: 'imp',       zh: '古怪小鬼',     en: 'Wee Imps',         n: 6 },
  { key: 'flybeast',  zh: '会飞的猛兽',   en: 'Flying Beasts',    n: 6 },
  { key: 'oddplants', zh: '古怪花草',     en: 'Odd Plants',       n: 6 },
  { key: 'jewels',    zh: '古怪金银珠宝', en: 'Curious Jewels',   n: 6 },
];

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#grid [data-id]', { timeout: 30000 });

  const data = await page.evaluate(async () => {
    const r = await fetch('data/images.json', { cache: 'no-store' });
    return await r.json();
  });
  assert(data.count === 207, 'count = 207（实际 ' + data.count + '）');
  assert(data.categories.length === 42, '分类 42 个（实际 ' + data.categories.length + '）');
  for (const c of CATS) {
    assert(data.categories.some(x => x.key === c.key && x.label === c.zh), '分类含「' + c.zh + '」');
    assert(data.categories.some(x => x.key === c.key && x.labelEn === c.en), '英文分类名 ' + c.en);
  }
  assert(data.images.every(i => i.added), '所有条目都有 added 时间戳');

  let allNew = [];
  for (const c of CATS) {
    const items = data.images.filter(i => i.category === c.key);
    assert(items.length === c.n, c.key + ' 共 ' + c.n + ' 项（实际 ' + items.length + '）');
    const bad = items.filter(g => !g.nameEn || !g.descEn || !g.tags.length || !g.tagsEn.length || g.transparent !== true);
    assert(bad.length === 0, c.key + ' 中英字段齐全且全透明 PNG' + (bad.length ? '：' + bad.map(b => b.id) : ''));
    assert(items.every(g => g.tags.every(t => /[一-鿿]/.test(t))), c.key + ' 中文标签每条都含中文');
    assert(items.every(g => g.tagsEn.every(t => !/[一-鿿]/.test(t))), c.key + ' 英文标签每条都不含中文');
    allNew = allNew.concat(items.map(i => i.id));
  }
  assert(allNew.length === 30, '新分类合计 30 项（实际 ' + allNew.length + '）');

  const sortVal = await page.$eval('#sortBy', el => el.value);
  assert(sortVal === 'newest', '排序默认 newest（实际 ' + sortVal + '）');

  const headIds = await page.evaluate(() => Array.from(
    document.querySelectorAll('#grid [data-id]')).slice(0, 30).map(c => c.getAttribute('data-id')));
  const missed = allNew.filter(id => !headIds.includes(id));
  assert(missed.length === 0, '首屏前 30 张全是新加入项' + (missed.length ? '，缺 ' + JSON.stringify(missed) : ''));

  // 逐类点击 chip 验证筛选
  for (const c of CATS) {
    const ok = await page.evaluate((zh) => {
      const chip = Array.from(document.querySelectorAll('.chip')).find(x => x.textContent.indexOf(zh) >= 0);
      if (!chip) return 'NOCHIP';
      chip.click();
      return 'OK';
    }, c.zh);
    assert(ok === 'OK', '点击「' + c.zh + '」chip');
    await page.waitForTimeout(600);
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll('#grid [data-id]')).map(x => x.getAttribute('data-id')));
    assert(ids.length === 6 && ids.every(id => allNew.includes(id)), c.key + ' 筛出 6 张');
    const thumbs = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('#grid img'));
      for (const i of imgs) { i.loading = 'eager'; i.scrollIntoView(); await i.decode().catch(() => {}); }
      return imgs.filter(i => i.naturalWidth > 0).length + '/' + imgs.length;
    });
    assert(thumbs === '6/6', c.key + ' 缩略图全部加载（' + thumbs + '）');
    await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('.chip')).find(x => /全部/.test(x.textContent));
      if (all) all.click();
    });
    await page.waitForTimeout(400);
  }

  assert(errors.length === 0, '0 个 JS 错误' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(process.exitCode ? '=== 有 FAIL ===' : '=== 全部 PASS ===');
})();

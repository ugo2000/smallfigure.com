/* 线上验收：新分类「都市小民」6 项 + 默认排序仍为最新优先 */
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'https://smallfigure.com/';

function assert(cond, msg) {
  if (!cond) { console.log('FAIL: ' + msg); process.exitCode = 1; }
  else console.log('PASS: ' + msg);
}

const NAMES = [
  '外卖骑手 · 都市小民', '咖啡师 · 都市小民', '健身教练 · 都市小民',
  '通勤白领 · 都市小民', '滑板青年 · 都市小民', '夜班司机 · 都市小民'
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
  assert(data.count === 177, 'count = 177（实际 ' + data.count + '）');
  assert(data.categories.length === 37, '分类 37 个（实际 ' + data.categories.length + '）');
  assert(data.categories.some(c => c.key === 'modern' && c.label === '都市小民'), '分类含「都市小民」');
  assert(data.categories.some(c => c.key === 'modern' && c.labelEn === 'Modern Folk'), '英文分类名 Modern Folk');
  const folks = data.images.filter(i => i.category === 'modern');
  assert(folks.length === 6, 'modern 共 6 项（实际 ' + folks.length + '）');
  assert(data.images.every(i => i.added), '所有条目都有 added 时间戳');
  const bad = folks.filter(g => !g.nameEn || !g.descEn || !g.tags.length || !g.tagsEn.length);
  assert(bad.length === 0, '6 项中英字段齐全' + (bad.length ? '：' + bad.map(b => b.id) : ''));
  assert(folks.every(g => g.tags.every(t => /[一-鿿]/.test(t))), '中文标签每条都含中文');
  assert(folks.every(g => g.tagsEn.every(t => !/[一-鿿]/.test(t))), '英文标签每条都不含中文');
  assert(folks.every(g => g.transparent === true), '6 项均为透明 PNG');

  const sortVal = await page.$eval('#sortBy', el => el.value);
  assert(sortVal === 'newest', '排序默认 newest（实际 ' + sortVal + '）');

  const headIds = await page.evaluate(() => Array.from(
    document.querySelectorAll('#grid [data-id]')).slice(0, 6).map(c => c.getAttribute('data-id')));
  const folkIds = folks.map(i => i.id);
  assert(headIds.length === 6 && headIds.every(id => folkIds.includes(id)),
    '首屏前 6 张全是新加入的都市小民（实际 ' + JSON.stringify(headIds) + '）');

  const chip = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.chip'))
    .find(c => c.textContent.indexOf('都市小民') >= 0) || null);
  assert(!!chip, '分类 chip 含「都市小民」');
  if (chip) {
    await chip.asElement().click();
    await page.waitForTimeout(700);
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll('#grid [data-id]')).map(c => c.getAttribute('data-id')));
    assert(ids.length === 6 && ids.every(id => folkIds.includes(id)), '筛出 6 张且全属都市小民');

    const titles = await page.$$eval('#grid .card h3', hs => hs.map(h => h.textContent.trim()));
    NAMES.forEach(n => assert(titles.includes(n), '卡片含「' + n + '」'));

    const thumbs = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('#grid img'));
      for (const i of imgs) { i.loading = 'eager'; i.scrollIntoView(); await i.decode().catch(() => {}); }
      return imgs.filter(i => i.naturalWidth > 0).length + '/' + imgs.length;
    });
    assert(thumbs === '6/6', '缩略图全部加载（' + thumbs + '）');
  }

  await page.click('#grid [data-id]');
  await page.waitForTimeout(800);
  const lb = await page.evaluate(() => ({
    name: (document.querySelector('#lbName') || {}).innerText || '',
    cat: (document.querySelector('#lbCat') || {}).innerText || '',
    desc: (document.querySelector('#lbDesc') || {}).innerText || ''
  }));
  console.log('   中文灯箱:', lb.name, '|', lb.cat);
  assert(/都市小民/.test(lb.name + lb.cat), '灯箱显示中文名与分类');
  assert(/透明 PNG/.test(lb.desc), '灯箱显示中文简介');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.click('header [data-lang="en"], .lang-toggle [data-lang="en"]');
  await page.waitForTimeout(900);
  const enChip = await page.$$eval('.chip', cs => cs.map(c => c.textContent.trim()).join('|'));
  assert(/Modern Folk/.test(enChip), '英文 chip 显示 Modern Folk');
  await page.click('#grid [data-id]');
  await page.waitForTimeout(800);
  const lbEn = await page.evaluate(() => ({
    name: (document.querySelector('#lbName') || {}).innerText || '',
    desc: (document.querySelector('#lbDesc') || {}).innerText || ''
  }));
  console.log('   英文灯箱:', lbEn.name);
  assert(/Modern Folk/.test(lbEn.name), '英文灯箱显示英文名');
  assert(/transparent PNG/.test(lbEn.desc), '英文灯箱显示英文简介');

  assert(errors.length === 0, '0 个 JS 错误' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(process.exitCode ? '=== 有 FAIL ===' : '=== 全部 PASS ===');
})();

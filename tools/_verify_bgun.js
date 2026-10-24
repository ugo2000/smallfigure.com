/* 线上验收：新分类「怪异枪械」6 项 + 默认排序仍为最新优先 */
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'https://smallfigure.com/';

function assert(cond, msg) {
  if (!cond) { console.log('FAIL: ' + msg); process.exitCode = 1; }
  else console.log('PASS: ' + msg);
}

const NAMES = [
  '兽角喇叭铳 · 怪异枪械', '纸罩灯笼铳 · 怪异枪械', '活藤缠枝铳 · 怪异枪械',
  '铁环链节铳 · 怪异枪械', '陶壶闷药铳 · 怪异枪械', '算盘弹仓铳 · 怪异枪械'
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
  assert(data.count === 171, 'count = 171（实际 ' + data.count + '）');
  assert(data.categories.length === 36, '分类 36 个（实际 ' + data.categories.length + '）');
  assert(data.categories.some(c => c.key === 'bgun' && c.label === '怪异枪械'), '分类含「怪异枪械」');
  const guns = data.images.filter(i => i.category === 'bgun');
  assert(guns.length === 6, 'bgun 共 6 项（实际 ' + guns.length + '）');
  assert(data.images.every(i => i.added), '所有条目都有 added 时间戳');
  // 双语字段齐全
  const bad = guns.filter(g => !g.nameEn || !g.descEn || !g.tags.length || !g.tagsEn.length);
  assert(bad.length === 0, '6 项中英字段齐全' + (bad.length ? '：' + bad.map(b => b.id) : ''));
  assert(guns.every(g => g.tags.every(t => /[一-鿿]/.test(t))), '中文标签每条都含中文');
  assert(guns.every(g => g.tagsEn.every(t => !/[一-鿿]/.test(t))), '英文标签每条都不含中文');

  const sortVal = await page.$eval('#sortBy', el => el.value);
  assert(sortVal === 'newest', '排序默认 newest（实际 ' + sortVal + '）');

  const headIds = await page.evaluate(() => Array.from(
    document.querySelectorAll('#grid [data-id]')).slice(0, 6).map(c => c.getAttribute('data-id')));
  const gunIds = guns.map(i => i.id);
  assert(headIds.length === 6 && headIds.every(id => gunIds.includes(id)),
    '首屏前 6 张全是新加入的怪异枪械（实际 ' + JSON.stringify(headIds) + '）');

  const chip = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.chip'))
    .find(c => c.textContent.indexOf('怪异枪械') >= 0) || null);
  assert(!!chip, '分类 chip 含「怪异枪械」');
  if (chip) {
    await chip.asElement().click();
    await page.waitForTimeout(700);
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll('#grid [data-id]')).map(c => c.getAttribute('data-id')));
    assert(ids.length === 6 && ids.every(id => gunIds.includes(id)), '筛出 6 张且全属怪异枪械');

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
  assert(/怪异枪械/.test(lb.name + lb.cat), '灯箱显示中文名与分类');
  assert(/透明 PNG/.test(lb.desc), '灯箱显示中文简介');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.click('header [data-lang="en"], .lang-toggle [data-lang="en"]');
  await page.waitForTimeout(900);
  const enChip = await page.$$eval('.chip', cs => cs.map(c => c.textContent.trim()).join('|'));
  assert(/Bizarre Firearms/.test(enChip), '英文 chip 显示 Bizarre Firearms');
  await page.click('#grid [data-id]');
  await page.waitForTimeout(800);
  const lbEn = await page.evaluate(() => ({
    name: (document.querySelector('#lbName') || {}).innerText || '',
    desc: (document.querySelector('#lbDesc') || {}).innerText || ''
  }));
  console.log('   英文灯箱:', lbEn.name);
  assert(/Bizarre Firearm/.test(lbEn.name), '英文灯箱显示英文名');
  assert(/transparent PNG/.test(lbEn.desc), '英文灯箱显示英文简介');

  assert(errors.length === 0, '0 个 JS 错误' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(process.exitCode ? '=== 有 FAIL ===' : '=== 全部 PASS ===');
})();

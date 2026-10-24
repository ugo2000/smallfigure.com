/* 线上验收：新分类「骑兽武者」6 项 + 默认排序仍为最新优先 */
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'https://smallfigure.com/';

function assert(cond, msg) {
  if (!cond) { console.log('FAIL: ' + msg); process.exitCode = 1; }
  else console.log('PASS: ' + msg);
}

const NAMES = [
  '青铜面具武士 · 骑六足蜈蚣', '绿袍乐师 · 骑白额虎', '白须道士 · 骑单足鹤',
  '骨珠巫女 · 骑双头蛇', '红甲校尉 · 骑铁甲犀', '狐裘萨满 · 骑巨狼'
];

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle' });

  const data = await page.evaluate(async () => {
    const r = await fetch('data/images.json', { cache: 'no-store' });
    return await r.json();
  });
  assert(data.count === 165, 'count = 165（实际 ' + data.count + '）');
  assert(data.categories.length === 35, '分类 35 个（实际 ' + data.categories.length + '）');
  assert(data.categories.some(c => c.key === 'riders' && c.label === '骑兽武者'), '分类含「骑兽武者」');
  const riders = data.images.filter(i => i.category === 'riders');
  assert(riders.length === 6, 'riders 共 6 项（实际 ' + riders.length + '）');
  assert(data.images.every(i => i.added), '所有条目都有 added 时间戳');

  // 默认排序仍是最新优先
  const sortVal = await page.$eval('#sortBy', el => el.value);
  assert(sortVal === 'newest', '排序默认 newest（实际 ' + sortVal + '）');

  // 首屏前 6 张是骑兽武者
  const headIds = await page.evaluate(() => Array.from(
    document.querySelectorAll('#grid [data-id]')).slice(0, 6).map(c => c.getAttribute('data-id')));
  const riderIds = riders.map(i => i.id);
  assert(headIds.length === 6 && headIds.every(id => riderIds.includes(id)),
    '首屏前 6 张全是新加入的骑兽武者（实际 ' + JSON.stringify(headIds) + '）');

  // 点分类 chip
  const chip = await page.evaluateHandle(() => Array.from(document.querySelectorAll('.chip'))
    .find(c => c.textContent.indexOf('骑兽武者') >= 0) || null);
  assert(!!chip, '分类 chip 含「骑兽武者」');
  if (chip) {
    await chip.asElement().click();
    await page.waitForTimeout(700);
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll('#grid [data-id]')).map(c => c.getAttribute('data-id')));
    assert(ids.length === 6 && ids.every(id => riderIds.includes(id)), '筛出 6 张且全属骑兽武者');

    const titles = await page.$$eval('#grid .card h3', hs => hs.map(h => h.textContent.trim()));
    NAMES.forEach(n => assert(titles.includes(n), '卡片含「' + n + '」'));

    const thumbs = await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll('#grid img'));
      for (const i of imgs) { i.loading = 'eager'; i.scrollIntoView(); await i.decode().catch(() => {}); }
      return imgs.filter(i => i.naturalWidth > 0).length + '/' + imgs.length;
    });
    assert(thumbs === '6/6', '缩略图全部加载（' + thumbs + '）');
  }

  // 灯箱双语
  await page.click('#grid [data-id]');
  await page.waitForTimeout(800);
  const lb = await page.evaluate(() => ({
    name: (document.querySelector('#lbName') || {}).innerText || '',
    cat: (document.querySelector('#lbCat') || {}).innerText || '',
    desc: (document.querySelector('#lbDesc') || {}).innerText || ''
  }));
  console.log('   中文灯箱:', lb.name, '|', lb.cat);
  assert(/骑兽武者/.test(lb.name + lb.cat), '灯箱显示中文名与分类');
  assert(/透明 PNG/.test(lb.desc), '灯箱显示中文简介');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.click('header [data-lang="en"], .lang-toggle [data-lang="en"]');
  await page.waitForTimeout(900);
  const enChip = await page.$$eval('.chip', cs => cs.map(c => c.textContent.trim()).join('|'));
  assert(/Beast Riders/.test(enChip), '英文 chip 显示 Beast Riders');
  await page.click('#grid [data-id]');
  await page.waitForTimeout(800);
  const lbEn = await page.evaluate(() => ({
    name: (document.querySelector('#lbName') || {}).innerText || '',
    desc: (document.querySelector('#lbDesc') || {}).innerText || ''
  }));
  console.log('   英文灯箱:', lbEn.name);
  assert(/Riding the/.test(lbEn.name), '英文灯箱显示英文名：' + lbEn.name);
  assert(/transparent PNG/.test(lbEn.desc), '英文灯箱显示英文简介');

  const hero = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 200));
  console.log('   hero:', hero);

  assert(errors.length === 0, '0 个 JS 错误' + (errors.length ? '：' + errors.join(' | ') : ''));
  await browser.close();
  console.log(process.exitCode ? '=== 有 FAIL ===' : '=== 全部 PASS ===');
})();

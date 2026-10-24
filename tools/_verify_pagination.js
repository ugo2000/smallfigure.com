/* 本地分页 + 灯箱验收（playwright-core，显式 chromium 路径） */
const { chromium } = require('playwright-core');

const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'http://127.0.0.1:8123/';

function assert(cond, msg) {
  if (!cond) { console.log('FAIL: ' + msg); process.exitCode = 1; }
  else console.log('PASS: ' + msg);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#grid .card', { timeout: 15000 });

  // 1. 全部 120 件，第 1 页应显示 100 张
  const total = await page.evaluate(() => window.__sf_total || document.querySelectorAll('#grid .card').length);
  const firstPageCards = await page.$$eval('#grid .card', els => els.length);
  assert(firstPageCards === 100, '第 1 页显示 100 张（实际 ' + firstPageCards + '）');

  // 2. 翻页器出现，共 2 页
  const pagerVisible = await page.$eval('#pager', el => !el.hidden && el.children.length > 0);
  assert(pagerVisible, '翻页器可见');
  const pageBtns = await page.$$eval('#pager .pg-btn[data-pg]:not([disabled])', els => els.map(e => e.dataset.pg));
  const numBtns = await page.$$eval('#pager .pg-btn:not([data-pg="prev"]):not([data-pg="next"])', els => els.length);
  assert(numBtns === 2, '页码按钮共 2 个（实际 ' + numBtns + '）');
  const prevDisabled = await page.$eval('#pager .pg-btn[data-pg="prev"]', el => el.disabled);
  assert(prevDisabled, '第 1 页时「上一页」禁用');

  // 3. 点第 2 页
  await page.click('#pager .pg-btn[data-pg="1"]');
  await page.waitForTimeout(300);
  const secondPageCards = await page.$$eval('#grid .card', els => els.length);
  assert(secondPageCards === 20, '第 2 页显示 20 张（实际 ' + secondPageCards + '）');
  const nextDisabled = await page.$eval('#pager .pg-btn[data-pg="next"]', el => el.disabled);
  assert(nextDisabled, '第 2 页时「下一页」禁用');
  const prevEnabledNow = await page.$eval('#pager .pg-btn[data-pg="prev"]', el => !el.disabled);
  assert(prevEnabledNow, '第 2 页时「上一页」可用');

  // 4. 灯箱位置文案（从全量 view 计：1 / 120）——先回第 1 页再点卡片
  await page.click('#pager .pg-btn[data-pg="0"]');
  await page.waitForTimeout(200);
  await page.click('#grid .card');
  await page.waitForSelector('#lightbox:not([hidden])', { timeout: 5000 });
  const pos1 = await page.$eval('#lbPos', el => el.textContent.trim());
  assert(pos1 === '1 / 120', '灯箱位置显示 "1 / 120"（实际 "' + pos1 + '"）');
  await page.click('#lbNext');
  await page.waitForTimeout(150);
  const pos2 = await page.$eval('#lbPos', el => el.textContent.trim());
  assert(pos2 === '2 / 120', '灯箱下一张显示 "2 / 120"（实际 "' + pos2 + '"）');
  await page.keyboard.press('Escape');

  // 5. 切到小分类（items<=100）翻页器应隐藏：选第一个 chip（全部以外）
  const chips = await page.$$('#chips .chip');
  // 找一个 count<=100 的分类：直接点“全部”之外的第一个，再判断
  if (chips.length > 1) {
    await chips[1].click();
    await page.waitForTimeout(200);
    const pagerHidden = await page.$eval('#pager', el => el.hidden);
    const cardsInCat = await page.$$eval('#grid .card', els => els.length);
    assert(pagerHidden, '小分类（<=100）翻页器隐藏');
    console.log('INFO: 该分类卡片数 = ' + cardsInCat);
  }

  // 6. 搜索会重置到第 1 页
  await page.click('#chips .chip[data-cat="all"]');
  await page.waitForTimeout(150);
  await page.fill('#search', 'a');
  await page.waitForTimeout(400);
  const searchPage = await page.$eval('#pager .pg-btn.active', el => el.dataset.pg).catch(() => null);
  assert(searchPage === '0' || searchPage === null, '搜索后停留在第 1 页');

  assert(errors.length === 0, '无页面 JS 错误（' + errors.length + '）' + (errors.length ? JSON.stringify(errors) : ''));

  await browser.close();
  console.log(process.exitCode ? '\n=== 验收未通过 ===' : '\n=== 分页验收全部通过 ===');
})().catch(e => { console.log('SCRIPT ERROR: ' + e.message); process.exit(2); });

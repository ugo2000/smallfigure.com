/* 线上新角色立绘双语验收（playwright-core，显式 chromium 路径） */
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'https://smallfigure.com/';

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
  // 强制拿线上最新数据
  const meta = await page.evaluate(async () => {
    const r = await fetch('data/images.json', { cache: 'no-store' });
    return r.json();
  });
  await page.waitForSelector('#grid .card', { timeout: 20000 });

  // 1. 总数 126
  assert(meta.count === 126, '线上 count = 126（实际 ' + meta.count + '）');

  // 2. 点「人物立绘」chip，应 28 张（22 旧 + 6 新）
  await page.click('#chips .chip[data-cat="characters"]');
  await page.waitForTimeout(400);
  const charCards = await page.$$eval('#grid .card', els => els.length);
  assert(charCards === 28, '人物立绘分类 28 张（实际 ' + charCards + '）');

  // 3. 6 个新名字都出现在卡片标题
  const titles = await page.$$eval('#grid .card h3', els => els.map(e => e.textContent));
  const need = ['阿岩 · 仿古旅人', '玄夜 · 星轨工程师', '老栓 · 山野药师', '青鸾 · 机械舞者', '阿萝 · 古风绣娘', '凛 · 赛博巡员'];
  for (const n of need) {
    assert(titles.includes(n), '卡片含新角色「' + n + '」');
  }

  // 4. 打开「阿岩」灯箱，检查中英名/简介/标签纯净
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#grid .card')];
    const c = cards.find(el => el.querySelector('h3').textContent.includes('阿岩'));
    c.click();
  });
  await page.waitForSelector('#lightbox:not([hidden])', { timeout: 5000 });
  const lbName = await page.$eval('#lbName', el => el.textContent.trim());
  const lbDesc = await page.$eval('#lbDesc', el => el.textContent.trim());
  const lbTags = await page.$$eval('#lbTags span', els => els.map(e => e.textContent));
  assert(lbName === '阿岩 · 仿古旅人', '灯箱中文名 = 阿岩 · 仿古旅人（实际 ' + lbName + '）');
  assert(lbDesc.includes('阿岩') && !/undefined|null|\[object/.test(lbDesc), '灯箱中文简介纯净');
  assert(lbTags.length >= 3 && !lbTags.some(t => /undefined|null/.test(t)), '灯箱中文标签纯净');
  // 切英文，检查英文名/简介
  await page.click('#lightbox .lang-btn[data-lang="en"]');
  await page.waitForTimeout(200);
  const lbNameEn = await page.$eval('#lbName', el => el.textContent.trim());
  const lbDescEn = await page.$eval('#lbDesc', el => el.textContent.trim());
  assert(lbNameEn === 'A-Yan · Ancient Traveler', '灯箱英文名 = A-Yan · Ancient Traveler（实际 ' + lbNameEn + '）');
  assert(lbDescEn.includes('A-Yan') && !/undefined|null|\[object/.test(lbDescEn), '灯箱英文简介纯净');
  await page.keyboard.press('Escape');

  // 5. 搜索新角色名能命中
  await page.click('#chips .chip[data-cat="all"]');
  await page.waitForTimeout(150);
  await page.fill('#search', '青鸾');
  await page.waitForTimeout(400);
  const searchCards = await page.$$eval('#grid .card', els => els.length);
  assert(searchCards >= 1, '搜索「青鸾」命中 >=1 张（实际 ' + searchCards + '）');
  const searchTitle = await page.$$eval('#grid .card h3', els => els.map(e => e.textContent));
  assert(searchTitle.some(t => t.includes('青鸾') || t.includes('Qing-Luan')), '搜索结果含「青鸾 / Qing-Luan」');

  assert(errors.length === 0, '无页面 JS 错误（' + errors.length + '）' + (errors.length ? JSON.stringify(errors) : ''));
  await browser.close();
  console.log(process.exitCode ? '\n=== 新角色验收未通过 ===' : '\n=== 新角色双语验收全部通过 ===');
})().catch(e => { console.log('SCRIPT ERROR: ' + e.message); process.exit(2); });

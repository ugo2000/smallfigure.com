/* 食物分类中英双语专项验收 */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'https://www.smallfigure.com';

(async () => {
  const browser = await pw.chromium.launch({
    executablePath: EXE,
    args: ['--mute-audio', '--proxy-server=http://127.0.0.1:7897']
  });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
  const errors = [];
  pg.on('pageerror', e => errors.push('pageerror: ' + e.message));

  let pass = 0, fail = 0;
  const check = (n, ok, extra) => { console.log((ok?'PASS':'FAIL')+' | '+n+(extra?' | '+extra:'')); ok?pass++:fail++; };
  const T = (sel, prop) => pg.evaluate(([s,p]) => { const el=document.querySelector(s); return el?el[p]:null; }, [sel, prop||'textContent']);

  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);

  // 英文模式：chip 列表含 Food & Drink
  const chipsEn = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  check('F1 英文 food chip 存在', chipsEn.some(c => c.indexOf('Food & Drink') === 0), chipsEn.join(' / '));

  const idx = chipsEn.findIndex(c => c.indexOf('Food & Drink') === 0);
  await pg.click('.chip >> nth=' + idx);
  await pg.waitForTimeout(500);
  check('F2 英文点 food chip 筛出 5 张', (await pg.$$('.card')).length === 5, String((await pg.$$('.card')).length));

  // 英文卡片名 / 分类标签
  const cardMeta = await pg.$$eval('.card', els => els.map(e => ({
    name: (e.querySelector('.card-meta h3')||{}).textContent,
    cat: (e.querySelector('.card-cat, .card-meta .cat, .card-meta span')||{}).textContent
  })));
  const names = cardMeta.map(c => c.name);
  check('F3 英文食物名齐全', ['Tonkotsu Ramen · Food','Cheeseburger · Food','Pepperoni Pizza Slice · Food','Strawberry Cream Cake · Food','Soup Dumplings · Food'].every(n => names.includes(n)), names.join(' | '));

  // 灯箱：英文名 + 英文简介 + 英文下载
  await pg.click('.card');
  await pg.waitForTimeout(600);
  const lbName = await T('#lbName');
  const lbDesc = await T('#lbDesc');
  const lbDl = await T('#lbDownload');
  check('F4 灯箱英文名含 Food', /\bFood$/.test(lbName||''), lbName);
  check('F5 灯箱英文简介非空且无中文', !!lbDesc && !/[一-龥]/.test(lbDesc), (lbDesc||'').slice(0,70));
  check('F6 灯箱英文下载钮', lbDl === 'Download full image', lbDl);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(300);

  // 切中文：食物卡片名与分类
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(600);
  const chipsZh = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  check('F7 中文 food chip 存在', chipsZh.some(c => c.indexOf('食物美食') === 0), chipsZh.join(' / '));
  const namesZh = await pg.$$eval('.card-meta h3', els => els.map(e => e.textContent.trim()));
  check('F8 中文食物名齐全', ['豚骨拉面 · 食物','芝士汉堡 · 食物','萨拉米披萨角 · 食物','草莓奶油蛋糕 · 食物','小笼蒸笼 · 食物'].every(n => namesZh.includes(n)), namesZh.join(' | '));

  // 搜索命中：中文「披萨」/ 英文「pizza」
  await pg.click('.chip >> nth=0');
  await pg.waitForTimeout(400);
  await pg.fill('#search', '披萨');
  await pg.waitForTimeout(500);
  check('F9 中文搜披萨命中 1 张', (await pg.$$('.card')).length === 1, String((await pg.$$('.card')).length));
  await pg.fill('#search', 'pizza');
  await pg.waitForTimeout(500);
  check('F10 英文搜 pizza 命中 1 张', (await pg.$$('.card')).length === 1, String((await pg.$$('.card')).length));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

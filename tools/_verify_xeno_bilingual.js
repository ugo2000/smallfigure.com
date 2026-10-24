/* 异星猎食分类中英双语专项验收

搜索命中数全部先用本地 data/images.json 按 app.js 的 haystack 逻辑复算过，
不靠预设（上轮 crystal→预设1实际4 的坑）。
*/
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
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  let pass = 0, fail = 0;
  const check = (n, ok, extra) => { console.log((ok?'PASS':'FAIL')+' | '+n+(extra?' | '+extra:'')); ok?pass++:fail++; };
  const T = (sel, prop) => pg.evaluate(([s,p]) => { const el=document.querySelector(s); return el?el[p]:null; }, [sel, prop||'textContent']);
  const cards = () => pg.$$('.card').then(a => a.length);

  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);

  const chipsEn = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(EN):', chipsEn.join(' / '));

  /* 英文：Alien Predation chip + 筛出 6 张 + 灯箱英文名/简介无中文 */
  const iEn = chipsEn.findIndex(c => c.indexOf('Alien Predation') === 0);
  check('X1 英文 Alien Predation chip', iEn >= 0, iEn >= 0 ? chipsEn[iEn] : chipsEn.join(' / '));
  if (iEn >= 0) {
    await pg.click('.chip >> nth=' + iEn);
    await pg.waitForTimeout(500);
    check('X2 点 Alien Predation 筛出 6 张', (await cards()) === 6, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(600);
    const lbName = await T('#lbName');
    const lbDesc = await T('#lbDesc');
    check('X3 灯箱英文名', !!lbName && !/[一-龥]/.test(lbName), lbName);
    check('X4 灯箱英文简介无中文', !!lbDesc && !/[一-龥]/.test(lbDesc), (lbDesc||'').slice(0, 70));
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('X5 灯箱英文标签无中文', tags.length > 0 && !tags.some(t => /[一-龥]/.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  /* 中文：异星猎食 chip + 筛出 6 张 + 灯箱中文名 */
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(700);
  const chipsZh = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(ZH):', chipsZh.join(' / '));
  const iZh = chipsZh.findIndex(c => c.indexOf('异星猎食') === 0);
  check('X6 中文 异星猎食 chip', iZh >= 0, iZh >= 0 ? chipsZh[iZh] : chipsZh.join(' / '));
  if (iZh >= 0) {
    await pg.click('.chip >> nth=' + iZh);
    await pg.waitForTimeout(500);
    check('X7 点异星猎食筛出 6 张', (await cards()) === 6, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(600);
    const lbName = await T('#lbName');
    check('X8 灯箱中文名', (lbName||'').indexOf('异星猎食') > 0, lbName);
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('X9 灯箱中文标签无英文', tags.length > 0 && !tags.some(t => /[A-Za-z]{2,}/.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  /* 搜索定位：先点「全部」chip 清掉分类筛选 */
  const allIdx = chipsZh.findIndex(c => c.indexOf('全部') === 0);
  if (allIdx >= 0) { await pg.click('.chip >> nth=' + allIdx); await pg.waitForTimeout(450); }

  const cases = [
    ['异星猎食', 6, '中文分类名'],
    ['猎食', 6, '中文分类名子串'],
    ['折光', 2, '折光伏击者 + 折光出击'],
    ['食人植物', 2, '脉孢囊壶 + 血蕊诱桩'],
    ['菌丝', 1, '孢丝织者'],
    ['肋骨', 1, '鸣骨吸附者'],
    ['alien predation', 6, '英文分类名'],
    ['predation', 6, '英文分类名子串'],
    ['prism', 2, 'Prism Stalker + Prism Strike'],
    ['carnivorous', 2, '两株食人植物'],
    ['mycelial', 1, 'Mycelial Weaver'],
    ['rib-cage', 1, 'Resonant Rib-Cage'],
    ['gland', 1, 'Gland Lure Stake'],
    ['spore', 1, 'spore sac 标签'],
    ['refraction', 2, 'refraction 相关两张']
  ];
  for (const [q, n, label] of cases) {
    await pg.fill('#search', '');
    await pg.waitForTimeout(250);
    await pg.fill('#search', q);
    await pg.waitForTimeout(500);
    check('X10 搜「' + q + '」命中 ' + n + ' 张', (await cards()) === n, label + ' → ' + (await cards()));
  }

  await pg.fill('#search', '');
  await pg.waitForTimeout(400);
  check('X11 清空搜索后回到 120 张', (await cards()) === 120, String(await cards()));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

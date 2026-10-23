/* 魔法书籍分类中英双语专项验收 */
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

  /* 英文：Arcane Books chip + 筛出 5 张 + 灯箱英文名/简介无中文 */
  const iEn = chipsEn.findIndex(c => c.indexOf('Arcane Books') === 0);
  check('B1 英文 Arcane Books chip', iEn >= 0, iEn >= 0 ? chipsEn[iEn] : chipsEn.join(' / '));
  if (iEn >= 0) {
    await pg.click('.chip >> nth=' + iEn);
    await pg.waitForTimeout(500);
    check('B2 点 Arcane Books 筛出 5 张', (await cards()) === 5, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(600);
    const lbName = await T('#lbName');
    const lbDesc = await T('#lbDesc');
    check('B3 灯箱英文名', !!lbName && !/[一-龥]/.test(lbName), lbName);
    check('B4 灯箱英文简介无中文', !!lbDesc && !/[一-龥]/.test(lbDesc), (lbDesc||'').slice(0, 70));
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('B5 灯箱英文标签无中文', tags.length > 0 && !tags.some(t => /[一-龥]/.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  /* 中文：魔法书籍 chip + 筛出 5 张 + 灯箱中文名 */
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(700);
  const chipsZh = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(ZH):', chipsZh.join(' / '));
  const iZh = chipsZh.findIndex(c => c.indexOf('魔法书籍') === 0);
  check('B6 中文 魔法书籍 chip', iZh >= 0, iZh >= 0 ? chipsZh[iZh] : chipsZh.join(' / '));
  if (iZh >= 0) {
    await pg.click('.chip >> nth=' + iZh);
    await pg.waitForTimeout(500);
    check('B7 点魔法书籍筛出 5 张', (await cards()) === 5, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(600);
    const lbName = await T('#lbName');
    check('B8 灯箱中文名', (lbName||'').indexOf('魔法书籍') > 0, lbName);
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('B9 灯箱中文标签无英文', tags.length > 0 && !tags.some(t => /[A-Za-z]{2,}/.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  /* 搜索定位：先点「全部」chip 清掉分类筛选 */
  const allIdx = chipsZh.findIndex(c => c.indexOf('全部') === 0);
  if (allIdx >= 0) { await pg.click('.chip >> nth=' + allIdx); await pg.waitForTimeout(450); }

  const cases = [
    ['血红法典', 1, '中文名'],
    ['骨饰禁书', 1, '中文名'],
    ['法典', 2, '中文标签「法典」'],
    ['卷轴', 1, '中文标签「卷轴」'],
    ['arcane books', 5, '英文分类名'],
    ['grimoire', 2, '英文标签 grimoire'],
    ['scroll', 1, '英文标签 scroll'],
    ['crystal codex', 1, '英文名 codex']
  ];
  for (const [q, n, label] of cases) {
    await pg.fill('#search', '');
    await pg.waitForTimeout(250);
    await pg.fill('#search', q);
    await pg.waitForTimeout(500);
    check('B10 搜「' + q + '」命中 ' + n + ' 张', (await cards()) === n, label + ' → ' + (await cards()));
  }

  await pg.fill('#search', '');
  await pg.waitForTimeout(400);
  check('B11 清空搜索后回到 91 张', (await cards()) === 91, String(await cards()));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });
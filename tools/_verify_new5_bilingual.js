/* 本轮新增：魔法法器 / 城堡建筑 / 古旧家具 / 奇械科技 四组中英双语专项验收 */
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
  const CJK = /[一-龥]/;
  const EN = /[A-Za-z]{2,}/;

  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);

  const chipsEn = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(EN):', chipsEn.join(' / '));

  /* ---------- 英文侧：4 个新分类 ---------- */
  for (const [key, label, n] of [['Arcane Implements', '魔法法器', 4],
                                 ['Castles', '城堡建筑', 4],
                                 ['Old Furniture', '古旧家具', 4],
                                 ['Odd Devices', '奇械科技', 4]]) {
    const i = chipsEn.findIndex(c => c.indexOf(key) === 0);
    check('E1 英文 ' + label + ' chip', i >= 0, i >= 0 ? chipsEn[i] : chipsEn.join(' / '));
    if (i < 0) continue;
    await pg.click('.chip >> nth=' + i);
    await pg.waitForTimeout(450);
    check('E2 点' + label + '筛出 ' + n + ' 张', (await cards()) === n, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(550);
    const lbName = await T('#lbName');
    const lbDesc = await T('#lbDesc');
    check('E3 ' + label + ' 灯箱英文名', !!lbName && !CJK.test(lbName), lbName);
    check('E4 ' + label + ' 灯箱英文简介无中文', !!lbDesc && !CJK.test(lbDesc), (lbDesc||'').slice(0, 60));
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('E5 ' + label + ' 灯箱英文标签无中文', tags.length > 0 && !tags.some(t => CJK.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(250);
  }

  /* ---------- 中文侧 ---------- */
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(700);
  const chipsZh = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(ZH):', chipsZh.join(' / '));
  for (const [label, n] of [['魔法法器', 4], ['城堡建筑', 4], ['古旧家具', 4], ['奇械科技', 4]]) {
    const i = chipsZh.findIndex(c => c.indexOf(label) === 0);
    check('Z1 中文 ' + label + ' chip', i >= 0, i >= 0 ? chipsZh[i] : chipsZh.join(' / '));
    if (i < 0) continue;
    await pg.click('.chip >> nth=' + i);
    await pg.waitForTimeout(450);
    check('Z2 点中文' + label + '筛出 ' + n + ' 张', (await cards()) === n, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(550);
    const lbName = await T('#lbName');
    check('Z3 ' + label + ' 灯箱中文名', !!lbName && !EN.test(lbName), lbName);
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('Z4 ' + label + ' 灯箱中文标签无英文', tags.length > 0 && !tags.some(t => EN.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(250);
  }

  /* ---------- 搜索定位（必须先点「全部」chip） ---------- */
  const allIdx = chipsZh.findIndex(c => c.indexOf('全部') === 0);
  if (allIdx >= 0) { await pg.click('.chip >> nth=' + allIdx); await pg.waitForTimeout(450); }

  const cases = [
    ['月牙魔杖', 1, '中文名'],
    ['浮珠法杖', 1, '中文名'],
    ['浮空岛堡', 1, '中文名'],
    ['藤蔓古堡遗迹', 1, '中文名'],
    ['三腿旧圆凳', 1, '中文名'],
    ['反重力平台', 1, '中文名'],
    ['法器', 4, '中文标签'],
    ['城堡', 4, '中文标签'],
    ['家具', 4, '中文标签'],
    ['科技', 4, '中文标签'],
    ['arcane implements', 4, '英文分类名'],
    ['castles', 4, '英文分类名'],
    ['old furniture', 4, '英文分类名'],
    ['odd devices', 4, '英文分类名'],
    ['crescent wand', 1, '英文名'],
    ['anti-gravity', 1, '英文标签'],
    ['force field', 1, '英文标签'],
    ['hilltop fortress', 1, '英文名']
  ];
  for (const [q, n, label] of cases) {
    await pg.fill('#search', '');
    await pg.waitForTimeout(220);
    await pg.fill('#search', q);
    await pg.waitForTimeout(480);
    check('S1 搜「' + q + '」命中 ' + n + ' 张', (await cards()) === n, label + ' → ' + (await cards()));
  }

  await pg.fill('#search', '');
  await pg.waitForTimeout(400);
  check('S2 清空搜索后回到 91 张', (await cards()) === 91, String(await cards()));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });
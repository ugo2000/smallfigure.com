/* 本轮新增：弹药军械 / 载具机械 / 异域农人 三组中英双语专项验收 */
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

  const chipsEn = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(EN):', chipsEn.join(' / '));

  // 三个新分类的英文 chip
  for (const [key, label, n] of [['Ammunition', 'Ammunition & Ordnance', 4],
                                  ['Vehicles', 'Vehicles & Machines', 4]]) {
    const i = chipsEn.findIndex(c => c.indexOf(key) === 0);
    check('N1 英文 ' + label + ' chip', i >= 0, i >= 0 ? chipsEn[i] : chipsEn.join(' / '));
    if (i < 0) continue;
    await pg.click('.chip >> nth=' + i);
    await pg.waitForTimeout(450);
    check('N2 点' + label + '筛出 ' + n + ' 张', (await pg.$$('.card')).length === n, String((await pg.$$('.card')).length));
    await pg.click('.card');
    await pg.waitForTimeout(500);
    const lbName = await T('#lbName');
    const lbDesc = await T('#lbDesc');
    check('N3 ' + label + ' 灯箱英文名', !/[一-龥]/.test(lbName||''), lbName);
    check('N4 ' + label + ' 灯箱英文简介无中文', !!lbDesc && !/[一-龥]/.test(lbDesc), (lbDesc||'').slice(0,60));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  // 切中文：三个新分类 chip + 名称
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(600);
  const chipsZh = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(ZH):', chipsZh.join(' / '));
  check('N5 中文 弹药军械 chip', chipsZh.some(c => c.indexOf('弹药军械') === 0), chipsZh.join(' / '));
  check('N6 中文 载具机械 chip', chipsZh.some(c => c.indexOf('载具机械') === 0), chipsZh.join(' / '));

  // 农人立绘在 characters 里，用搜索定位
  // 注意：必须先点「全部」chip 清掉分类筛选，否则搜索会叠加过滤 → 0 结果
  const allIdx = chipsZh.findIndex(c => c.indexOf('全部') === 0);
  if (allIdx >= 0) { await pg.click('.chip >> nth=' + allIdx); await pg.waitForTimeout(450); }
  await pg.fill('#search', '镰刀');
  await pg.waitForTimeout(500);
  check('N7 中文搜镰刀命中 1 张', (await pg.$$('.card')).length === 1, String((await pg.$$('.card')).length));
  if ((await pg.$$('.card')).length === 1) {
    check('N8 镰刀卡中文名', (await T('.card-meta h3')).indexOf('镰刀') > 0, await T('.card-meta h3'));
  }
  await pg.fill('#search', '');
  await pg.waitForTimeout(400);
  await pg.fill('#search', 'pitchfork');
  await pg.waitForTimeout(500);
  check('N9 英文搜 pitchfork 命中 1 张', (await pg.$$('.card')).length === 1, String((await pg.$$('.card')).length));

  // 英文搜 ammo 关键词
  await pg.fill('#search', 'cannonball');
  await pg.waitForTimeout(500);
  check('N10 英文搜 cannonball 命中 1 张', (await pg.$$('.card')).length === 1, String((await pg.$$('.card')).length));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

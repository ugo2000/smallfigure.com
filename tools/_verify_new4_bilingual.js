/* 本轮新增：异星生物 / 异星植物 / 石器原始 / 奇色液体 四组中英双语专项验收 */
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

  // 四个新分类的英文 chip + 筛出张数 + 灯箱英文名
  for (const [key, label, n] of [['Alien Creatures', 'Alien Creatures', 4],
                                 ['Alien Flora', 'Alien Flora', 4],
                                 ['Stone Age', 'Stone Age & Primitives', 5],
                                 ['Colored Potions', 'Colored Potions', 4]]) {
    const i = chipsEn.findIndex(c => c.indexOf(key) === 0);
    check('Q1 英文 ' + label + ' chip', i >= 0, i >= 0 ? chipsEn[i] : chipsEn.join(' / '));
    if (i < 0) continue;
    await pg.click('.chip >> nth=' + i);
    await pg.waitForTimeout(450);
    check('Q2 点' + label + '筛出 ' + n + ' 张', (await cards()) === n, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(500);
    const lbName = await T('#lbName');
    const lbDesc = await T('#lbDesc');
    check('Q3 ' + label + ' 灯箱英文名', !!lbName && !/[一-龥]/.test(lbName), lbName);
    check('Q4 ' + label + ' 灯箱英文简介无中文', !!lbDesc && !/[一-龥]/.test(lbDesc), (lbDesc||'').slice(0, 70));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  // 切中文：四个新分类 chip + 名称
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(700);
  const chipsZh = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(ZH):', chipsZh.join(' / '));
  for (const [label, n] of [['异星生物', 4], ['异星植物', 4], ['石器原始', 5], ['奇色液体', 4]]) {
    const i = chipsZh.findIndex(c => c.indexOf(label) === 0);
    check('Q5 中文 ' + label + ' chip', i >= 0, i >= 0 ? chipsZh[i] : chipsZh.join(' / '));
    if (i < 0) continue;
    await pg.click('.chip >> nth=' + i);
    await pg.waitForTimeout(450);
    check('Q6 点中文' + label + '筛出 ' + n + ' 张', (await cards()) === n, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(450);
    check('Q7 ' + label + ' 灯箱中文名', (await T('#lbName')).indexOf(label) > 0 || (await T('#lbName')).indexOf('石器') > 0, await T('#lbName'));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(250);
  }

  // 搜索定位：必须先点「全部」chip 清掉分类筛选，否则搜索会叠加过滤 → 0 结果
  const allIdx = chipsZh.findIndex(c => c.indexOf('全部') === 0);
  if (allIdx >= 0) { await pg.click('.chip >> nth=' + allIdx); await pg.waitForTimeout(450); }

  const cases = [
    ['水晶甲壳', 1, '异星生物中文'],
    ['螺旋星藤', 1, '异星植物中文'],
    ['燧石战斧', 1, '石器中文'],
    ['品红锥形瓶', 1, '奇色液体中文'],
    ['alien creatures', 4, '异星生物英文分类名'],
    ['alien flora', 4, '异星植物英文分类名'],
    ['colored potions', 4, '奇色液体英文分类名'],
    ['flint', 1, '石器英文 flint']
  ];
  for (const [q, n, label] of cases) {
    await pg.fill('#search', '');
    await pg.waitForTimeout(250);
    await pg.fill('#search', q);
    await pg.waitForTimeout(500);
    check('Q8 搜「' + q + '」命中 ' + n + ' 张', (await cards()) === n, label + ' → ' + (await cards()));
  }

  await pg.fill('#search', '');
  await pg.waitForTimeout(400);
  check('Q9 清空搜索后回到 91 张', (await cards()) === 91, String(await cards()));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

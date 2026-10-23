/* 武器装备分类的中英双语专项验收 */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
(async () => {
  const browser = await pw.chromium.launch({ executablePath: EXE, args: ['--mute-audio', '--proxy-server=http://127.0.0.1:7897'] });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 1000 }, locale: 'en-US' });
  const errors = [];
  pg.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await pg.goto('https://www.smallfigure.com/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(2000);

  let pass = 0, fail = 0;
  const check = (n, ok, x) => { console.log((ok ? 'PASS' : 'FAIL') + ' | ' + n + (x ? ' | ' + x : '')); ok ? pass++ : fail++; };

  const chipTexts = await pg.$$eval('.chip', els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  check('W1 英文分类 chips', chipTexts.some(t => t.indexOf('Weapons & Gear') === 0), chipTexts.join(' | '));
  check('W2 英文徽章分类', chipTexts.some(t => t.indexOf('Badges') === 0), chipTexts.join(' | '));

  // 点 Weapons & Gear
  for (const c of await pg.$$('.chip')) {
    if ((await c.innerText()).indexOf('Weapons & Gear') === 0) { await c.click(); break; }
  }
  await pg.waitForTimeout(1200);
  const cards = await pg.$$('.card');
  check('W3 英文武器分类卡片数 6', cards.length === 6, String(cards.length));
  const names = await pg.$$eval('.card-meta h3', els => els.map(e => e.innerText.trim()));
  check('W4 英文武器名', names[0] === 'Resonance War Hammer · Weapon', names.join(' / '));
  check('W5 英文计数行', (await pg.$eval('#countLine', e => e.innerText)).indexOf('6') > -1, await pg.$eval('#countLine', e => e.innerText));

  // 切中文
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(900);
  const zhChips = await pg.$$eval('.chip', els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  check('W6 中文分类名', zhChips.some(t => t.indexOf('武器装备') === 0), zhChips.join(' | '));
  const zhNames = await pg.$$eval('.card-meta h3', els => els.map(e => e.innerText.trim()));
  check('W7 中文武器名', zhNames[0] === '共鸣战锤 · 武器', zhNames.join(' / '));

  // 打开一个武器的灯箱，检查中英简介
  await pg.click('.card');
  await pg.waitForTimeout(800);
  const lbName = await pg.$eval('#lbName', e => e.innerText);
  const lbDesc = await pg.$eval('#lbDesc', e => e.innerText);
  check('W8 灯箱中文名', lbName === '共鸣战锤 · 武器', lbName);
  check('W9 灯箱中文简介含版权说明', lbDesc.indexOf('原创系列') === 0, lbDesc.slice(0, 40));
  await pg.keyboard.press('Escape');

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

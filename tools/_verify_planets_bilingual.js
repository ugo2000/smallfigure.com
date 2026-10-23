/* 星球徽志（Planets）分类中英双语专项验收
 *
 * 设计：搜索命中数全部由本脚本从线上 data/images.json 按 app.js 的 haystack 逻辑
 * 实时复算（不靠预设），再与界面渲染出的卡片数对比。最后回到「全部」断言总数。
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
  const check = (n, ok, extra) => { console.log((ok ? 'PASS' : 'FAIL') + ' | ' + n + (extra ? ' | ' + extra : '')); ok ? pass++ : fail++; };
  const cards = () => pg.$$('.card').then(a => a.length);

  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);

  // 拉线上真实数据（绕过 5 分钟边缘缓存），用与 app.js 完全一致的 haystack 复算
  const live = await pg.evaluate(async () => {
    const r = await fetch('/data/images.json', { cache: 'no-store' });
    return r.json();
  });
  const hayOf = im => (im.name + ' ' + (im.nameEn || '') + ' ' +
    im.desc + ' ' + (im.descEn || '') + ' ' +
    (im.tags || []).join(' ') + ' ' + ((im.tagsEn) || []).join(' ') + ' ' +
    im.categoryLabel + ' ' + (im.categoryLabelEn || '')).toLowerCase();
  const countHit = q => live.images.filter(im => hayOf(im).indexOf(q.toLowerCase()) > -1).length;

  /* 英文：Planet Sigils chip + 筛出 6 张 + 灯箱英文名/简介/标签无中文 */
  const chipsEn = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(EN):', chipsEn.join(' / '));
  const iEn = chipsEn.findIndex(c => c.indexOf('Planet Sigils') === 0);
  check('P1 英文 Planet Sigils chip', iEn >= 0, iEn >= 0 ? chipsEn[iEn] : chipsEn.join(' / '));
  if (iEn >= 0) {
    await pg.click('.chip >> nth=' + iEn);
    await pg.waitForTimeout(500);
    check('P2 点 Planet Sigils 筛出 6 张', (await cards()) === 6, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(600);
    const nm = await pg.evaluate(() => document.querySelector('#lbName')?.textContent || null);
    const ds = await pg.evaluate(() => document.querySelector('#lbDesc')?.textContent || null);
    check('P3 灯箱英文名无中文', !!nm && !/[一-龥]/.test(nm), nm);
    check('P4 灯箱英文简介无中文', !!ds && !/[一-龥]/.test(ds), (ds || '').slice(0, 70));
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('P5 灯箱英文标签无中文', tags.length > 0 && !tags.some(t => /[一-龥]/.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  /* 中文：星球徽志 chip + 筛出 6 张 + 灯箱中文名含「星球徽志」+ 标签无英文 */
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(700);
  const chipsZh = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(ZH):', chipsZh.join(' / '));
  const iZh = chipsZh.findIndex(c => c.indexOf('星球徽志') === 0);
  check('P6 中文 星球徽志 chip', iZh >= 0, iZh >= 0 ? chipsZh[iZh] : chipsZh.join(' / '));
  if (iZh >= 0) {
    await pg.click('.chip >> nth=' + iZh);
    await pg.waitForTimeout(500);
    check('P7 点星球徽志筛出 6 张', (await cards()) === 6, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(600);
    const nm = await pg.evaluate(() => document.querySelector('#lbName')?.textContent || null);
    check('P8 灯箱中文名含「星球徽志」', (nm || '').indexOf('星球徽志') > 0, nm);
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('P9 灯箱中文标签无英文', tags.length > 0 && !tags.some(t => /[A-Za-z]{2,}/.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  /* 回到「全部」清掉分类筛选，再做搜索端到端校验 */
  const allIdx = chipsZh.findIndex(c => c.indexOf('全部') === 0);
  if (allIdx >= 0) { await pg.click('.chip >> nth=' + allIdx); await pg.waitForTimeout(450); }

  const queries = ['planet', '星球', 'weird', '奇怪', 'shard ring', '碎环', 'eye', '巨眼',
    'cube', '立方', 'molten', '熔核', 'twin', '脐', 'nested', '套球',
    'icon', '行星', 'Planet Sigils', '星球徽志'];
  for (const q of queries) {
    const exp = countHit(q);
    await pg.fill('#search', '');
    await pg.waitForTimeout(200);
    await pg.fill('#search', q);
    await pg.waitForTimeout(450);
    check('P10 搜「' + q + '」命中 ' + exp + ' 张', (await cards()) === exp, '实际 ' + (await cards()));
  }

  await pg.fill('#search', '');
  await pg.waitForTimeout(400);
  check('P11 清空搜索回到 97 张', (await cards()) === 97, String(await cards()));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

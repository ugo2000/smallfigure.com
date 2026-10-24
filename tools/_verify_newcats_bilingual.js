/* 5 个新分类（古怪乐器/物理武器/变异稻草人/多牙生物/古怪外星石头）中英双语专项验收
 *
 * 设计：搜索命中数全部由本脚本从线上 data/images.json 按 app.js 的 haystack 逻辑
 * 实时复算（不靠预设），再与界面渲染出的卡片数对比。最后回到「全部」断言总数。
 */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'https://www.smallfigure.com';

const CATS = [
  { key: 'instruments', en: 'Weird Instruments', zh: '古怪乐器', n: 4 },
  { key: 'physics', en: 'Physics Weapons', zh: '物理武器', n: 4 },
  { key: 'scarecrows', en: 'Mutant Scarecrows', zh: '变异稻草人', n: 4 },
  { key: 'fangs', en: 'Many-Fanged Beasts', zh: '多牙生物', n: 4 },
  { key: 'astones', en: 'Alien Stones', zh: '古怪外星石头', n: 4 },
];

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

  /* ---------- 数据层：5 个新分类各 4 条 ---------- */
  for (const c of CATS) {
    const n = live.images.filter(im => im.category === c.key).length;
    check('N0 线上 ' + c.key + ' 分类 4 条', n === c.n, '实际 ' + n);
  }

  /* ---------- 英文：5 个 chip + 各筛 4 张 + 灯箱纯净 ---------- */
  for (const c of CATS) {
    const chipsEn = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
    const iEn = chipsEn.findIndex(x => x.indexOf(c.en) === 0);
    check('N1 英文 ' + c.en + ' chip', iEn >= 0, iEn >= 0 ? chipsEn[iEn] : chipsEn.join(' / '));
    if (iEn < 0) continue;
    await pg.click('.chip >> nth=' + iEn);
    await pg.waitForTimeout(500);
    check('N2 点 ' + c.en + ' 筛出 ' + c.n + ' 张', (await cards()) === c.n, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(600);
    const nm = await pg.evaluate(() => document.querySelector('#lbName')?.textContent || null);
    const ds = await pg.evaluate(() => document.querySelector('#lbDesc')?.textContent || null);
    check('N3 ' + c.en + ' 灯箱英文名无中文', !!nm && !/[一-龥]/.test(nm), nm);
    check('N4 ' + c.en + ' 灯箱英文简介无中文', !!ds && !/[一-龥]/.test(ds), (ds || '').slice(0, 60));
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('N5 ' + c.en + ' 灯箱英文标签无中文', tags.length > 0 && !tags.some(t => /[一-龥]/.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  /* ---------- 中文：5 个 chip + 各筛 4 张 + 灯箱名含分类词 ---------- */
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(700);
  for (const c of CATS) {
    const chipsZh = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
    const iZh = chipsZh.findIndex(x => x.indexOf(c.zh) === 0);
    check('N6 中文 ' + c.zh + ' chip', iZh >= 0, iZh >= 0 ? chipsZh[iZh] : chipsZh.join(' / '));
    if (iZh < 0) continue;
    await pg.click('.chip >> nth=' + iZh);
    await pg.waitForTimeout(500);
    check('N7 点' + c.zh + '筛出 ' + c.n + ' 张', (await cards()) === c.n, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(600);
    const nm = await pg.evaluate(() => document.querySelector('#lbName')?.textContent || null);
    check('N8 ' + c.zh + ' 灯箱中文名含分类词', (nm || '').indexOf(c.zh) > -1, nm);
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('N9 ' + c.zh + ' 灯箱中文标签无英文', tags.length > 0 && !tags.some(t => /[A-Za-z]{2,}/.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  /* ---------- 回到「全部」，搜索端到端校验（命中数线上复算） ---------- */
  const chipsZh = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  const allIdx = chipsZh.findIndex(x => x.indexOf('全部') === 0);
  if (allIdx >= 0) { await pg.click('.chip >> nth=' + allIdx); await pg.waitForTimeout(450); }

  const queries = ['乐器', 'instrument', '号角', '竖琴', '风琴', '物理', '弩炮', '弹簧', '链锤', '弹弓',
    '稻草人', 'scarecrow', '南瓜', '纽扣', '乌鸦', '向日葵',
    '尖牙', '多牙', 'fangs', '七鳃鳗', '吸盘', '蜘蛛',
    '外星石头', '石头', 'alien stone', '晶洞', '浮石', '蜂窝', '悬浮', '熔岩'];
  for (const q of queries) {
    const exp = countHit(q);
    await pg.fill('#search', '');
    await pg.waitForTimeout(200);
    await pg.fill('#search', q);
    await pg.waitForTimeout(450);
    check('N10 搜「' + q + '」命中 ' + exp + ' 张', (await cards()) === exp, '实际 ' + (await cards()));
  }

  await pg.fill('#search', '');
  await pg.waitForTimeout(400);
  check('N11 清空搜索回到 120 张', (await cards()) === 120, String(await cards()));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

/* 小人动图（Mini Animations）分类中英双语专项验收
 *
 * 设计：搜索命中数全部由本脚本从线上 data/images.json 按 app.js 的 haystack 逻辑
 * 实时复算（不靠预设），再与界面渲染出的卡片数对比。
 * 动图专项：卡片用静态海报缩略图，灯箱用动画 WebP 本体；
 * 通过 fetch 动图本体校验文件头含 ANIM/ANMF chunk（真动画而非静图）。
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

  /* ---------- 数据层：3 条动图条目字段 ---------- */
  const motions = live.images.filter(im => im.category === 'motion');
  check('M0 线上 motion 分类 3 条', motions.length === 3, '实际 ' + motions.length);
  check('M0b 全部 animated=true 且 file 为 .webp',
    motions.length === 3 && motions.every(im => im.animated === true && /\.webp$/.test(im.file)),
    motions.map(im => im.id + ':' + im.file).join(' | '));

  /* ---------- 英文：Mini Animations chip + 筛出 3 张 ---------- */
  const chipsEn = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(EN):', chipsEn.join(' / '));
  const iEn = chipsEn.findIndex(c => c.indexOf('Mini Animations') === 0);
  check('M1 英文 Mini Animations chip', iEn >= 0, iEn >= 0 ? chipsEn[iEn] : chipsEn.join(' / '));
  if (iEn >= 0) {
    await pg.click('.chip >> nth=' + iEn);
    await pg.waitForTimeout(500);
    check('M2 点 Mini Animations 筛出 3 张', (await cards()) === 3, String(await cards()));

    // 卡片：anim 徽章 + 海报缩略图可加载（宽高>0、非 0 字节错误）
    const badgeN = await pg.$$('.card .badge.anim').then(a => a.length);
    check('M3 卡片 anim 徽章 3 个', badgeN === 3, String(badgeN));
    const thumbOk = await pg.evaluate(() => Array.from(document.querySelectorAll('.card img')).every(img =>
      img.complete && img.naturalWidth > 0 && /_t\.webp/.test(img.src.split('?')[0])));
    check('M4 卡片海报缩略图全部加载成功', thumbOk,
      await pg.$$eval('.card img', els => els.map(e => e.getAttribute('src')).join(' | ')));

    // 灯箱：动画 WebP 本体（等加载完成，naturalWidth>0，且文件头含 ANIM/ANMF chunk）
    await pg.click('.card');
    let lbLoaded = false;
    try {
      await pg.waitForFunction(() => {
        const img = document.querySelector('#lbStage img');
        return !!img && img.complete && img.naturalWidth > 0;
      }, { timeout: 20000 });
      lbLoaded = true;
    } catch (e) { /* 超时即失败 */ }
    const lbSrc = await pg.evaluate(() => {
      const img = document.querySelector('#lbStage img');
      return img ? img.getAttribute('src') || img.src : null;
    });
    check('M5 灯箱动图本体加载(naturalWidth>0)', !!lbSrc && lbLoaded, lbSrc);
    const animChunk = await pg.evaluate(async (src) => {
      const r = await fetch(src, { cache: 'no-store' });
      const buf = new Uint8Array(await r.arrayBuffer());
      const head = Array.from(buf.slice(0, 64)).map(b => String.fromCharCode(b)).join('');
      return { hasAnim: head.indexOf('ANIM') > -1, hasFrames: head.indexOf('ANMF') > -1 || head.indexOf('ANIM') > -1, size: buf.length };
    }, lbSrc);
    check('M6 动图本体含 ANIM chunk（真循环动画）', !!animChunk && animChunk.hasAnim,
      lbSrc + ' (' + (animChunk ? animChunk.size + 'B' : 'n/a') + ')');
    const typeTxt = await pg.evaluate(() => {
      const dts = Array.from(document.querySelectorAll('#lbMeta dt, .lb-meta dt'));
      const i = dts.findIndex(d => d.textContent.indexOf('Type') > -1 || d.textContent.indexOf('类型') > -1);
      return i >= 0 ? dts[i].nextElementSibling.textContent : null;
    });
    console.log('  灯箱类型行:', typeTxt);
    const nm = await pg.evaluate(() => document.querySelector('#lbName')?.textContent || null);
    const ds = await pg.evaluate(() => document.querySelector('#lbDesc')?.textContent || null);
    check('M7 灯箱英文名无中文', !!nm && !/[一-龥]/.test(nm), nm);
    check('M8 灯箱英文简介无中文', !!ds && !/[一-龥]/.test(ds), (ds || '').slice(0, 70));
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('M9 灯箱英文标签无中文', tags.length > 0 && !tags.some(t => /[一-龥]/.test(t)), tags.join(' / '));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  /* ---------- 中文：小人动图 chip + 筛出 3 张 + 灯箱中文名含「动图」 ---------- */
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(700);
  const chipsZh = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  console.log('  chips(ZH):', chipsZh.join(' / '));
  const iZh = chipsZh.findIndex(c => c.indexOf('小人动图') === 0);
  check('M10 中文 小人动图 chip', iZh >= 0, iZh >= 0 ? chipsZh[iZh] : chipsZh.join(' / '));
  if (iZh >= 0) {
    await pg.click('.chip >> nth=' + iZh);
    await pg.waitForTimeout(500);
    check('M11 点小人动图筛出 3 张', (await cards()) === 3, String(await cards()));
    await pg.click('.card');
    await pg.waitForTimeout(600);
    const nm = await pg.evaluate(() => document.querySelector('#lbName')?.textContent || null);
    check('M12 灯箱中文名含「动图」', (nm || '').indexOf('动图') > -1, nm);
    const tags = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    check('M13 灯箱中文标签无英文', tags.length > 0 && !tags.some(t => /[A-Za-z]{2,}/.test(t)), tags.join(' / '));
    const typeZh = await pg.evaluate(() => {
      const dts = Array.from(document.querySelectorAll('#lbMeta dt, .lb-meta dt'));
      const i = dts.findIndex(d => d.textContent.indexOf('类型') > -1);
      return i >= 0 ? dts[i].nextElementSibling.textContent : null;
    });
    check('M14 中文类型行显示 WebP 循环动图', (typeZh || '').indexOf('WebP 循环动图') > -1, typeZh);
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  /* ---------- 回到「全部」，搜索端到端校验（命中数线上复算） ---------- */
  const allIdx = chipsZh.findIndex(c => c.indexOf('全部') === 0);
  if (allIdx >= 0) { await pg.click('.chip >> nth=' + allIdx); await pg.waitForTimeout(450); }

  const queries = ['动图', 'animation', '挖矿', 'mining', '钓鱼', 'fishing', '射击', 'shooting',
    '小人', 'little figure', '循环', 'loop', '小人动图', 'Mini Animations', '镐', 'pickaxe'];
  for (const q of queries) {
    const exp = countHit(q);
    await pg.fill('#search', '');
    await pg.waitForTimeout(200);
    await pg.fill('#search', q);
    await pg.waitForTimeout(450);
    check('M15 搜「' + q + '」命中 ' + exp + ' 张', (await cards()) === exp, '实际 ' + (await cards()));
  }

  await pg.fill('#search', '');
  await pg.waitForTimeout(400);
  check('M16 清空搜索回到 120 张', (await cards()) === 120, String(await cards()));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

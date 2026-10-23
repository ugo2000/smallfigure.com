/* 线上 i18n 抽查：默认英文 → 切中文 → 持久化（打真实域名） */
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
  const check = (name, ok, extra) => {
    console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra ? ' | ' + extra : ''));
    ok ? pass++ : fail++;
  };
  const T = (sel, prop) => pg.evaluate(([s, p]) => {
    const el = document.querySelector(s);
    return el ? el[p] : null;
  }, [sel, prop || 'textContent']);

  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);

  check('O1 线上默认英文标题', (await T('title')) === 'smallfigure · Original Asset Gallery', await T('title'));
  check('O2 线上英文副标题', (await T('.subtitle')).indexOf('Everything has its own story') === 0, await T('.subtitle'));
  check('O3 线上卡片数 91', (await pg.$$('.card')).length === 91, String((await pg.$$('.card')).length));
  check('O4 线上英文卡片名', (await T('.card-meta h3')) === 'Laozhang · Character Art', await T('.card-meta h3'));

  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(600);
  check('O5 切中文标题', (await T('title')) === 'smallfigure · 原创素材图鉴', await T('title'));
  check('O6 切中文卡片名', (await T('.card-meta h3')) === '老张 · 立绘', await T('.card-meta h3'));
  check('O7 切中文计数行', (await T('#countLine')).indexOf('共 91 张') === 0, await T('#countLine'));

  await pg.click('.card');
  await pg.waitForTimeout(600);
  check('O8 线上灯箱中文', (await T('#lbName')) === '老张 · 立绘', await T('#lbName'));
  check('O9 线上灯箱中文 meta', (await T('#lbMeta dt')) === '原始尺寸', await T('#lbMeta dt'));
  await pg.keyboard.press('Escape');

  const api = await pg.evaluate(() => fetch('api/counts').then(r => r.json()).catch(() => null));
  check('O10 线上计数 API', !!api && api.ok === true, JSON.stringify(api).slice(0, 80));

  // 图片 URL 必须带内容版本号：图片改了 URL 也要变，否则 CDN 24h 缓存会继续发旧图
  const srcs = await pg.$$eval('.card img', els => els.map(e => e.getAttribute('src') || ''));
  check('O11 全部缩略图 URL 带版本号', srcs.length > 0 && srcs.every(s => /\?v=[0-9a-f]{8}$/.test(s)),
    srcs.filter(s => !/\?v=/.test(s)).slice(0, 3).join(' | '));

  // 新增的「食物美食」分类：chip 出现 + 点击后筛出 5 张 + 卡片名正确
  const chips = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  check('O12 食物分类 chip 存在（中文）', chips.some(c => c.indexOf('食物') === 0 || c.indexOf('食物美食') === 0),
    chips.join(' / '));
  const foodIdx = chips.findIndex(c => c.indexOf('食物') === 0);
  if (foodIdx >= 0) {
    await pg.click('.chip >> nth=' + foodIdx);
    await pg.waitForTimeout(500);
    check('O13 点食物分类筛出 5 张', (await pg.$$('.card')).length === 5, String((await pg.$$('.card')).length));
    await pg.click('.card');
    await pg.waitForTimeout(500);
    check('O14 食物灯箱中文名', (await T('#lbName')).indexOf('· 食物') > 0, await T('#lbName'));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }
  // 新增：弹药军械 / 载具机械 两个分类
  for (const [key, label, n, kw] of [['弹药', '弹药军械', 4, '弹药'], ['载具', '载具机械', 4, '载具']]) {
    const i = chips.findIndex(c => c.indexOf(key) === 0);
    if (i < 0) { check('O15 ' + label + ' chip 存在', false, chips.join(' / ')); continue; }
    await pg.click('.chip >> nth=' + i);
    await pg.waitForTimeout(450);
    check('O15 ' + label + ' chip 存在', true, 'count=' + n);
    check('O16 点' + label + '筛出 ' + n + ' 张', (await pg.$$('.card')).length === n, String((await pg.$$('.card')).length));
    await pg.click('.card');
    await pg.waitForTimeout(450);
    check('O17 ' + label + '灯箱中文名', (await T('#lbName')).indexOf(kw) > 0, await T('#lbName'));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(250);
  }

  // 新增：异星生物 / 异星植物 / 石器原始 / 奇色液体 / 魔法书籍 / 魔法法器 / 城堡建筑 / 古旧家具 / 奇械科技
  for (const [key, label, n, kw] of [['异星生物', '异星生物', 4, '异星生物'],
                                   ['异星植物', '异星植物', 4, '异星植物'],
                                   ['石器', '石器原始', 5, '石器'],
                                   ['奇色液体', '奇色液体', 4, '奇色液体'],
                                   ['魔法书籍', '魔法书籍', 5, '魔法书籍'],
                                   ['魔法法器', '魔法法器', 4, '法器'],
                                   ['城堡', '城堡建筑', 4, '城堡'],
                                   ['古旧家具', '古旧家具', 4, '家具'],
                                   ['奇械科技', '奇械科技', 4, '科技']]) {
    const i = chips.findIndex(c => c.indexOf(key) === 0);
    if (i < 0) { check('O18 ' + label + ' chip 存在', false, chips.join(' / ')); continue; }
    await pg.click('.chip >> nth=' + i);
    await pg.waitForTimeout(450);
    check('O18 ' + label + ' chip 存在', true, chips[i]);
    check('O19 点' + label + '筛出 ' + n + ' 张', (await pg.$$('.card')).length === n, String((await pg.$$('.card')).length));
    await pg.click('.card');
    await pg.waitForTimeout(450);
    check('O20 ' + label + ' 灯箱中文名', (await T('#lbName')).indexOf(kw) > 0, await T('#lbName'));
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(250);
  }

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

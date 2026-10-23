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

  check('O1 线上默认英文标题', (await T('title')) === 'smallfigure · Little Figure Gallery', await T('title'));
  check('O2 线上英文副标题', (await T('.subtitle')).indexOf('Everyone has a story') === 0, await T('.subtitle'));
  check('O3 线上卡片数 17', (await pg.$$('.card')).length === 17);
  check('O4 线上英文卡片名', (await T('.card-meta h3')) === 'Laozhang · Character Art', await T('.card-meta h3'));

  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(600);
  check('O5 切中文标题', (await T('title')) === 'smallfigure · 原创小人图鉴', await T('title'));
  check('O6 切中文卡片名', (await T('.card-meta h3')) === '老张 · 立绘', await T('.card-meta h3'));
  check('O7 切中文计数行', (await T('#countLine')).indexOf('共 17 张') === 0, await T('#countLine'));

  await pg.click('.card');
  await pg.waitForTimeout(600);
  check('O8 线上灯箱中文', (await T('#lbName')) === '老张 · 立绘', await T('#lbName'));
  check('O9 线上灯箱中文 meta', (await T('#lbMeta dt')) === '原始尺寸', await T('#lbMeta dt'));
  await pg.keyboard.press('Escape');

  const api = await pg.evaluate(() => fetch('api/counts').then(r => r.json()).catch(() => null));
  check('O10 线上计数 API', !!api && api.ok === true, JSON.stringify(api).slice(0, 80));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

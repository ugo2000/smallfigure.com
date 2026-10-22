/* 下载计数专项验证：阈值 100 的展示规则 + 下载上报链路 */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'http://127.0.0.1:8788';

(async () => {
  const browser = await pw.chromium.launch({ executablePath: EXE, args: ['--mute-audio'] });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const errors = [];
  pg.on('pageerror', e => errors.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  let pass = 0, fail = 0;
  const check = (name, ok, extra) => {
    console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra ? ' | ' + extra : ''));
    ok ? pass++ : fail++;
  };

  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(800); // 等 /api/counts 回来

  // 1. 未达标（hero-t=2）不显示徽章
  const heroCard = pg.locator('.card[data-id="hero-t"]');
  check('hero-t（2 次）无下载徽章', await heroCard.locator('.badge.dl').count() === 0);

  // 2. 达标（zone-bell=137）显示徽章
  const bellCard = pg.locator('.card[data-id="zone-bell"]');
  await bellCard.waitFor({ state: 'visible' });
  const dlBadge = bellCard.locator('.badge.dl');
  check('zone-bell（137 次）有下载徽章', await dlBadge.count() === 1);
  if (await dlBadge.count()) {
    const t = (await dlBadge.innerText()).replace(/\s+/g, ' ').trim();
    check('徽章文案 ↓ 137', t.indexOf('137') >= 0, JSON.stringify(t));
  }

  // 3. 灯箱 meta：未达标无「下载次数」行
  await heroCard.click();
  await pg.waitForTimeout(300);
  const heroMeta = await pg.locator('#lbMeta').innerText();
  check('hero-t 灯箱无下载次数行', heroMeta.indexOf('下载次数') < 0, JSON.stringify(heroMeta.replace(/\n/g, ' ')));
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(200);

  // 4. 灯箱 meta：达标显示「下载次数 137 次」
  await bellCard.click();
  await pg.waitForTimeout(300);
  const bellMeta = await pg.locator('#lbMeta').innerText();
  check('zone-bell 灯箱显示下载次数', bellMeta.indexOf('下载次数') >= 0 && bellMeta.indexOf('137') >= 0,
    JSON.stringify(bellMeta.replace(/\n/g, ' ')));

  // 5. 点击下载 → 上报 +1、徽章实时刷新、文件真的下载
  const dlPromise = pg.waitForEvent('download', { timeout: 8000 });
  await pg.click('#lbDownload');
  const dl = await dlPromise;
  const fname = dl.suggestedFilename();
  await pg.waitForTimeout(500);
  const meta2 = await pg.locator('#lbMeta').innerText();
  check('下载后灯箱计数变 138', meta2.indexOf('138') >= 0, JSON.stringify(meta2.replace(/\n/g, ' ')));
  const badge2 = await bellCard.locator('.badge.dl').count();
  const badge2Text = badge2 ? (await bellCard.locator('.badge.dl').innerText()).replace(/\s+/g, ' ') : '';
  check('下载后网格徽章变 138', badge2 === 1 && badge2Text.indexOf('138') >= 0, JSON.stringify(badge2Text.trim()));
  check('文件下载事件触发', /\.(png|webp)$/i.test(fname), fname);
  await pg.keyboard.press('Escape');

  // 6. 接口侧确认
  const c = await pg.evaluate(async () => (await (await fetch('api/counts')).json()).counts);
  check('接口计数 zone-bell=138', c['zone-bell'] === 138, JSON.stringify(c));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

/* 新分类视觉抽查：截线上四个新分类的网格图，供人工眼检 */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'https://www.smallfigure.com';

(async () => {
  const browser = await pw.chromium.launch({
    executablePath: EXE,
    args: ['--mute-audio', '--proxy-server=http://127.0.0.1:7897']
  });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(600);

  for (const [cat, file] of [['aliens', '_shot_aliens.png'], ['flora', '_shot_flora.png'],
                             ['stoneage', '_shot_stoneage.png'], ['potions', '_shot_potions.png']]) {
    await pg.click('.chip[data-cat="all"]');
    await pg.waitForTimeout(200);
    await pg.click('.chip[data-cat="' + cat + '"]');
    await pg.waitForTimeout(1200);
    /* 必须等图片真正解码完，否则元素截图会拍到空白卡片 */
    await pg.evaluate(async () => {
      await Promise.all([...document.querySelectorAll('.card img')].map(i => i.decode().catch(() => {})));
    });
    await pg.waitForTimeout(500);
    const grid = await pg.$('#grid');
    await grid.screenshot({ path: 'tools/' + file });
    console.log('已截图:', 'tools/' + file);
  }
  await browser.close();
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

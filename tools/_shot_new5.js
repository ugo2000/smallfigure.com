/* 本轮四个新分类视觉确认 */
const pw = require('playwright-core');
(async () => {
  const b = await pw.chromium.launch({
    executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe',
    args: ['--mute-audio', '--proxy-server=http://127.0.0.1:7897']
  });
  const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  await p.goto('https://www.smallfigure.com/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  await p.click('.site-header .lang-btn[data-lang="zh"]');
  await p.waitForTimeout(700);
  for (const [cat, f] of [['implements', '_shot_impl.png'], ['castles', '_shot_castles.png'],
                          ['furniture', '_shot_furn.png'], ['techdev', '_shot_tech.png']]) {
    await p.click('.chip[data-cat="all"]');
    await p.waitForTimeout(250);
    await p.click('.chip[data-cat="' + cat + '"]');
    await p.waitForTimeout(1300);
    await p.evaluate(async () => { await Promise.all([...document.querySelectorAll('.card img')].map(i => i.decode().catch(() => {}))); });
    await p.waitForTimeout(500);
    await (await p.$('#grid')).screenshot({ path: 'tools/' + f });
    console.log('ok', f);
  }
  await b.close();
})();

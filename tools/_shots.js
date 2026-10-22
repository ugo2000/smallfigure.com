const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'http://127.0.0.1:8901';
(async () => {
  const b = await pw.chromium.launch({ executablePath: EXE, args: ['--mute-audio'] });
  const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(900);
  await pg.screenshot({ path: 'D:/WB/smallfigure.com/tools/_shot_grid.png' });
  // 徽章分类 + 灯箱
  await pg.click('.chip[data-cat="badges"]');
  await pg.waitForTimeout(700);
  await pg.screenshot({ path: 'D:/WB/smallfigure.com/tools/_shot_anim.png' });
  await pg.locator('.card').first().click();
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: 'D:/WB/smallfigure.com/tools/_shot_lightbox.png' });
  await b.close();
  console.log('截图完成');
})().catch(e => { console.error(e.message); process.exit(1); });

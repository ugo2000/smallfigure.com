const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'https://www.smallfigure.com';
(async () => {
  const browser = await pw.chromium.launch({ executablePath: EXE, args: ['--mute-audio','--proxy-server=http://127.0.0.1:7897'] });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'zh-CN' });
  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);
  const chips = await pg.$$eval('.chip', els => els.map(e => e.textContent.trim()));
  for (const [key, out] of [['弹药','_shot_ammo'], ['载具','_shot_veh']]) {
    const i = chips.findIndex(c => c.indexOf(key) === 0);
    await pg.click('.chip >> nth=' + i);
    await pg.waitForTimeout(900);
    await pg.screenshot({ path: 'processed/' + out + '.png' });
    console.log('saved', out);
  }
  await browser.close();
})();

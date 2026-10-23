/* 魔法书籍分类视觉确认 */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'https://www.smallfigure.com';
(async () => {
  const browser = await pw.chromium.launch({ executablePath: EXE, args: ['--mute-audio','--proxy-server=http://127.0.0.1:7897'] });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(600);
  await pg.click('.chip[data-cat="books"]');
  await pg.waitForTimeout(1200);
  await pg.evaluate(async () => { await Promise.all([...document.querySelectorAll('.card img')].map(i => i.decode().catch(()=>{}))); });
  await pg.waitForTimeout(500);
  await (await pg.$('#grid')).screenshot({ path: 'tools/_shot_books.png' });
  console.log('ok');
  await browser.close();
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

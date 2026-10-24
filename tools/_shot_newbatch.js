/* 抓新九分类的线上截图（缩略图网格） */
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'https://smallfigure.com/';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('#grid .card', { timeout: 20000 });

  const shots = [
    { cat: 'currency',      file: 'tools/_shot_nb_currency.png' },
    { cat: 'symbols',       file: 'tools/_shot_nb_symbols.png' },
    { cat: 'ships',         file: 'tools/_shot_nb_ships.png' },
    { cat: 'spaceweapons',  file: 'tools/_shot_nb_spaceweapons.png' },
    { cat: 'flyboots',      file: 'tools/_shot_nb_flyboots.png' },
    { cat: 'shields',       file: 'tools/_shot_nb_shields.png' },
    { cat: 'energyblocks',  file: 'tools/_shot_nb_energyblocks.png' },
    { cat: 'morphmonsters', file: 'tools/_shot_nb_morphmonsters.png' },
    { cat: 'telescopes',    file: 'tools/_shot_nb_telescopes.png' },
  ];
  for (const s of shots) {
    await page.click('#chips .chip[data-cat="' + s.cat + '"]');
    await page.waitForTimeout(500);
    await page.evaluate(async () => {
      const imgs = [...document.querySelectorAll('#grid .card img')];
      for (const i of imgs) { i.loading = 'eager'; i.scrollIntoView(); }
      await new Promise(r => setTimeout(r, 200));
      await Promise.all(imgs.map(i => i.decode().catch(() => {})));
    });
    await page.waitForTimeout(300);
    await page.locator('#grid').screenshot({ path: s.file });
    console.log('saved', s.file);
  }
  await browser.close();
})().catch(e => { console.log('SCRIPT ERROR: ' + e.message); process.exit(2); });

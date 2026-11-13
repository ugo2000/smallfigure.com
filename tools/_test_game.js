/* Smallfigure Merge Museum 本地冒烟测试（playwright-core）
 * 运行：NODE_PATH=<node workspace>/node_modules node tools/_test_game.js
 * 需要先启动：python -m http.server 8088 --directory game
 */
const path = require('path');
const { chromium } = require('playwright-core');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'outputs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ': ' + r.url()); });

  await page.goto('http://127.0.0.1:8088/preview.html', { waitUntil: 'load' });
  await page.waitForSelector('#menu:not([hidden])', { timeout: 12000 });

  // ---- language: English default, Chinese opt-in, choice persists ----
  const langEn = {
    start: await page.locator('#btnStart').textContent(),
    chip: await page.locator('#btnLang').textContent(),
    subtitle: await page.locator('#menu h2').textContent()
  };
  const reviveHidden = await page.locator('#btnRevive').evaluate(el => el.hidden);
  await page.screenshot({ path: path.join(OUT, 'game-menu.png') });

  await page.click('#btnMenuLang');
  const langZh = {
    start: await page.locator('#btnStart').textContent(),
    chip: await page.locator('#btnLang').textContent(),
    subtitle: await page.locator('#menu h2').textContent()
  };
  await page.click('#btnCollection');
  await page.waitForSelector('#collection:not([hidden])');
  const firstCardZh = await page.locator('.coll-card').first().locator('.cc-name').textContent();
  await page.screenshot({ path: path.join(OUT, 'game-collection-zh.png') });
  await page.click('#btnCollClose');

  await page.reload({ waitUntil: 'load' });
  await page.waitForSelector('#menu:not([hidden])');
  const startAfterReload = await page.locator('#btnStart').textContent();
  await page.click('#btnLang');
  const startBackToEn = await page.locator('#btnStart').textContent();

  const langOK = langEn.start === 'START PLAYING' && langEn.chip === 'EN' &&
    langZh.start === '开始玩' && langZh.chip === '中' &&
    firstCardZh.includes('晶铃') && startAfterReload === '开始玩' &&
    startBackToEn === 'START PLAYING';

  // ---- gameplay ----
  await page.click('#btnStart');
  await page.waitForTimeout(300);
  const xs = [190, 205, 180, 215, 195, 210, 185, 200, 220, 190];
  for (const x of xs) {
    await page.mouse.click(x, 420);
    await page.waitForTimeout(470);
  }
  await page.waitForTimeout(2600);
  const scoreText = await page.locator('#scoreVal').textContent();
  const overVisible = await page.locator('#over').isVisible();
  await page.screenshot({ path: path.join(OUT, 'game-play.png') });

  if (overVisible) await page.click('#btnOverCollection');
  else await page.click('#btnCollection');
  await page.waitForSelector('#collection:not([hidden])');
  const cards = await page.locator('.coll-card').count();
  const unlocked = await page.locator('.coll-card:not(.locked)').count();
  await page.screenshot({ path: path.join(OUT, 'game-collection.png') });

  console.log(JSON.stringify({
    language: { en: langEn, zh: langZh, firstCardZh, startAfterReload, startBackToEn, pass: langOK },
    scoreText, overVisible, collectionCards: cards, unlockedCards: unlocked,
    reviveHidden, errors
  }, null, 2));

  await browser.close();
  if (errors.length || !langOK || !reviveHidden) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });

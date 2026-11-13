const { chromium } = require('playwright-core');
const BASE = 'http://127.0.0.1:8099';

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', args: ['--no-sandbox'] });
  const errors = [];
  const results = {};

  // --- 1) Game page: load + external requests + language toggle ---
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const ext = [];
    page.on('request', r => { const u = r.url(); if (/^https?:\/\//.test(u) && !u.startsWith(BASE)) ext.push(u); });
    page.on('pageerror', e => errors.push('game pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('game console: ' + m.text()); });
    await page.goto(BASE + '/game/', { waitUntil: 'load' });
    await page.waitForSelector('#menu:not([hidden])', { timeout: 10000 });
    results.gameMenuVisible = true;
    results.gameExternalRequests = ext;
    // default English
    const startEn = await page.textContent('#btnStart');
    results.defaultEnglishStart = startEn;
    // switch to Chinese via the EN chip
    await page.click('#btnLang');
    await page.waitForTimeout(150);
    const startZh = await page.textContent('#btnStart');
    results.afterToggleZhStart = startZh;
    results.langToggled = (startEn !== startZh) && /开始玩/.test(startZh);
    // privacy link present in brandbar
    results.privacyLink = await page.$eval('.brandbar a', a => a.getAttribute('href')).catch(() => null);
    await page.close();
  }

  // --- 2) Privacy page ---
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const ext = [];
    page.on('request', r => { const u = r.url(); if (/^https?:\/\//.test(u) && !u.startsWith(BASE)) ext.push(u); });
    page.on('pageerror', e => errors.push('privacy pageerror: ' + e.message));
    await page.goto(BASE + '/game/privacy.html', { waitUntil: 'load' });
    await page.waitForSelector('h1', { timeout: 5000 });
    results.privacyTitle = await page.title();
    results.privacyExternalRequests = ext;
    // toggle to Chinese
    await page.click('#bZh');
    await page.waitForTimeout(120);
    const htmlLang = await page.$eval('html', h => h.lang);
    results.privacyZh = (htmlLang === 'zh-CN');
    await page.close();
  }

  // --- 3) Main site still works + game link present ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push('main pageerror: ' + e.message));
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForSelector('.site-footer', { timeout: 10000 });
    results.mainGameLink = await page.$eval('a[href="/game/"]', a => a.textContent.trim()).catch(() => null);
    results.mainGrid = await page.$('#grid') ? true : false;
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify({ results, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });

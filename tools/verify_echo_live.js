/* Final verification of the LIVE production site with a fresh visitor profile. */
const { chromium } = require('playwright-core');
const OUT = 'C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/echo_shots/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const ctx = await chromium.launchPersistentContext('C:/Users/Administrator/.workbuddy/tmp-echo-live', {
    executablePath: 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe',
    headless: true, proxy: { server: process.env.TEST_PROXY || 'http://127.0.0.1:7897' },
    args: ['--no-sandbox'], viewport: { width: 480, height: 950 },
  });
  const page = await ctx.newPage();
  const errors = [], external = [], platform = [];
  // Cloudflare Pages injects its analytics beacon into self-hosted HTML.
  const PLATFORM = /^https:\/\/static\.cloudflareinsights\.com\//;
  page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  page.on('request', r => {
    const u = r.url();
    if (!/smallfigure\.com/.test(u) && !/^data:/.test(u) && !/^blob:/.test(u)) {
      if (PLATFORM.test(u)) platform.push(u.slice(0, 120)); else external.push(u.slice(0, 120));
    }
  });
  await page.goto('https://smallfigure.com/echo/', { waitUntil: 'networkidle', timeout: 60000 });
  // Persistent profile keeps progress between runs; reset so START opens level 1.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
  await sleep(2500);
  await page.screenshot({ path: OUT + '20_live_menu.png' });
  const menu = await page.evaluate(() => ({ title: document.title, menu: !document.getElementById('menu').hidden }));
  // play level 1 live
  await page.click('#btnStart');
  await sleep(400);
  for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowRight'); await sleep(90); }
  await sleep(900);
  const cleared = await page.evaluate(() => !document.getElementById('clear').hidden);
  await page.screenshot({ path: OUT + '21_live_play.png' });
  // homepage footer link
  const p2 = await ctx.newPage();
  await p2.goto('https://smallfigure.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(1800);
  const footer = await p2.evaluate(() => {
    const a = document.querySelector('a[data-i18n="footer.echo"]');
    return a ? { text: a.textContent.trim(), href: a.getAttribute('href') } : null;
  });
  console.log('LIVE MENU:', JSON.stringify(menu));
  console.log('LIVE LEVEL 1 CLEARED:', cleared);
  console.log('HOMEPAGE LINK:', JSON.stringify(footer));
  console.log('JS ERRORS:', errors.length ? JSON.stringify(errors.slice(0, 4)) : 'none');
  console.log('EXTERNAL REQUESTS:', external.length ? JSON.stringify(external.slice(0, 4)) : 'none');
  console.log('PLATFORM-INJECTED:', platform.length, '(Cloudflare Web Analytics beacon, not game code)');
  console.log((menu.title.includes('Echo Museum') && cleared && footer && errors.length === 0 && external.length === 0) ? 'LIVE RESULT: PASS' : 'LIVE RESULT: FAIL');
  await ctx.close();
})();

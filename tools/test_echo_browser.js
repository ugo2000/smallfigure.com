/* End-to-end browser test for Echo Museum (self-host build served at :8899/echo/).
 * Verifies: no JS errors, no external requests, menu -> play -> level 1 clear,
 * freeze mechanic on level 2, language switch, and captures screenshots.
 */
const { chromium } = require('playwright-core');
const ROOT = 'C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772';
const OUT = ROOT + '/tools/echo_shots/';
const URL = 'http://127.0.0.1:8899/echo/';
const fs = require('fs');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const ctx = await chromium.launchPersistentContext('C:/Users/Administrator/.workbuddy/tmp-echo-test', {
    executablePath: 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe',
    headless: true, args: ['--no-sandbox'], viewport: { width: 900, height: 1000 },
  });
  const page = await ctx.newPage();
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
  page.on('request', r => {
    const u = r.url();
    if (!/^http:\/\/127\.0\.0\.1:8899\//.test(u) && !u.startsWith('data:') && !u.startsWith('blob:')) external.push(u.slice(0, 140));
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  // This is a persistent profile: stale progress would make START open the newest
  // unlocked room instead of level 1, so always begin from a clean save.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(1200);

  // --- menu ---
  const menuVisible = await page.evaluate(() => !document.getElementById('menu').hidden);
  console.log('MENU visible:', menuVisible);
  await page.screenshot({ path: OUT + '01_menu.png' });

  // --- start, level 1 ---
  await page.click('#btnStart');
  await sleep(600);
  await page.screenshot({ path: OUT + '02_level1.png' });
  const hud1 = await page.evaluate(() => ({ level: document.getElementById('mLevel').textContent, step: document.getElementById('mStep').textContent }));
  console.log('AFTER START:', JSON.stringify(hud1));

  for (let i = 0; i < 5; i++) { await page.keyboard.press('ArrowRight'); await sleep(90); }
  await sleep(1000);
  const cleared1 = await page.evaluate(() => !document.getElementById('clear').hidden);
  console.log('LEVEL 1 CLEARED:', cleared1);
  await page.screenshot({ path: OUT + '03_level1_clear.png' });
  if (!cleared1) {
    console.log('DEBUG toast:', await page.evaluate(() => document.getElementById('toast').textContent));
  }

  // --- level 2: freeze mechanic ---
  await page.click('#btnNext');
  await sleep(500);
  const hud2 = await page.evaluate(() => document.getElementById('mLevel').textContent);
  console.log('LEVEL 2:', hud2);
  await page.screenshot({ path: OUT + '04_level2_start.png' });

  // loop 1: walk onto the plate
  for (const k of ['ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown']) { await page.keyboard.press(k); await sleep(90); }
  await sleep(200);
  const beforeFreeze = await page.evaluate(() => ({ step: document.getElementById('mStep').textContent, door: document.getElementById('timeline').textContent }));
  console.log('BEFORE FREEZE:', JSON.stringify(beforeFreeze));
  await page.screenshot({ path: OUT + '05_on_plate.png' });

  await page.keyboard.press('f');
  await sleep(500);
  const afterFreeze = await page.evaluate(() => ({ step: document.getElementById('mStep').textContent, echoes: document.getElementById('mEcho').textContent }));
  console.log('AFTER FREEZE:', JSON.stringify(afterFreeze));
  await page.screenshot({ path: OUT + '06_echo_left.png' });

  // loop 2: reference solution
  for (const k of ['ArrowRight','ArrowRight','ArrowDown','ArrowDown','ArrowRight','ArrowDown','ArrowDown','ArrowDown','ArrowRight','ArrowDown']) {
    await page.keyboard.press(k); await sleep(90);
  }
  await sleep(1000);
  const cleared2 = await page.evaluate(() => !document.getElementById('clear').hidden);
  console.log('LEVEL 2 CLEARED:', cleared2);
  await page.screenshot({ path: OUT + '07_level2_clear.png' });
  if (!cleared2) {
    console.log('DEBUG:', await page.evaluate(() => ({
      step: document.getElementById('mStep').textContent,
      echo: document.getElementById('mEcho').textContent,
      toast: document.getElementById('toast').textContent,
    })));
  }

  // --- language switch ---
  await page.click('#btnHelpClose').catch(() => {});
  await page.click('#btnLang');
  await sleep(300);
  const zh = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.querySelector('[data-t="subtitle"]') ? document.querySelector('[data-t="subtitle"]').textContent : null,
    freeze: document.querySelector('#btnFreeze b') ? document.querySelector('#btnFreeze b').textContent : null,
  }));
  console.log('ZH:', JSON.stringify(zh));
  await page.screenshot({ path: OUT + '08_chinese.png' });

  // --- help sheet ---
  await page.click('#btnHelp');
  await sleep(300);
  await page.screenshot({ path: OUT + '09_help_zh.png' });
  await page.click('#btnHelpClose');

  console.log('JS ERRORS:', errors.length ? JSON.stringify(errors.slice(0, 6)) : 'none');
  console.log('EXTERNAL REQUESTS:', external.length ? JSON.stringify(external) : 'none');
  const pass = menuVisible && cleared1 && cleared2 && errors.length === 0 && external.length === 0;
  console.log(pass ? 'RESULT: PASS' : 'RESULT: FAIL');
  await ctx.close();
  process.exit(pass ? 0 : 1);
})();

/* Play ALL 10 Echo Museum levels in a real browser using the verified reference solutions.
 * Catches UI-level issues (overlay blocking input, key handling, save/unlock flow)
 * that the pure-logic verifier cannot see.
 */
const { chromium } = require('playwright-core');
const C = require('../game-echo/levels.js');
const ROOT = 'C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772';
const OUT = ROOT + '/tools/echo_shots/';
const URL = 'http://127.0.0.1:8899/echo/';
const fs = require('fs');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const KEY = { U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight', W: 'Space' };

(async () => {
  const ctx = await chromium.launchPersistentContext('C:/Users/Administrator/.workbuddy/tmp-echo-all', {
    executablePath: 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe',
    headless: true, args: ['--no-sandbox'], viewport: { width: 480, height: 950 },
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 180)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 180)); });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  // Persistent profile keeps progress between runs; reset so START opens level 1.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(900);
  await page.click('#btnStart');
  await sleep(350);

  let failures = 0;
  for (let lv = 0; lv < C.LEVELS.length; lv++) {
    for (let li = 0; li < C.LEVELS[lv].sol.length; li++) {
      const loop = C.LEVELS[lv].sol[li];
      for (const a of loop) { await page.keyboard.press(KEY[a]); await sleep(22); }
      if (li < C.LEVELS[lv].sol.length - 1) {
        await page.keyboard.press('f');
        await sleep(70);
      }
    }
    await sleep(720);
    const state = await page.evaluate(() => ({
      level: document.getElementById('mLevel').textContent,
      step: document.getElementById('mStep').textContent,
      clear: !document.getElementById('clear').hidden,
      all: !document.getElementById('allclear').hidden,
      toast: document.getElementById('toast').hidden ? '' : document.getElementById('toast').textContent,
    }));
    const ok = lv === C.LEVELS.length - 1 ? state.all : state.clear;
    if (!ok) failures++;
    console.log(`L${String(lv + 1).padStart(2, '0')} ${ok ? 'OK  ' : 'FAIL'} step=${state.step} clear=${state.clear} all=${state.all} ${state.toast ? 'toast=' + state.toast : ''}`);
    if (lv === 3) await page.screenshot({ path: OUT + '10_level4_echoes.png' });
    if (lv < C.LEVELS.length - 1) {
      if (!state.clear) break;
      await page.click('#btnNext');
      await sleep(300);
    }
  }
  await page.screenshot({ path: OUT + '11_all_clear.png' });
  const finalStats = await page.evaluate(() => ({
    allStats: document.getElementById('allStats').textContent,
    unlocked: Object.keys(JSON.parse(localStorage.getItem('sfem-save-v1') || '{}').cleared || {}).length,
  }));
  console.log('FINAL:', JSON.stringify(finalStats));
  console.log('JS ERRORS:', errors.length ? JSON.stringify(errors.slice(0, 5)) : 'none');
  const pass = failures === 0 && errors.length === 0;
  console.log(pass ? 'RESULT: ALL 10 LEVELS PASS' : `RESULT: FAIL (${failures} levels)`);
  await ctx.close();
  process.exit(pass ? 0 : 1);
})();

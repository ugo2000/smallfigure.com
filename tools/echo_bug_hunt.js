/* Echo Museum bug hunt: reproduce edge cases in a real browser.
 * Serves the self-host build at http://127.0.0.1:8899/echo/
 * Run: node tools/echo_bug_hunt.js
 */
const { chromium } = require('playwright-core');
const TARGET = process.env.BUG_HUNT_URL || 'http://127.0.0.1:8899/echo/';
const ORIGIN = new URL(TARGET).origin + '/';
const PROXY = process.env.TEST_PROXY || '';
// Cloudflare Pages injects its Web Analytics beacon into self-hosted HTML.
// It is platform-level, not a request made by the game code (the shipped
// zips never contain it), so track it separately rather than flagging it.
const PLATFORM = /^https:\/\/static\.cloudflareinsights\.com\//;
const PROFILE = 'C:/Users/Administrator/.workbuddy/tmp-echo-bughunt-' + Date.now();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
function rec(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log((pass ? 'PASS  ' : 'BUG   ') + name + '  ::  ' + detail);
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe',
    headless: true, args: ['--no-sandbox'], viewport: { width: 900, height: 1000 },
    ...(PROXY ? { proxy: { server: PROXY } } : {}),
  });

  async function fresh(opts) {
    const p = await ctx.newPage();
    const errs = [], external = [], platform = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 180)));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 180)); });
    p.on('request', r => {
      const u = r.url();
      if (!u.startsWith(ORIGIN) && !u.startsWith('data:') && !u.startsWith('blob:')) {
        if (PLATFORM.test(u)) platform.push(u.slice(0, 120)); else external.push(u.slice(0, 120));
      }
    });
    await p.goto(TARGET, { waitUntil: 'networkidle', timeout: 30000 });
    if (!opts || !opts.keepSave) {
      await p.evaluate(() => localStorage.clear());
      await p.reload({ waitUntil: 'networkidle' });
    }
    await sleep(500);
    return { p, errs, external, platform };
  }
  const txt = (p, id) => p.evaluate(i => document.getElementById(i).textContent.trim(), id);
  const hidden = (p, id) => p.evaluate(i => document.getElementById(i).hidden, id);
  const press = async (p, keys, gap) => { for (const k of keys) { await p.keyboard.press(k); await sleep(gap || 45); } };

  // S1: pressing H on the menu must not leak a level hint
  {
    const { p } = await fresh();
    await p.keyboard.press('h');
    await sleep(150);
    const toastShown = !(await hidden(p, 'toast'));
    const toastText = await txt(p, 'toast');
    rec('S1 menu keyboard isolation (H)', !toastShown, 'toast=' + (toastShown ? JSON.stringify(toastText) : 'hidden'));
    await p.close();
  }

  // S2: race between win() 620ms timeout and switching level via the room grid
  {
    const { p, errs } = await fresh();
    await p.click('#btnStart'); await sleep(250);
    await press(p, ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight'], 35);
    await p.click('#btnLevels'); await sleep(120);
    const cell = await p.$('.level-cell[data-level="1"]:not([disabled])');
    if (cell) { await cell.click(); }
    await sleep(900);
    const clearShown = !(await hidden(p, 'clear'));
    const lvl = await txt(p, 'mLevel');
    rec('S2 win timeout vs level switch', !clearShown && lvl === '02' && !errs.length,
      'clearOverlay=' + clearShown + ' level=' + lvl + ' errors=' + JSON.stringify(errs));
    await p.close();
  }

  // S3: corrupted save (unlocked as a non-numeric string) must not crash
  {
    const { p } = await fresh();
    const errs = [];
    p.on('pageerror', e => errs.push(String(e).slice(0, 180)));
    await p.evaluate(() => localStorage.setItem('sfem-save-v1', JSON.stringify({ unlocked: 'abc', cleared: {}, best: {}, lang: 'en' })));
    await p.reload({ waitUntil: 'networkidle' }); await sleep(500);
    await p.click('#btnStart'); await sleep(500);
    const lvl = await txt(p, 'mLevel');
    rec('S3 corrupted save resilience', errs.length === 0 && /^\d\d$/.test(lvl),
      'level=' + JSON.stringify(lvl) + ' errors=' + JSON.stringify(errs));
    await p.close();
  }

  // S4: undo must restore a freeze
  {
    const { p } = await fresh();
    await p.click('#btnStart'); await sleep(200);
    await press(p, ['ArrowRight', 'ArrowRight'], 60);
    await p.keyboard.press('f'); await sleep(250);
    const e1 = await txt(p, 'mEcho'), s1 = await txt(p, 'mStep');
    await p.click('#btnUndo'); await sleep(200);
    const e2 = await txt(p, 'mEcho'), s2 = await txt(p, 'mStep');
    rec('S4 undo restores freeze', e1 === '1' && e2 === '0' && s2 === '02',
      'afterFreeze=' + e1 + '/' + s1 + ' afterUndo=' + e2 + '/' + s2);
    await p.close();
  }

  // S5: undo must restore shard collection state
  {
    const { p } = await fresh();
    await p.click('#btnStart'); await sleep(200);
    await press(p, ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight'], 55);
    await sleep(200);
    const before = await txt(p, 'mShard');
    await p.click('#btnUndo'); await sleep(200);
    const after = await txt(p, 'mShard');
    rec('S5 undo restores shard', before === '1/1' && after === '0/1', 'before=' + before + ' afterUndo=' + after);
    await p.close();
  }

  // S6: Space on a focused button should activate the button, not be swallowed as WAIT
  {
    const { p } = await fresh();
    await p.focus('#btnStart');
    await p.keyboard.press('Space'); await sleep(400);
    const menuGone = await hidden(p, 'menu');
    rec('S6 keyboard accessibility (Space on button)', menuGone,
      'menuHidden=' + menuGone + ' (expected true: button activated)');
    await p.close();
  }

  // S7: game must not accept move keys while help / room sheet is open
  {
    const { p } = await fresh();
    await p.click('#btnStart'); await sleep(200);
    await p.click('#btnHelp'); await sleep(150);
    const step0 = await txt(p, 'mStep');
    await press(p, ['ArrowRight', 'ArrowRight'], 60);
    const step1 = await txt(p, 'mStep');
    rec('S7 input paused while sheet open', step0 === step1, 'step ' + step0 + ' -> ' + step1);
    await p.close();
  }

  // S8: double FREEZE must not create an empty echo
  {
    const { p } = await fresh();
    await p.click('#btnStart'); await sleep(200);
    await press(p, ['ArrowRight', 'ArrowRight'], 60);
    await p.keyboard.press('f'); await sleep(120);
    await p.keyboard.press('f'); await sleep(250);
    const e = await txt(p, 'mEcho'), toast = await txt(p, 'toast');
    rec('S8 double freeze guard', e === '1', 'echoes=' + e + ' toast=' + JSON.stringify(toast));
    await p.close();
  }

  // S9: language switch survives the clear panel
  {
    const { p } = await fresh();
    await p.click('#btnLang'); await sleep(150);
    await p.click('#btnStart'); await sleep(200);
    await press(p, ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight'], 50);
    await sleep(900);
    const next = await txt(p, 'btnNext');
    rec('S9 i18n on clear panel', next === '下一间', 'btnNext=' + JSON.stringify(next));
    await p.close();
  }

  // S10: progress persists after reload and START resumes at the newest unlocked room
  {
    const { p } = await fresh();
    await p.click('#btnStart'); await sleep(200);
    await press(p, ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight'], 50);
    await sleep(900);
    await p.reload({ waitUntil: 'networkidle' }); await sleep(500);
    const prog = await txt(p, 'menuProgress');
    await p.click('#btnStart'); await sleep(300);
    const lvl = await txt(p, 'mLevel');
    rec('S10 save / resume', prog === '1 / 10' && lvl === '02', 'progress=' + prog + ' resumedLevel=' + lvl);
    await p.close();
  }

  // S11: small portrait viewport keeps the whole frame reachable
  {
    const { p } = await fresh();
    await p.setViewportSize({ width: 360, height: 640 }); await sleep(300);
    const box = await p.evaluate(() => {
      const f = document.querySelector('.frame').getBoundingClientRect();
      const c = document.querySelector('.controls').getBoundingClientRect();
      return { top: f.top, bottom: f.bottom, cBottom: c.bottom, ih: window.innerHeight };
    });
    const ok = box.top >= -2 && box.cBottom <= box.ih + 2;
    rec('S11 small viewport layout', ok, JSON.stringify(box));
    await p.close();
  }

  // S12: no JS errors / no external requests in a normal session
  {
    const { p, errs, external, platform } = await fresh();
    await p.click('#btnStart'); await sleep(200);
    await press(p, ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight'], 50);
    await sleep(900);
    rec('S12 clean console / zero external', !errs.length && !external.length,
      'errors=' + JSON.stringify(errs) + ' external=' + JSON.stringify(external) +
      ' platformInjected=' + platform.length);
    await p.close();
  }

  // S13: SPACE must still be the WAIT action during play (after a mouse click)
  {
    const { p } = await fresh();
    await p.click('#btnStart'); await sleep(200);
    await p.keyboard.press('Space'); await sleep(200);
    const step = await txt(p, 'mStep');
    rec('S13 SPACE is WAIT during play', step === '01', 'step=' + step);
    await p.close();
  }

  // S14: ENTER starts the game from the menu when no control has focus
  {
    const { p } = await fresh();
    await p.keyboard.press('Enter'); await sleep(350);
    const menuGone = await hidden(p, 'menu');
    rec('S14 ENTER starts from menu', menuGone, 'menuHidden=' + menuGone);
    await p.close();
  }

  await ctx.close();
  const bugs = results.filter(r => !r.pass);
  console.log('\n=== ' + (results.length - bugs.length) + '/' + results.length + ' checks passed ===');
  if (bugs.length) { console.log('CONFIRMED ISSUES:'); bugs.forEach(b => console.log(' - ' + b.name + ': ' + b.detail)); }
  process.exit(bugs.length ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });

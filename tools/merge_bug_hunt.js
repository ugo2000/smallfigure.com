/* Merge Museum smoke + edge-case checks in a real browser.
 * Serves the self-host build at http://127.0.0.1:8899/game/
 * Run: NODE_PATH=<managed node_modules> node tools/merge_bug_hunt.js
 */
const { chromium } = require('playwright-core');
const TARGET = process.env.BUG_HUNT_URL || 'http://127.0.0.1:8899/game/';
const ORIGIN = new URL(TARGET).origin + '/';
const PROXY = process.env.TEST_PROXY || '';
// Cloudflare Pages injects its analytics beacon into self-hosted HTML.
const PLATFORM = /^https:\/\/static\.cloudflareinsights\.com\//;
const PROFILE = 'C:/Users/Administrator/.workbuddy/tmp-merge-bughunt-' + Date.now();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
function rec(name, pass, detail) {
  results.push({ name, pass });
  console.log((pass ? 'PASS  ' : 'BUG   ') + name + '  ::  ' + detail);
}

(async function main() {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe',
    headless: true, args: ['--no-sandbox'], viewport: { width: 480, height: 950 },
    ...(PROXY ? { proxy: { server: PROXY } } : {}),
  });
  const errors = [], external = [], platform = [];

  async function fresh() {
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(String(e).slice(0, 180)));
    p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 180)); });
    p.on('request', r => {
      const u = r.url();
      if (!u.startsWith(ORIGIN) && !u.startsWith('data:') && !u.startsWith('blob:')) {
        if (PLATFORM.test(u)) platform.push(u.slice(0, 120)); else external.push(u.slice(0, 120));
      }
    });
    await p.goto(TARGET, { waitUntil: 'networkidle', timeout: 30000 });
    await p.evaluate(() => localStorage.clear());
    await p.reload({ waitUntil: 'networkidle' });
    await sleep(2200);
    return p;
  }
  const hidden = (p, id) => p.evaluate(i => document.getElementById(i).hidden, id);

  // M1: menu boots and START enters play
  const p = await fresh();
  const menuVisible = !(await hidden(p, 'menu'));
  await p.click('#btnStart');
  await sleep(400);
  const started = await hidden(p, 'menu');
  rec('M1 menu / start', menuVisible && started, 'menuVisible=' + menuVisible + ' started=' + started);

  // M2: SPACE drops a ball (the "now" sprite changes)
  // Count src rewrites on the "now" sprite: every successful drop calls
  // updateNext(). Comparing sprite filenames alone is unreliable (pickLvl is random).
  await p.evaluate(() => {
    window.__dropCount = 0;
    const el = document.getElementById('curImg');
    new MutationObserver(() => { window.__dropCount++; })
      .observe(el, { attributes: true, attributeFilter: ['src'] });
  });
  const focusId = await p.evaluate(() => document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : 'none');
  for (let i = 0; i < 3; i++) { await p.keyboard.press('Space'); await sleep(520); }
  const drops = await p.evaluate(() => window.__dropCount);
  rec('M2 SPACE drops', drops >= 3, 'srcRewrites=' + drops + ' focus=' + focusId);

  // M3: language switch
  await p.click('#btnLang');
  await sleep(250);
  const lang = await p.evaluate(() => document.documentElement.lang);
  rec('M3 language switch', lang === 'zh-CN', 'lang=' + lang);

  // M4: corrupted save must not crash or produce NaN score
  await p.evaluate(() => localStorage.setItem('sfmm-save', JSON.stringify({ best: 'abc', plays: null, unlocked: 'bad' })));
  await p.reload({ waitUntil: 'networkidle' });
  await sleep(1800);
  const best = await p.evaluate(() => document.getElementById('bestVal').textContent.trim());
  const errCount = errors.length;
  rec('M4 corrupted save resilience', errCount === 0 && /^\d+$/.test(best),
    'bestVal=' + JSON.stringify(best) + ' errors=' + errCount);

  // M5: ENTER on a focused START button should activate it (keyboard accessibility)
  const p2 = await ctx.newPage();
  p2.on('pageerror', e => errors.push(String(e).slice(0, 180)));
  await p2.goto(TARGET, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);
  await p2.focus('#btnStart');
  await p2.keyboard.press('Enter');
  await sleep(500);
  const enterStarted = await hidden(p2, 'menu');
  rec('M5 ENTER activates focused button', enterStarted, 'menuHidden=' + enterStarted);

  // M6: no JS errors / no external requests
  rec('M6 clean console / zero external', errors.length === 0 && external.length === 0,
    'errors=' + JSON.stringify(errors.slice(0, 3)) + ' external=' + JSON.stringify(external.slice(0, 3)) +
    ' platformInjected=' + platform.length);

  await ctx.close();
  const bugs = results.filter(r => !r.pass);
  console.log('\n=== ' + (results.length - bugs.length) + '/' + results.length + ' checks passed ===');
  if (bugs.length) console.log('CONFIRMED ISSUES: ' + bugs.map(b => b.name).join(', '));
  process.exit(bugs.length ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });

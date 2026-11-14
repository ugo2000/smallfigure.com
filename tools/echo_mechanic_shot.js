/* Capture the core mechanic mid-puzzle: 2 echoes holding plates, player walking past. */
const { chromium } = require('playwright-core');
const OUT = 'C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/echo_shots/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const KEY = { U: 'ArrowUp', D: 'ArrowDown', L: 'ArrowLeft', R: 'ArrowRight', W: 'Space' };

(async () => {
  const ctx = await chromium.launchPersistentContext('C:/Users/Administrator/.workbuddy/tmp-echo-shot', {
    executablePath: 'C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe',
    headless: true, args: ['--no-sandbox'], viewport: { width: 480, height: 950 },
  });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8899/echo/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(() => localStorage.setItem('sfem-save-v1', JSON.stringify({ unlocked: 10, cleared: {}, best: {}, lang: 'en', sound: false })));
  await page.reload({ waitUntil: 'networkidle' });
  await sleep(700);
  // open level picker -> level 4
  await page.click('#btnLevels');
  await sleep(250);
  await page.click('.level-cell[data-level="3"]');
  await sleep(400);

  const press = async (s) => { for (const a of s) { await page.keyboard.press(KEY[a]); await sleep(45); } };
  // loop 1 -> plate A, freeze
  await press('DDD'); await page.keyboard.press('f'); await sleep(180);
  // loop 2 -> plate B, freeze
  await press('DDDDDD'); await page.keyboard.press('f'); await sleep(180);
  // loop 3 -> wait for both echoes to settle on plates, then head toward the door
  await press('RWWWWW');
  await sleep(350);
  await page.screenshot({ path: OUT + '12_two_echoes_holding.png' });
  console.log('STATE:', JSON.stringify(await page.evaluate(() => ({
    level: document.getElementById('mLevel').textContent,
    step: document.getElementById('mStep').textContent,
    echoes: document.getElementById('mEcho').textContent,
    timeline: document.getElementById('timeline').textContent,
  }))));
  // continue to door, capture the open door with echoes visible
  await press('RR');
  await sleep(300);
  await page.screenshot({ path: OUT + '13_door_open.png' });
  await ctx.close();
})();

// Diagnostic: what does the browser actually see at /game/new?
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("response", r => { if (/itch\.io/.test(r.url())) log("   R", r.status(), r.url().slice(0,90)); });

  const resp = await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded", timeout: 40000 }).catch(e=>({err:e.message}));
  log("goto resp:", resp && resp.err ? resp.err : (resp && resp.status()));
  await sleep(9000);

  const info = await page.evaluate(() => ({
    url: location.href,
    title: document.title,
    hasKindSelect: !!document.querySelector('select[name="game[type]"]'),
    bodyLen: document.body ? document.body.innerText.length : 0,
    bodyHead: (document.body ? document.body.innerText : "").replace(/\s+/g," ").trim().slice(0,400),
    hasLogin: /log in|sign in|create an account/i.test(document.body?document.body.innerText:""),
    forms: document.forms.length,
  }));
  log("PAGE INFO:", JSON.stringify(info, null, 0));
  await page.screenshot({ path: "tools/itch_shots/97_diag.png", fullPage: true }).catch(()=>{});

  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

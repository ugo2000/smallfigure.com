// 只读：读 5353035 当前持久化状态
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(60000);
  await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4000);
  const s = await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    const slug = document.querySelector('input[name="game[slug]"]')?.value;
    const short = document.querySelector('input[name="game[short_text]"]')?.value;
    const descLen = (document.querySelector('textarea[name="game[description]"]')?.value||"").length;
    const tags = document.querySelector('input[name="game[tags]"]')?.value;
    const uploads = [...document.querySelectorAll('[name*="[embed][checkbox]"]')].map(e=>e.name);
    const pub = [...document.querySelectorAll('input[name="game[published]"]')].map(e=>e.value+":"+e.checked);
    return { typeVal: sel?sel.value:null, slug, shortLen: (short||"").length, descLen, tags, embedUploads: uploads.length, pub };
  });
  console.log(JSON.stringify(s, null, 2));
  await ctx.close();
})().catch(e => { console.log("FATAL", e.stack); process.exit(1); });

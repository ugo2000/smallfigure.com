// 真实点击 Save，抓 requestfailed / responses / 请求
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const SHOTS = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(60000);
  page.on("dialog", async d => { log("   DIALOG:", d.type(), d.message().slice(0,80)); await d.accept().catch(()=>{}); });
  page.on("requestfailed", req => { if (/itch\.io/.test(req.url())) log("   REQFAILED", req.method(), req.url().slice(0,70), req.failure()?.errorText); });
  page.on("response", resp => { if (/itch\.io/.test(resp.url()) && resp.request().method() !== "GET") log("   RESP", resp.status(), resp.request().method(), resp.url().slice(0,70)); });
  page.on("request", req => { if (/itch\.io/.test(req.url()) && req.method() !== "GET") log("   REQ", req.method(), req.url().slice(0,70)); });

  await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4000);

  await page.evaluate((s) => {
    const el = document.querySelector('input[name="game[slug]"]'); el.value = s; el.dispatchEvent(new Event("input",{bubbles:true}));
    const st = document.querySelector('input[name="game[short_text]"]'); st.value = "ZZTEST"; st.dispatchEvent(new Event("input",{bubbles:true}));
  }, "mmslugtest1");
  await sleep(500);
  log("   clicking Save...");
  const btn = page.locator("button.save_btn").first();
  await btn.click({ force: true }).catch(e=>log("   click err", e.message));
  await sleep(9000);
  log("   URL:", page.url());
  await page.screenshot({ path: SHOTS + "/51_real_save.png" });

  await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4000);
  const after = await page.evaluate(() => ({ slug: document.querySelector('input[name="game[slug]"]')?.value, short: document.querySelector('input[name="game[short_text]"]')?.value }));
  log("   AFTER reload:", JSON.stringify(after));
  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

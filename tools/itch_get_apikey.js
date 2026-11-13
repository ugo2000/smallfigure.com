// 从 Developer / API keys 页面取 butler API key（备用）
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const fs = require("fs");
const ROOT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URLS = [
  "https://itch.io/user/settings/api-keys",
  "https://itch.io/developers/settings/api-keys",
  "https://itch.io/user/settings/developer",
];

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: CHROME,
    proxy: { server: PROXY }, viewport: { width: 1440, height: 980 },
    args: ["--disable-quic", "--no-sandbox"],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(45000);
  for (const u of URLS) {
    try {
      const r = await page.goto(u, { waitUntil: "domcontentloaded", timeout: 30000 });
      await sleep(3000);
      console.log("URL", u, "->", r && r.status());
      const reveal = page.locator("button:has-text('Reveal')").first();
      if (await reveal.count()) { await reveal.click().catch(()=>{}); await sleep(1000); }
      const key = await page.evaluate(() => {
        const inputs = [...document.querySelectorAll("input[type=text], input:not([type]), textarea")];
        const c = inputs.find(i => (i.value||"").length >= 20);
        if (c) return c.value;
        const pre = document.querySelector("pre, code, .api_key, #api_key");
        return pre ? (pre.textContent||"").trim() : null;
      });
      if (key && key.length >= 20) {
        fs.writeFileSync(ROOT + "/.itch_token", key.trim());
        console.log("SAVED KEY (len " + key.trim().length + "):", key.trim().slice(0,10) + "...");
        await ctx.close();
        return;
      } else {
        console.log("  no key found on this page; inputs count check...");
        const dump = await page.evaluate(() => [...document.querySelectorAll("input")].map(i=>({t:i.type,n:i.name||i.id,v:(i.value||"").slice(0,30)})).slice(0,20));
        console.log("  inputs:", JSON.stringify(dump));
      }
    } catch (e) { console.log("ERR at", u, e.message.split("\n")[0]); }
  }
  await ctx.close();
  console.log("NO KEY EXTRACTED");
})().catch(e => { console.log("FATAL", e.stack); process.exit(1); });

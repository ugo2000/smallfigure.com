const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const OUT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots/store_desc.png";
(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME, headless: true, proxy: { server: PROXY },
    args: ["--no-sandbox"], viewport: { width: 1100, height: 1400 },
  });
  const page = await ctx.newPage();
  await page.goto("https://ugo2000.itch.io/smallfigure-merge-museum", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(()=>{});
  await new Promise(r => setTimeout(r, 5000));
  await page.evaluate(() => window.scrollTo(0, 700));
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: OUT });
  const links = await page.evaluate(() => [...document.querySelectorAll("a")].map(a => a.href).filter(h => /smallfigure\.com/.test(h)));
  console.log("BACKLINK:", JSON.stringify(links));
  await ctx.close();
})();

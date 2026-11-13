const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const OUT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots/store_live.png";
(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME, headless: true, proxy: { server: PROXY },
    args: ["--no-sandbox"], viewport: { width: 1280, height: 2000 },
  });
  const page = await ctx.newPage();
  await page.goto("https://ugo2000.itch.io/smallfigure-merge-museum", { waitUntil: "networkidle", timeout: 60000 }).catch(()=>{});
  await new Promise(r => setTimeout(r, 6000));
  await page.screenshot({ path: OUT });
  // game iframe presence + size
  const info = await page.evaluate(() => {
    const ifr = document.querySelector("iframe.game_frame, .iframe_wrapper iframe");
    return { iframe: ifr ? ifr.src.slice(0, 80) : null, w: ifr ? ifr.width : null, h: ifr ? ifr.height : null };
  }).catch(e => ({ err: e.message.slice(0,60) }));
  console.log("IFRAME:", JSON.stringify(info));
  await ctx.close();
})();

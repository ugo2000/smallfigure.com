const { chromium } = require("playwright-core");
const OUT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots/";
(async () => {
  // fresh temp profile = no browser cache, like a first-time visitor
  const ctx = await chromium.launchPersistentContext("C:/Users/Administrator/.workbuddy/tmp-fresh-visitor", {
    executablePath: "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe",
    headless: true, proxy: { server: "http://127.0.0.1:7897" }, args: ["--no-sandbox"],
    viewport: { width: 430, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto("https://smallfigure.com/game/", { waitUntil: "networkidle", timeout: 60000 }).catch(()=>{});
  await new Promise(r=>setTimeout(r,3500));
  const en = await page.evaluate(() => [...document.querySelectorAll(".brandbar a")].map(a=>a.textContent.trim()));
  console.log("FRESH VISITOR EN:", JSON.stringify(en));
  await page.screenshot({ path: OUT + "fresh_game_footer.png" });
  // switch to zh
  await page.evaluate(() => { const b=document.querySelector("#btnLang"); if(b) b.click(); });
  await new Promise(r=>setTimeout(r,1200));
  const zh = await page.evaluate(() => [...document.querySelectorAll(".brandbar a")].map(a=>a.textContent.trim()));
  console.log("FRESH VISITOR ZH:", JSON.stringify(zh));
  await page.screenshot({ path: OUT + "fresh_game_footer_zh.png" });
  await ctx.close();
})();

const { chromium } = require("playwright-core");
const OUT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots/";
(async () => {
  const ctx = await chromium.launchPersistentContext("C:/Users/Administrator/.workbuddy/itch-profile", {
    executablePath: "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe",
    headless: true, proxy: { server: "http://127.0.0.1:7897" }, args: ["--no-sandbox"],
    viewport: { width: 430, height: 900 },
  });
  const page = await ctx.newPage();
  // 1) game page: switch to Chinese to verify i18n label, then shot footer
  await page.goto("https://smallfigure.com/game/", { waitUntil: "networkidle", timeout: 60000 }).catch(()=>{});
  await new Promise(r=>setTimeout(r,3000));
  const en = await page.evaluate(() => {
    const a = [...document.querySelectorAll('.brandbar a')].map(x=>x.textContent.trim());
    return a;
  });
  console.log("GAME FOOTER EN:", JSON.stringify(en));
  await page.screenshot({ path: OUT + "live_game_footer.png" });
  // click the Chinese toggle then re-read
  const zhBtn = await page.$('.lang-toggle button[data-lang="zh"], button[data-lang="zh"]');
  if (zhBtn) { await zhBtn.click().catch(()=>{}); await new Promise(r=>setTimeout(r,1500)); }
  const zh = await page.evaluate(() => [...document.querySelectorAll('.brandbar a')].map(x=>x.textContent.trim()));
  console.log("GAME FOOTER ZH:", JSON.stringify(zh));
  await page.screenshot({ path: OUT + "live_game_footer_zh.png" });
  // 2) homepage footer
  const p2 = await ctx.newPage();
  await p2.goto("https://smallfigure.com/", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(()=>{});
  await new Promise(r=>setTimeout(r,3000));
  await p2.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r=>setTimeout(r,1500));
  await p2.screenshot({ path: OUT + "live_home_footer.png" });
  const links = await p2.evaluate(() => [...document.querySelectorAll('a[href*="itch.io"]')].map(a=>a.getAttribute("href")));
  console.log("HOME ICH LINKS:", JSON.stringify(links));
  await ctx.close();
})();

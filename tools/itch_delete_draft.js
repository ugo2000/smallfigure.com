// 删除坏草稿 5353035
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
  page.on("dialog", async d => { log("   dialog:", d.type(), d.message().slice(0,80)); await d.accept().catch(()=>{}); });

  await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4000);
  // 找 Delete project
  const del = page.locator("text=Delete project").first();
  if (!(await del.count())) { log("NO delete link"); await page.screenshot({ path: SHOTS + "/40_nodel.png", fullPage:true }); await ctx.close(); return; }
  await del.click().catch(e=>log("del click err", e.message));
  await sleep(3000);
  await page.screenshot({ path: SHOTS + "/41_delete_confirm.png" });
  // 可能进入确认页，找确认按钮
  const confirm = page.locator("button:has-text('Delete'), input[value*='Delete'], a:has-text('Yes')").first();
  if (await confirm.count()) { await confirm.click().catch(e=>log("confirm err", e.message)); await sleep(4000); }
  log("after delete URL:", page.url());
  await page.screenshot({ path: SHOTS + "/42_after_delete.png" });
  // 验证：再访问 edit 页应 404/redirect
  const chk = await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>null);
  log("recheck status:", chk && chk.status());
  await sleep(2000);
  const gone = await page.evaluate(() => /not found|404|doesn.?t exist|no project/i.test(document.body.innerText) || location.pathname.includes("dashboard"));
  log("deleted (gone):", gone);
  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

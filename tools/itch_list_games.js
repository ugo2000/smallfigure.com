// 列出 ugo2000 账号下的项目，定位 smallfigure-merge-museum，并 dump type 选项
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: CHROME,
    proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 },
    args: ["--disable-quic", "--no-sandbox"],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(60000);
  await page.goto("https://itch.io/my-games", { waitUntil: "domcontentloaded" });
  await sleep(4500);
  const games = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("a[href*='/game/edit/'], a[href*='.itch.io/']")];
    const out = [];
    const seen = new Set();
    for (const a of rows) {
      const href = a.href;
      const t = (a.textContent || "").trim();
      if (!href || seen.has(href)) continue;
      seen.add(href);
      out.push({ href, text: t.slice(0, 50) });
    }
    return out.slice(0, 40);
  });
  console.log("MY-GAMES LINKS:");
  games.forEach(g => console.log("  ", JSON.stringify(g)));

  // 打开指定 slug 的编辑页，dump type 选项
  const editLinks = games.filter(g => /game\/edit\/\d+/.test(g.href));
  console.log("\nEDIT LINKS:", editLinks.length);
  // 找到 merge museum 的 edit 链接（通过再抓一次更多信息）
  const detail = await page.evaluate(() => {
    return [...document.querySelectorAll(".game_list .game, .game_cell, .game_list_row")].slice(0,20).map(el => {
      const a = el.querySelector("a[href*='.itch.io/']");
      const e = el.querySelector("a[href*='/game/edit/']");
      return { title: (el.querySelector('.title, .game_title, h2')?.textContent||"").trim(), pub: a?a.href:null, edit: e?e.href:null };
    });
  });
  console.log("DETAIL:", JSON.stringify(detail, null, 2));
  await ctx.close();
})().catch(e => { console.log("FATAL", e.stack); process.exit(1); });

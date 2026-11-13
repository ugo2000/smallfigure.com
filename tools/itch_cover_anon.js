// Anonymous (logged-out) screenshots: store page + profile page, to verify cover rendering
const { chromium } = require("playwright-core");
const OUT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots/";
(async () => {
  // use a brand-new temp profile = no itch login cookies = real visitor
  const ctx = await chromium.launchPersistentContext("C:/Users/Administrator/.workbuddy/tmp-anon-cover", {
    executablePath: "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe",
    headless: true, proxy: { server: "http://127.0.0.1:7897" }, args: ["--no-sandbox"],
    viewport: { width: 1200, height: 1400 },
  });
  const p1 = await ctx.newPage();
  await p1.goto("https://ugo2000.itch.io/smallfigure-merge-museum", { waitUntil: "networkidle", timeout: 60000 }).catch(()=>{});
  await new Promise(r=>setTimeout(r,5000));
  await p1.screenshot({ path: OUT + "cover_store_anon.png", fullPage: false });
  // scroll down to gallery area
  await p1.evaluate(() => window.scrollTo(0, 700));
  await new Promise(r=>setTimeout(r,1200));
  await p1.screenshot({ path: OUT + "cover_store_gallery.png", fullPage: false });
  const info = await p1.evaluate(() => {
    const og = document.querySelector('meta[property="og:image"]');
    // find where the cover img renders
    const coverImgs = [...document.querySelectorAll("img")].filter(i => /aW1nLz32MjA2Mzk1|aW1nLzMyMjA2Mzk1/.test(i.src)).map(i => ({ src: i.src.slice(0,90), cls: i.className, w: i.width, h: i.height }));
    const containers = [...document.querySelectorAll("div")].filter(d => /cover/i.test(d.className||"")).map(d => d.className).slice(0,6);
    return { og: og && og.content, coverImgs, containers, title: document.title };
  });
  console.log("STORE:", JSON.stringify(info, null, 1));

  const p2 = await ctx.newPage();
  await p2.goto("https://ugo2000.itch.io/", { waitUntil: "networkidle", timeout: 60000 }).catch(()=>{});
  await new Promise(r=>setTimeout(r,4000));
  await p2.screenshot({ path: OUT + "cover_profile_anon.png" });
  const prof = await p2.evaluate(() => {
    const g = document.querySelector(".game_cell, .game_grid .game_cell, .game_thumb");
    const imgs = [...document.querySelectorAll("img")].map(i => i.src).filter(s => /img\.itch\.zone/.test(s));
    return { gameCell: g ? g.className : null, imgCount: imgs.length, imgs: imgs.slice(0,4) };
  });
  console.log("PROFILE:", JSON.stringify(prof, null, 1));
  await ctx.close();
})();

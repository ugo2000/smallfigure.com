const { chromium } = require("playwright-core");
(async () => {
  const ctx = await chromium.launchPersistentContext("C:/Users/Administrator/.workbuddy/itch-profile", {
    executablePath: "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe",
    headless: true, proxy: { server: "http://127.0.0.1:7897" }, args: ["--no-sandbox"],
    viewport: { width: 430, height: 900 },
  });
  const page = await ctx.newPage();
  await page.goto("https://smallfigure.com/game/", { waitUntil: "networkidle", timeout: 60000 }).catch(()=>{});
  await new Promise(r=>setTimeout(r,3000));
  const r1 = await page.evaluate(() => {
    const el = document.querySelector('[data-t="itchLink"]');
    const privacy = document.querySelector('[data-t="privacy"]');
    return {
      itchText: el ? el.textContent : null,
      privacyText: privacy ? privacy.textContent : null,
      brandText: (document.querySelector('[data-t="brandTag"]')||{}).textContent,
      lang: document.documentElement.lang,
      scriptSrcs: [...document.querySelectorAll("script[src]")].map(s=>s.getAttribute("src")),
      inlineScripts: [...document.querySelectorAll("script:not([src])")].length,
    };
  });
  console.log("R1:", JSON.stringify(r1, null, 1));
  // check the served game.js content actually contains itchLink near T dict
  const js = await page.evaluate(async () => {
    const res = await fetch("game.js?nocache=" + Date.now());
    const txt = await res.text();
    const i = txt.indexOf("itchLink");
    return { len: txt.length, snippet: i>=0 ? txt.slice(Math.max(0,i-160), i+80) : "NOT FOUND" };
  });
  console.log("JS:", JSON.stringify(js, null, 1));
  await ctx.close();
})();

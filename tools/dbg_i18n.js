const { chromium } = require("playwright-core");
(async () => {
  const ctx = await chromium.launchPersistentContext("C:/Users/Administrator/.workbuddy/itch-profile", {
    executablePath: "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe",
    headless: true, proxy: { server: "http://127.0.0.1:7897" }, args: ["--no-sandbox"],
    viewport: { width: 430, height: 900 },
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", e => errs.push(String(e).slice(0,150)));
  page.on("console", m => { if (m.type()==="error") errs.push("console: "+m.text().slice(0,150)); });
  await page.goto("https://smallfigure.com/game/", { waitUntil: "networkidle", timeout: 60000 }).catch(()=>{});
  await new Promise(r=>setTimeout(r,3500));
  const info = await page.evaluate(() => {
    const el = document.querySelector('[data-t="itchLink"]');
    return {
      found: !!el,
      attr: el ? el.getAttribute("data-t") : null,
      text: el ? el.textContent : null,
      html: el ? el.outerHTML : null,
      allDataT: [...document.querySelectorAll("[data-t]")].map(x=>x.getAttribute("data-t")),
    };
  });
  console.log("INFO:", JSON.stringify(info, null, 1));
  console.log("ERRORS:", JSON.stringify(errs.slice(0,5)));
  await ctx.close();
})();

// Delete draft 5353035 via the "Delete game" link + confirmation handling.
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const ID = "5353035";

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("dialog", async d => { log("   DIALOG:", d.type(), "->", d.message().slice(0,80)); await d.accept().catch(()=>{}); });
  page.on("response", r => { if (/delete/i.test(r.url())) log("   DEL RESP", r.status(), r.url()); });

  await page.goto(`https://itch.io/game/edit/${ID}`, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4000);

  // Click "Delete game"
  const clicked = await page.evaluate(() => {
    const a = [...document.querySelectorAll("a")].find(e => e.textContent.trim() === "Delete game" || (e.getAttribute("href")==="#" && /delete game/i.test(e.textContent)));
    if (!a) return "not found";
    a.click();
    return "clicked:" + a.textContent.trim();
  });
  log("   delete link:", clicked);
  await sleep(2500);

  // Dump state after click (modal?)
  const after = await page.evaluate(() => {
    return {
      url: location.href,
      bodySnippet: document.body.innerText.replace(/\s+/g," ").trim().slice(0,200),
      modalBtns: [...document.querySelectorAll(".lightbox, .modal, .popover, .confirm_dialog button, button, input[type=submit]")].map(b=>(b.textContent||b.value||"").trim()).filter(t=>t && /delete|remove|yes|confirm|cancel|cancel/i.test(t)).slice(0,8),
    };
  });
  log("   after click:", JSON.stringify(after));
  await page.screenshot({ path: "tools/itch_shots/81_after_delclick.png", fullPage: true }).catch(()=>{});

  // If a modal delete-confirm button exists, click it
  const confirmClicked = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button, input[type=submit], a.btn, a.button")];
    const del = btns.find(b => /delete game|delete project|yes.*delete|confirm delete/i.test(b.textContent||b.value||""));
    if (del) { del.click(); return "confirm:" + (del.textContent||del.value||"").trim(); }
    // fallback: any button containing "Delete"
    const anyDel = btns.find(b => /^delete$/i.test((b.textContent||b.value||"").trim()));
    if (anyDel) { anyDel.click(); return "anyDel:" + (anyDel.textContent||anyDel.value||"").trim(); }
    return "no-confirm-btn";
  });
  log("   confirm click:", confirmClicked);
  await sleep(4000);

  const finalState = await page.evaluate(() => ({ url: location.href, body: document.body.innerText.replace(/\s+/g," ").trim().slice(0,200) }));
  log("   FINAL:", JSON.stringify(finalState));
  await page.screenshot({ path: "tools/itch_shots/82_del_final.png", fullPage: true }).catch(()=>{});

  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

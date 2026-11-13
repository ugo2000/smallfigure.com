// Find the delete mechanism for draft 5353035.
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
  page.on("dialog", async d => { log("   DIALOG:", d.type(), d.message()); await d.accept().catch(()=>{}); });

  // 1) Scan edit page for delete links/buttons
  await page.goto(`https://itch.io/game/edit/${ID}`, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4000);
  const onEdit = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("a[href]").forEach(a => { const h=a.getAttribute("href")||""; if(/delete|remove|destroy/i.test(h)||/delete|remove/i.test(a.textContent)) out.push({href:h, text:a.textContent.trim().slice(0,40)}); });
    document.querySelectorAll("button, input[type=submit]").forEach(b => { const t=(b.textContent||b.value||"").trim(); if(/delete|remove/i.test(t)) out.push({tag:b.tagName, text:t.slice(0,40)}); });
    return out;
  });
  log("ON EDIT delete-ish:", JSON.stringify(onEdit, null, 0));

  // 2) Try the known delete URL pattern
  const delUrl = `https://itch.io/game/delete/${ID}`;
  const resp = await page.goto(delUrl, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(e=>({err:e.message}));
  await sleep(3500);
  const delPage = await page.evaluate(() => {
    return {
      url: location.href,
      title: document.title,
      bodySnippet: document.body.innerText.replace(/\s+/g," ").trim().slice(0,300),
      hasConfirmBtn: !!([...document.querySelectorAll("button,input[type=submit],a.btn")].find(e=>(e.textContent||e.value||"").match(/delete|remove|yes|confirm/i))),
      formAction: (document.querySelector('form')?.getAttribute('action'))||null,
    };
  });
  log("DELETE URL page:", JSON.stringify(delPage, null, 0));

  await page.screenshot({ path: "tools/itch_shots/80_delete_page.png", fullPage: true }).catch(()=>{});
  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

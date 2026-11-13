// Diagnose the EDIT page for project 5353321.
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const ID = "5353321";

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("dialog", async d => { await d.accept().catch(()=>{}); });

  await page.goto(`https://itch.io/game/edit/${ID}`, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(e=>log("goto",e.message));
  await sleep(6000);

  const info = await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    const $ = window.jQuery || window.$;
    let szVal = null;
    if (sel && sel.selectize) szVal = sel.selectize.getValue();
    const nativeVal = sel ? sel.value : null;
    const out = {
      kindNative: nativeVal,
      kindSelectize: szVal,
      title: document.querySelector('input[name="game[title]"]')?.value,
      slug: document.querySelector('input[name="game[slug]"]')?.value,
      short: (document.querySelector('input[name="game[short_text]"]')?.value||"").length,
      tags: document.querySelector('input[name="game[tags]"]')?.value,
      descLen: (document.querySelector('textarea[name="game[description]"]')?.value||"").length,
      fileInputs: [...document.querySelectorAll("input[type=file]")].map(f=>({id:f.id,name:f.name})),
      uploadSections: [...document.querySelectorAll(".upload_editor,.upload_drop,.add_file_btn_outer,.cover_uploader_drop,.game_edit_cover_uploader_widget,.game_edit_upload_list_widget")].map(e=>({cls:(e.className||"").toString().slice(0,40),text:(e.textContent||"").replace(/\s+/g," ").trim().slice(0,50)})),
      uploadBtns: [...document.querySelectorAll("button,a,.btn,div[role=button]")].map(b=>(b.textContent||"").trim()).filter(t=>/upload|file|drop|add|choose|cover|screenshot|external/i.test(t)).slice(0,25),
      hasPlayCb: [...document.querySelectorAll("input[type=checkbox]")].some(c=>{const l=document.querySelector(`label[for="${c.id}"]`);return l&&/played in the browser/i.test(l.textContent);}),
      embedUploads: document.querySelectorAll('[name*="[embed][checkbox]"]').length,
      bodyHasHtml: /html/i.test(document.body.textContent),
    };
    return out;
  });
  log("EDIT PAGE INFO:", JSON.stringify(info, null, 0));
  await page.screenshot({ path: "tools/itch_shots/110_editdiag.png", fullPage: true }).catch(()=>{});
  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

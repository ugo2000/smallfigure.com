// Diagnose the game-file (zip) uploader on /game/new.
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("dialog", async d => { await d.accept().catch(()=>{}); });

  await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded", timeout: 40000 }).catch(e=>log("goto",e.message));
  await page.waitForFunction(() => !!document.querySelector('select[name="game[type]"]'), { timeout: 20000 }).catch(()=>{});
  await sleep(3000);
  // kind html
  await page.evaluate(() => { const sel=document.querySelector('select[name="game[type]"]'); const st=sel.selectize; if(!st.options["html"]) st.addOption({value:"html",text:"HTML"}); st.setValue("html"); });
  await sleep(2500);

  const dump = await page.evaluate(() => {
    const out = {};
    out.fileInputs = [...document.querySelectorAll("input[type=file]")].map(f => ({ id:f.id, name:f.name, cls:f.className.slice(0,40) }));
    out.uploadish = [...document.querySelectorAll("*")].filter(e => /upload|dropzone|drop_area|file_upload/i.test(e.className||"") ).map(e => ({ tag:e.tagName, cls:(e.className||"").toString().slice(0,50), text:(e.textContent||"").trim().slice(0,40) })).slice(0,12);
    out.btns = [...document.querySelectorAll("button,a,.btn")].map(b=>(b.textContent||"").trim()).filter(t=>/upload|file|drop|add|choose|drag|game|screenshot|cover|image/i.test(t)).slice(0,20);
    // find Uploads section heading and its following button/input
    out.sections = [...document.querySelectorAll("h2,h3,h4,th,.subform_head,.form_label,label")].map(h=>(h.textContent||"").trim()).filter(t=>/upload|file|cover|screenshot|media|game/i.test(t)).slice(0,20);
    return out;
  });
  log("FILE INPUTS:", JSON.stringify(dump.fileInputs));
  log("UPLOADISH:", JSON.stringify(dump.uploadish));
  log("BUTTONS:", JSON.stringify(dump.btns));
  log("SECTIONS:", JSON.stringify(dump.sections));

  await page.screenshot({ path: "tools/itch_shots/98_zipdiag.png", fullPage: true }).catch(()=>{});
  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

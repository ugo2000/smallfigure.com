// 先改 kind→html，再填字段，真实保存，回读+验证
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const SHOTS = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
const SLUG = "smallfigure-merge-museum";
const SHORT = "A cozy merge puzzle built from 11 hand-drawn characters. Drop a tiny folk, merge two of a kind, and fill the encyclopedia before the pile tops out.";
const TAGS = "merge,puzzle,casual,html5,browser,singleplayer,collection,cute,portrait,no-install,family";
const DESC = `Smallfigure: Merge Museum is a small, calm merge puzzle made from the original character art of smallfigure.com.

Two of the same kind merge into the next, stranger character. Unlock all 11 entries and don't let the pile cross the red line. Playable in the browser, English by default with a one-tap Chinese toggle.

Privacy: https://smallfigure.com/game/privacy.html`;

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(60000);
  page.on("dialog", async d => { log("   DIALOG:", d.type()); await d.accept().catch(()=>{}); });
  page.on("response", r => { if (/itch\.io\/game\/edit/.test(r.url()) && r.request().method()==="POST") log("   SAVE POST", r.status()); });

  await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4500);

  // 1) 先改 kind（非静默，触发 onChange）
  const kres = await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    if (!sel) return "no sel";
    if (![...sel.options].some(o=>o.value==="html")) sel.appendChild(new Option("HTML","html"));
    let via = "native";
    try { const $=window.jQuery||window.$; if($ && $(sel)[0] && $(sel)[0].selectize){ const st=$(sel)[0].selectize; st.addOption({value:"html",text:"HTML"}); st.setValue("html"); via="selectize"; } } catch(e){ via="err:"+e.message; }
    return via+" value="+sel.value;
  });
  log("   kind:", kres);
  await sleep(2000); // 等重渲染

  // 2) 再填其余字段
  await page.evaluate((s)=>{ const el=document.querySelector('input[name="game[slug]"]'); if(el){el.value=s; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true}));} }, SLUG);
  await page.evaluate((s)=>{ const el=document.querySelector('input[name="game[short_text]"]'); if(el){el.value=s; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true}));} }, SHORT);
  await page.evaluate((d)=>{ const ta=document.querySelector('textarea[name="game[description]"]'); if(ta){ta.value=d; ta.dispatchEvent(new Event("input",{bubbles:true}));} const ed=document.querySelector(".redactor-editor"); if(ed){ed.innerHTML=d.split("\n\n").map(p=>"<p>"+p+"</p>").join(""); ed.dispatchEvent(new Event("input",{bubbles:true}));} }, DESC);
  await page.evaluate((t)=>{ const el=document.querySelector('input[name="game[tags]"]'); if(el){el.value=t; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true}));} }, TAGS);
  await sleep(1300);

  // 3) 保存前回读
  const rb = await page.evaluate(() => {
    const sel=document.querySelector('select[name="game[type]"]');
    return {
      kind: sel?sel.value:null,
      slug: document.querySelector('input[name="game[slug]"]')?.value,
      shortLen: (document.querySelector('input[name="game[short_text]"]')?.value||"").length,
      descLen: (document.querySelector('textarea[name="game[description]"]')?.value||"").length,
      tags: document.querySelector('input[name="game[tags]"]')?.value,
    };
  });
  log("   pre-save readback:", JSON.stringify(rb));
  await page.screenshot({ path: SHOTS + "/70_pre_save.png" });

  // 4) 真实保存
  log("   real-click Save");
  await page.locator("button.save_btn").first().click({ force: true }).catch(e=>log("   click err", e.message));
  await sleep(9000);
  const notices = await page.evaluate(() => { const c=[...document.querySelectorAll(".error,.error_box,.form_error,.notice,.alert,.lightbox")]; return c.map(e=>e.textContent.replace(/\s+/g," ").trim()).filter(t=>t&&t.length<160).slice(0,4); });
  if (notices.length) log("   notices:", JSON.stringify(notices));

  // 5) reload 验证
  await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4500);
  const st = await page.evaluate(() => {
    const sel=document.querySelector('select[name="game[type]"]');
    return {
      typeVal: sel?sel.value:null,
      slug: document.querySelector('input[name="game[slug]"]')?.value,
      shortLen: (document.querySelector('input[name="game[short_text]"]')?.value||"").length,
      descLen: (document.querySelector('textarea[name="game[description]"]')?.value||"").length,
      tags: document.querySelector('input[name="game[tags]"]')?.value,
      embedUploads: document.querySelectorAll('[name*="[embed][checkbox]"]').length,
    };
  });
  log("   VERIFY:", JSON.stringify(st));
  await page.screenshot({ path: SHOTS + "/71_verified.png", fullPage: true });
  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

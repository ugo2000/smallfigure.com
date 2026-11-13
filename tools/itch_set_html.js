// PHASE1：修正 slug + kind=html + 文案，真实点击保存，验证持久化
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const SHOTS = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

const SLUG = "smallfigure-merge-museum";
const SHORT = "A cozy merge puzzle built from 11 hand-drawn characters. Drop a tiny folk, merge two of a kind, and fill the encyclopedia before the pile tops out.";
const DESC = `Smallfigure: Merge Museum is a small, calm merge puzzle made from the original character art of smallfigure.com. Every piece has a story: a crystal bell that only rings for lost things, a flame imp keeping a candle as a pet, an alien gentleman dressed for a dinner party on a planet that no longer exists.

Drop a character from the top of the board. Two of the same kind merge into the next, stranger character. Chain merges for combo bonuses, unlock all 11 entries in the museum, and try not to let the pile cross the red line.

No installs, no accounts, no timers, no energy. Just one more try.

Playable in the browser — English by default, with a one-tap Chinese toggle. Under 150 KB, loads instantly, zero external assets.

How to play: Move / drag to aim. Tap or click to drop. On a keyboard, use ← → and SPACE. Two identical characters merge on contact.

Credits: Original character art © 2026 smallfigure.com. Built with plain JavaScript; audio synthesised in code. No third-party art or music.

Privacy: https://smallfigure.com/game/privacy.html`;
const TAGS = "merge,puzzle,casual,html5,browser,singleplayer,collection,cute,portrait,no-install,family";

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(60000);
  page.on("dialog", async d => { log("   DIALOG:", d.type()); await d.accept().catch(()=>{}); });
  page.on("response", r => { if (/itch\.io\/game\/edit/.test(r.url()) && r.request().method()==="POST") log("   SAVE POST", r.status()); });

  await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4000);

  // slug
  await page.evaluate((s) => { const el=document.querySelector('input[name="game[slug]"]'); el.value=s; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); }, SLUG);
  // short
  await page.fill('input[name="game[short_text]"]', SHORT).catch(()=>{});
  // desc
  await page.evaluate((d) => {
    const html = d.split("\n\n").map(p => "<p>" + p.replace(/\n/g,"<br>") + "</p>").join("");
    const ed = document.querySelector(".redactor-editor"); if(ed){ ed.innerHTML=html; ed.dispatchEvent(new Event("input",{bubbles:true})); }
    const ta = document.querySelector('textarea[name="game[description]"]'); if(ta){ ta.value=d; ta.dispatchEvent(new Event("input",{bubbles:true})); }
  }, DESC);
  // tags
  await page.evaluate((t) => { const el=document.querySelector('input[name="game[tags]"]'); if(el){el.value=t; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true}));} }, TAGS);
  // kind=html
  const k = await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    if (!sel) return "no sel";
    if (![...sel.options].some(o=>o.value==="html")) sel.appendChild(new Option("HTML","html"));
    let sz=false;
    try { const $=window.jQuery||window.$; if($&&$(sel)[0]&&$(sel)[0].selectize){ const st=$(sel)[0].selectize; st.addOption({value:"html",text:"HTML"}); st.setValue("html",true); sz=true; } } catch(e){}
    sel.value="html"; sel.dispatchEvent(new Event("change",{bubbles:true}));
    return "value="+sel.value+" selectize="+sz;
  });
  log("   kind set:", k);
  await sleep(800);
  log("   slug before save:", await page.evaluate(()=>document.querySelector('input[name="game[slug]"]').value));
  await page.screenshot({ path: SHOTS + "/60_before_save.png" });

  // 真实点击 Save
  log("   real-click Save");
  await page.locator("button.save_btn").first().click({ force: true }).catch(e=>log("   click err", e.message));
  await sleep(9000);
  log("   URL after save:", page.url());
  const errTxt = await page.evaluate(() => { const c=[...document.querySelectorAll(".error,.error_box,.form_error,.notice,.alert,.lightbox")]; return c.map(e=>e.textContent.replace(/\s+/g," ").trim()).filter(t=>t&&t.length<160).slice(0,4); });
  if (errTxt.length) log("   notices:", JSON.stringify(errTxt));
  await page.screenshot({ path: SHOTS + "/61_after_save.png" });

  // reload + verify
  await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4500);
  const st = await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    return {
      typeVal: sel?sel.value:null,
      slug: document.querySelector('input[name="game[slug]"]')?.value,
      shortLen: (document.querySelector('input[name="game[short_text]"]')?.value||"").length,
      descLen: (document.querySelector('textarea[name="game[description]"]')?.value||"").length,
      tags: document.querySelector('input[name="game[tags]"]')?.value,
      embedUploads: document.querySelectorAll('[name*="[embed][checkbox]"]').length,
      playTxt: /played in the browser/i.test(document.body.innerText),
    };
  });
  log("   VERIFY:", JSON.stringify(st));
  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

// Create Smallfigure: Merge Museum as an HTML5 browser-playable itch.io project.
// Resilient: retries navigation, selects kind=html FIRST, fills, uploads, embeds, publishes.
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const SHOTS = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots";
const ZIP = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/outputs/smallfigure-merge-museum-web.zip";
const COVER = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/outputs/cover-630x500.png";
const SHOT1 = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/outputs/game-menu.png";
const SHOT2 = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/outputs/game-play.png";
const SHOT3 = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/outputs/game-collection.png";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

const TITLE = "Smallfigure: Merge Museum";
const SLUG = "smallfigure-merge-museum";
const SHORT = "A cozy merge puzzle built from 11 hand-drawn characters. Drop a tiny folk, merge two of a kind, and fill the encyclopedia before the pile tops out.";
const TAGS = "merge,puzzle,casual,html5,browser,singleplayer,collection,cute,portrait,no-install,family";
const DESC = `Smallfigure: Merge Museum is a small, calm merge puzzle made from the original character art of smallfigure.com.

Drop a character from the top of the board. Two of the same kind merge into the next, stranger character. Chain merges for combo bonuses, unlock all 11 entries in the museum, and try not to let the pile cross the red line.

No installs, no accounts, no timers, no energy. Just one more try.

Playable in the browser — English by default, with a one-tap Chinese toggle. Under 150 KB, loads instantly, zero external assets.

Privacy: https://smallfigure.com/game/privacy.html`;

function findByLabel(page, labelText) {
  return page.evaluate((lab) => {
    const labels = [...document.querySelectorAll("label, .form_label, th, .subform_label")];
    for (const l of labels) {
      if (l.textContent.toLowerCase().includes(lab.toLowerCase())) {
        const forId = l.getAttribute("for");
        if (forId) { const el = document.getElementById(forId); if (el) return el.name || el.id; }
        const el = l.querySelector("input,select,textarea"); if (el) return el.name || el.id;
      }
    }
    // fallback: input whose name/id contains label
    const all = [...document.querySelectorAll("input,select,textarea")];
    for (const el of all) { if ((el.name||el.id||"").toLowerCase().includes(lab.toLowerCase())) return el.name||el.id; }
    return null;
  }, labelText);
}

async function setInput(page, name, value) {
  return page.evaluate(({ name, value }) => {
    const el = document.querySelector(`[name="${name}"]`);
    if (!el) return "missing:" + name;
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
    return "set:" + name;
  }, { name, value });
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(90000);
  page.on("dialog", async d => { await d.accept().catch(()=>{}); });
  page.on("response", r => { if (r.request().method()==="POST" && /itch\.io\/game/.test(r.url())) log("   POST", r.status(), r.url().slice(0,80)); });

  // --- navigate with retry ---
  let ok = false;
  for (let i = 0; i < 6 && !ok; i++) {
    try {
      await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded", timeout: 40000 });
      await page.waitForFunction(() => !!document.querySelector('select[name="game[type]"]'), { timeout: 20000 });
      ok = true; log("   nav ok (attempt " + (i+1) + ")");
    } catch (e) { log("   nav retry " + (i+1) + ":", e.message.slice(0,60)); await sleep(8000); }
  }
  if (!ok) { log("FATAL: cannot reach /game/new"); await ctx.close(); process.exit(2); }
  await sleep(3000);

  // --- 1) select kind = html FIRST ---
  const kindRes = await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    const st = sel.selectize;
    if (!st.options["html"]) st.addOption({ value: "html", text: "HTML" });
    st.setValue("html");
    return st.getValue();
  });
  log("   kind set ->", kindRes);
  await sleep(3000); // re-render
  await page.screenshot({ path: SHOTS + "/90_new_html.png" }).catch(()=>{});

  // --- 2) fill text fields ---
  await setInput(page, "game[title]", TITLE);
  await setInput(page, "game[slug]", SLUG);
  const clsName = await findByLabel(page, "classif");
  if (clsName) { await setInput(page, clsName, "games"); log("   classification ->", clsName); }
  else log("   (no classification field found)");
  await setInput(page, "game[short_text]", SHORT);
  await setInput(page, "game[tags]", TAGS);
  // description via textarea + redactor
  await page.evaluate((d) => {
    const ta = document.querySelector('textarea[name="game[description]"]');
    if (ta) { ta.value = d; ta.dispatchEvent(new Event("input",{bubbles:true})); }
    const ed = document.querySelector(".redactor-editor");
    if (ed) { ed.innerHTML = d.split("\n\n").map(p=>"<p>"+p.replace(/\n/g,"<br>")+"</p>").join(""); ed.dispatchEvent(new Event("input",{bubbles:true})); }
  }, DESC);
  await sleep(1500);
  const rb1 = await page.evaluate(() => ({
    title: document.querySelector('input[name="game[title]"]')?.value,
    slug: document.querySelector('input[name="game[slug]"]')?.value,
    short: (document.querySelector('input[name="game[short_text]"]')?.value||"").length,
    tags: document.querySelector('input[name="game[tags]"]')?.value,
  }));
  log("   after fill:", JSON.stringify(rb1));
  await page.screenshot({ path: SHOTS + "/91_filled.png" }).catch(()=>{});

  // --- 3) upload zip ---
  log("   uploading zip...");
  const clickUploadBtn = () => page.evaluate(() => {
    const b = [...document.querySelectorAll("button,a,.btn,.upload_button,.dropzone")].find(e => /upload|choose|add|file|drop/i.test(e.textContent || e.getAttribute("title") || ""));
    if (b) { b.click(); return true; } return false;
  });
  let zipOk = false;
  const [fc] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 30000 }).catch(() => null),
    clickUploadBtn(),
  ]);
  if (fc) { await fc.setFiles(ZIP); zipOk = true; log("   zip set via filechooser"); }
  if (!zipOk) {
    try { const fi = page.locator('input[type=file]').first(); if (await fi.count()) { await fi.setInputFiles(ZIP); zipOk = true; log("   zip via input[type=file]"); } } catch (e) { log("   input fallback err", e.message.slice(0,40)); }
  }
  if (!zipOk) log("   WARN: zip not uploaded");
  // wait for upload to finish (look for "play in browser" checkbox or file listed)
  let uploaded = false;
  for (let i = 0; i < 60; i++) {
    const state = await page.evaluate(() => {
      const uploading = /uploading/i.test(document.body.textContent);
      const playCb = [...document.querySelectorAll("input[type=checkbox]")].find(c => { const l = document.querySelector(`label[for="${c.id}"]`); return l && /played in the browser/i.test(l.textContent); });
      const fileListed = /smallfigure-merge-museum-web\.zip/i.test(document.body.textContent);
      return { uploading, hasPlayCb: !!playCb, fileListed };
    });
    if (state.fileListed && !state.uploading) { uploaded = true; log("   zip present, not uploading"); break; }
    await sleep(3000);
  }
  if (!uploaded) log("   WARN: upload may not have completed");
  await page.screenshot({ path: SHOTS + "/92_uploaded.png" }).catch(()=>{});

  // --- 4) check "play in browser" + set embed ---
  const embedRes = await page.evaluate(() => {
    const cbs = [...document.querySelectorAll("input[type=checkbox]")];
    const play = cbs.find(c => { const l = document.querySelector(`label[for="${c.id}"]`); return l && /played in the browser/i.test(l.textContent); });
    if (!play) return "no-play-cb";
    if (!play.checked) play.click();
    return "play-checked";
  });
  log("   play-in-browser:", embedRes);
  await sleep(2500);
  // now set width/height/mobile-friendly (re-query after checkbox reveals fields)
  const embedSet = await page.evaluate(() => {
    const setByNameOrLabel = (lab, val) => {
      const all=[...document.querySelectorAll("input,select")];
      for (const el of all){ if((el.name||el.id||"").toLowerCase().includes(lab.toLowerCase())){ el.value=val; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); return el.name||el.id; } }
      const labels=[...document.querySelectorAll("label")];
      for(const l of labels){ if(l.textContent.toLowerCase().includes(lab.toLowerCase())){ const el=document.getElementById(l.getAttribute("for")); if(el){ el.value=val; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); return l.getAttribute("for"); } } }
      return null;
    };
    const w = setByNameOrLabel("width", "420");
    const h = setByNameOrLabel("height", "868");
    const mob = setByNameOrLabel("mobile", ""); // checkbox by label
    // ensure mobile-friendly checkbox checked
    const cbs=[...document.querySelectorAll("input[type=checkbox]")];
    const mobCb=cbs.find(c=>{const l=document.querySelector(`label[for="${c.id}"]`);return l&&/mobile/i.test(l.textContent);});
    if(mobCb && !mobCb.checked) mobCb.click();
    return { w, h, mob, mobChecked: mobCb?mobCb.checked:null };
  });
  log("   embed set:", JSON.stringify(embedSet));
  await page.screenshot({ path: SHOTS + "/93_embed.png" }).catch(()=>{});

  // --- 5) cover + screenshots (best-effort, non-fatal) ---
  for (const [label, path] of [["cover", COVER], ["screenshot", SHOT1], ["screenshot", SHOT2], ["screenshot", SHOT3]]) {
    try {
      const [fc] = await Promise.all([
        page.waitForEvent("filechooser", { timeout: 20000 }).catch(()=>null),
        page.evaluate((lbl) => { const b=[...document.querySelectorAll("button,a,.btn")].find(e=>new RegExp(lbl,"i").test(e.textContent)); if(b){b.click();return true;} return false; }, label),
      ]);
      if (fc) { await fc.setFiles(path); log("   uploaded", label, path.split("/").pop()); await sleep(4000); }
    } catch (e) { log("   (skip "+label+": "+e.message.slice(0,40)+")"); }
  }
  await page.screenshot({ path: SHOTS + "/94_media.png" }).catch(()=>{});

  // --- 6) pricing: Name your own price, min 0 (best-effort) ---
  const priceRes = await page.evaluate(() => {
    const radios=[...document.querySelectorAll('input[type=radio]')];
    const nyop=radios.find(r=>{const l=document.querySelector(`label[for="${r.id}"]`);return l&&/name your own price/i.test(l.textContent);});
    if(nyop){nyop.click();}
    // min price
    const minp=[...document.querySelectorAll("input")].find(e=>(e.name||"").toLowerCase().includes("min")||(e.name||"").toLowerCase().includes("price"));
    if(minp){minp.value="0";minp.dispatchEvent(new Event("input",{bubbles:true}));minp.dispatchEvent(new Event("change",{bubbles:true}));}
    return { nyop: !!nyop, minp: minp?minp.name:null };
  });
  log("   pricing:", JSON.stringify(priceRes));

  // --- 7) verify fields survived, refill if needed ---
  const rb2 = await page.evaluate(() => ({
    kind: document.querySelector('select[name="game[type]"]')?.selectize?.getValue() || document.querySelector('select[name="game[type]"]')?.value,
    slug: document.querySelector('input[name="game[slug]"]')?.value,
    title: document.querySelector('input[name="game[title]"]')?.value,
  }));
  log("   pre-save verify:", JSON.stringify(rb2));
  if (rb2.slug !== SLUG || rb2.title !== TITLE) {
    log("   refilling text fields (re-render wiped them)");
    await setInput(page, "game[title]", TITLE);
    await setInput(page, "game[slug]", SLUG);
    await setInput(page, "game[short_text]", SHORT);
    await setInput(page, "game[tags]", TAGS);
  }
  await page.screenshot({ path: SHOTS + "/95_presave.png" }).catch(()=>{});

  // --- 8) real-click Save ---
  log("   real-click Save");
  await page.locator("button.save_btn").first().click({ force: true }).catch(e=>log("   save click err", e.message));
  await sleep(10000);
  const afterSave = await page.evaluate(() => ({ url: location.href, body: document.body.innerText.replace(/\s+/g," ").trim().slice(0,160) }));
  log("   after save:", JSON.stringify(afterSave));
  await page.screenshot({ path: SHOTS + "/96_aftersave.png", fullPage: true }).catch(()=>{});

  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

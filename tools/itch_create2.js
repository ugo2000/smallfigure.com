// Create Smallfigure: Merge Museum (HTML5, browser-playable) in two phases:
//  Phase 1: /game/new -> kind=html + text fields -> Save (commits html kind server-side)
//  Phase 2: edit page -> upload zip (play-in-browser+embed), cover, screenshots, pricing -> Save
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

async function navNew(page) {
  for (let i = 0; i < 8; i++) {
    try {
      await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded", timeout: 40000 });
      await page.waitForFunction(() => !!document.querySelector('select[name="game[type]"]'), { timeout: 20000 });
      return true;
    } catch (e) { log("   nav retry", i+1, e.message.slice(0,50)); await sleep(7000); }
  }
  return false;
}
async function setKindHtml(page) {
  await page.evaluate(() => { const sel=document.querySelector('select[name="game[type]"]'); const st=sel.selectize; if(!st.options["html"]) st.addOption({value:"html",text:"HTML"}); st.setValue("html"); });
  await sleep(3000);
}
async function fillText(page) {
  const set = (name, val) => page.evaluate(({name,val}) => { const el=document.querySelector(`[name="${name}"]`); if(!el) return "missing"; el.value=val; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); el.dispatchEvent(new Event("blur",{bubbles:true})); return "ok"; }, {name,val});
  await set("game[title]", TITLE);
  await set("game[slug]", SLUG);
  await set("game[short_text]", SHORT);
  await set("game[tags]", TAGS);
  // classification -> Games (select)
  await page.evaluate(() => {
    const el = document.querySelector('select[name="game[user_classification]"]');
    if (el && el.selectize) { const st=el.selectize; const opt=Object.keys(st.options).find(k=>/game/i.test(st.options[k].text)); if(opt) st.setValue(opt); }
    else if (el) { const o=[...el.options].find(o=>/game/i.test(o.textContent)); if(o) el.value=o.value; }
  });
  // description
  await page.evaluate((d) => {
    const ta=document.querySelector('textarea[name="game[description]"]'); if(ta){ta.value=d;ta.dispatchEvent(new Event("input",{bubbles:true}));}
    const ed=document.querySelector(".redactor-editor"); if(ed){ed.innerHTML=d.split("\n\n").map(p=>"<p>"+p.replace(/\n/g,"<br>")+"</p>").join("");ed.dispatchEvent(new Event("input",{bubbles:true}));}
  }, DESC);
  await sleep(1200);
}
// click an element by text within a section, return label
async function clickInSection(page, sectionSel, textRe) {
  return page.evaluate(({sectionSel, textRe}) => {
    const re = new RegExp(textRe, "i");
    let scope = document;
    const sec = document.querySelector(sectionSel);
    if (sec) scope = sec;
    const els = [...scope.querySelectorAll("button,a,div[role=button],.add_file_btn_outer,.upload_drop,*")];
    const hit = els.find(e => { const t=(e.textContent||"").trim(); return t && re.test(t) && t.length < 60 && (e.offsetParent!==null || e.tagName==="BUTTON" || e.tagName==="A"); });
    if (hit) { hit.click(); return "clicked:" + (hit.textContent||"").trim().slice(0,30); }
    return "no-hit";
  }, { sectionSel, textRe });
}
async function uploadFile(page, sectionSel, textRe, path, label) {
  log("   upload", label, "...");
  const [fc] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 30000 }).catch(()=>null),
    clickInSection(page, sectionSel, textRe),
  ]);
  if (fc) { await fc.setFiles(path); log("   " + label + " chooser set"); }
  else {
    // fallback: direct input[type=file] after click
    try { const fi = page.locator('input[type=file]').first(); if (await fi.count()) { await fi.setInputFiles(path); log("   " + label + " via input"); return true; } } catch(e){}
    log("   WARN: " + label + " no filechooser"); return false;
  }
  return true;
}
async function realSave(page) {
  await page.locator("button.save_btn").first().click({ force: true }).catch(e=>log("   save err", e.message.slice(0,40)));
}
async function findEditUrl(page) {
  // after creating, try page.url() or find edit link
  const url = page.url();
  if (/\/game\/edit\//.test(url)) return url;
  const fromLink = await page.evaluate(() => { const a=[...document.querySelectorAll('a[href*="/game/edit/"]')][0]; return a?a.getAttribute("href"):null; });
  if (fromLink) return fromLink;
  return null;
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(90000);
  page.on("dialog", async d => { await d.accept().catch(()=>{}); });
  page.on("response", r => { if (r.request().method()==="POST" && /itch\.io\/game/.test(r.url())) log("   POST", r.status(), r.url().slice(0,70)); });

  // ===== PHASE 1 =====
  log("=== PHASE 1: create with kind=html + text ===");
  if (!(await navNew(page))) { log("FATAL nav"); await ctx.close(); process.exit(2); }
  await setKindHtml(page);
  await fillText(page);
  const rb = await page.evaluate(() => ({ kind: document.querySelector('select[name="game[type]"]')?.selectize?.getValue() || document.querySelector('select[name="game[type]"]')?.value, slug: document.querySelector('input[name="game[slug]"]')?.value, title: document.querySelector('input[name="game[title]"]')?.value }));
  log("   pre-save:", JSON.stringify(rb));
  await page.screenshot({ path: SHOTS + "/100_phase1.png" }).catch(()=>{});
  log("   real-click Save (phase1)");
  await realSave(page);
  await sleep(9000);
  const afterP1 = await page.evaluate(() => ({ url: location.href, body: document.body.innerText.replace(/\s+/g," ").trim().slice(0,200) }));
  log("   after P1:", JSON.stringify(afterP1));
  const editUrl = await findEditUrl(page);
  log("   editUrl:", editUrl);
  await page.screenshot({ path: SHOTS + "/101_after_p1.png", fullPage: true }).catch(()=>{});
  if (!editUrl) { log("FATAL: no edit url after create"); await ctx.close(); process.exit(3); }

  // ===== PHASE 2 =====
  log("=== PHASE 2: upload on edit page ===");
  await page.goto(editUrl, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(e=>log("goto edit", e.message));
  await sleep(5000);
  const p2kind = await page.evaluate(() => document.querySelector('select[name="game[type]"]')?.selectize?.getValue() || document.querySelector('select[name="game[type]"]')?.value);
  log("   edit page kind:", p2kind);

  // upload zip (scoped to uploads section)
  await uploadFile(page, ".upload_editor", "upload files", ZIP, "zip");
  // wait for zip to finish uploading
  let zipDone = false;
  for (let i=0;i<40;i++){ const s=await page.evaluate(()=>({up:/uploading/i.test(document.body.textContent), listed:/smallfigure-merge-museum-web\.zip/i.test(document.body.textContent)})); if(s.listed && !s.up){zipDone=true;break;} await sleep(3000); }
  log("   zipDone:", zipDone);
  await page.screenshot({ path: SHOTS + "/102_zip.png" }).catch(()=>{});

  // check "play in browser" + embed
  const emb = await page.evaluate(() => {
    const cbs=[...document.querySelectorAll("input[type=checkbox]")];
    const play=cbs.find(c=>{const l=document.querySelector(`label[for="${c.id}"]`);return l&&/played in the browser/i.test(l.textContent);});
    if(play && !play.checked) play.click();
    return play? (play.checked?"checked":"check-failed") : "no-play-cb";
  });
  log("   play-in-browser:", emb);
  await sleep(2500);
  const embSet = await page.evaluate(() => {
    const setf=(lab,val)=>{ const all=[...document.querySelectorAll("input,select")]; for(const el of all){ if((el.name||el.id||"").toLowerCase().includes(lab.toLowerCase())){ el.value=val; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); return el.name||el.id; } } const ls=[...document.querySelectorAll("label")]; for(const l of ls){ if(l.textContent.toLowerCase().includes(lab.toLowerCase())){ const el=document.getElementById(l.getAttribute("for")); if(el){el.value=val;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));return l.getAttribute("for");} } } return null; };
    const w=setf("width","420"); const h=setf("height","868");
    const cbs=[...document.querySelectorAll("input[type=checkbox]")]; const mob=cbs.find(c=>{const l=document.querySelector(`label[for="${c.id}"]`);return l&&/mobile/i.test(l.textContent);}); if(mob&&!mob.checked)mob.click();
    return {w,h,mob:mob?mob.checked:null};
  });
  log("   embed:", JSON.stringify(embSet));
  await page.screenshot({ path: SHOTS + "/103_embed.png" }).catch(()=>{});

  // cover + screenshots
  await uploadFile(page, ".cover_uploader_drop, .game_edit_cover_uploader_widget", "upload cover|cover image", COVER, "cover");
  await sleep(4000);
  await uploadFile(page, null, "add screenshots|screenshot", SHOT1, "shot1");
  await sleep(4000);
  await uploadFile(page, null, "add screenshots|screenshot", SHOT2, "shot2");
  await sleep(4000);
  await uploadFile(page, null, "add screenshots|screenshot", SHOT3, "shot3");
  await sleep(4000);
  await page.screenshot({ path: SHOTS + "/104_media.png" }).catch(()=>{});

  // pricing: name your own price, min 0
  const pr = await page.evaluate(() => {
    const radios=[...document.querySelectorAll('input[type=radio]')];
    const nyop=radios.find(r=>{const l=document.querySelector(`label[for="${r.id}"]`);return l&&/name your own price/i.test(l.textContent);});
    if(nyop)nyop.click();
    const minp=[...document.querySelectorAll("input")].find(e=>(e.name||"").toLowerCase().includes("min_price")); if(minp){minp.value="0";minp.dispatchEvent(new Event("input",{bubbles:true}));minp.dispatchEvent(new Event("change",{bubbles:true}));}
    return {nyop:!!nyop, minp:minp?minp.name:null};
  });
  log("   pricing:", JSON.stringify(pr));

  // verify text fields survived; refill if wiped
  const rb2 = await page.evaluate(() => ({ kind: document.querySelector('select[name="game[type]"]')?.selectize?.getValue()||document.querySelector('select[name="game[type]"]')?.value, slug: document.querySelector('input[name="game[slug]"]')?.value, title: document.querySelector('input[name="game[title]"]')?.value }));
  log("   pre-save2:", JSON.stringify(rb2));
  if (!rb2.title || !rb2.slug) { log("   refilling text"); await fillText(page); }

  await page.screenshot({ path: SHOTS + "/105_presave2.png" }).catch(()=>{});
  log("   real-click Save (phase2)");
  await realSave(page);
  await sleep(9000);
  const finalUrl = page.url();
  const finalState = await page.evaluate(() => ({ url: location.href, title: document.title, body: document.body.innerText.replace(/\s+/g," ").trim().slice(0,200) }));
  log("   FINAL:", JSON.stringify(finalState));
  await page.screenshot({ path: SHOTS + "/106_final.png", fullPage: true }).catch(()=>{});

  await ctx.close();
  log("DONE editUrl=" + editUrl + " final=" + finalUrl);
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

// finalize3：把 5353035 切成 HTML 类型 → 重新加载 → 配 embed → 封面 → 公开 → 发布
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const ROOT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772";
const ZIP = ROOT + "/outputs/smallfigure-merge-museum-web.zip";
const COVER = ROOT + "/outputs/cover-630x500.png";
const SHOTS = ROOT + "/tools/itch_shots";
const EDIT = "https://itch.io/game/edit/5353035";
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
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: CHROME,
    proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 },
    args: ["--disable-quic", "--no-sandbox"],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(60000);
  const clearShroud = async () => { await page.evaluate(() => document.querySelectorAll("#lightbox_shroud,.lightbox_shroud").forEach(e=>e.remove())).catch(()=>{}); const g=page.locator("button:has-text('Got it')").first(); if(await g.count()) await g.click().catch(()=>{}); };
  const gotoEdit = async () => { for (let i=1;i<=4;i++){ try{ const r=await page.goto(EDIT,{waitUntil:"domcontentloaded",timeout:45000}); if(r&&r.status()<400) return r; }catch(e){} await sleep(3000);} };

  // ---------- PHASE 1: 改类型为 HTML + 补文案 + 保存 ----------
  log(">> PHASE1 open edit"); await gotoEdit(); await sleep(4500);

  await page.evaluate((slug) => { const el=document.querySelector('input[name="game[slug]"]'); if(el){el.value=slug;el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));} }, SLUG);
  await page.fill('input[name="game[short_text]"]', SHORT).catch(()=>{});
  await page.evaluate((d) => {
    const html = d.split("\n\n").map(p => "<p>" + p.replace(/\n/g,"<br>") + "</p>").join("");
    const ed = document.querySelector(".redactor-editor"); if(ed){ed.innerHTML=html; ed.dispatchEvent(new Event("input",{bubbles:true})); ed.dispatchEvent(new Event("blur",{bubbles:true}));}
    const ta = document.querySelector('textarea[name="game[description]"]'); if(ta){ta.value=d; ta.dispatchEvent(new Event("input",{bubbles:true}));}
  }, DESC);
  await page.evaluate((t) => { const el=document.querySelector('input[name="game[tags]"]'); if(el){el.value=t; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true}));} }, TAGS);

  const kindSet = await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    if (!sel) return { ok:false, reason:"no select" };
    if (![...sel.options].some(o => o.value === "html")) sel.appendChild(new Option("HTML", "html"));
    sel.value = "html";
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    let sz = false;
    try {
      const $ = window.jQuery || window.$;
      if ($ && $(sel)[0] && $(sel)[0].selectize) { const st = $(sel)[0].selectize; st.addOption({ value:"html", text:"HTML" }); st.setValue("html", true); sz = true; }
    } catch (e) {}
    return { ok:true, value: sel.value, selectize: sz };
  });
  log("   kind set:", JSON.stringify(kindSet));
  await sleep(1500);
  await page.screenshot({ path: SHOTS + "/31_kind_html.png" });

  // 保存（顶部 Save）
  log(">> save (persist kind)");
  await clearShroud();
  const saveTop = page.locator("button.save_btn, input.save_btn").first();
  if (await saveTop.count()) { await saveTop.click({ force:true }).catch(e=>log("save err",e.message)); }
  else { await page.locator("button:has-text('Save')").first().click({force:true}).catch(e=>log("save2 err",e.message)); }
  await sleep(7000); await clearShroud();
  await page.screenshot({ path: SHOTS + "/32_saved.png" });
  const afterSaveErr = await page.evaluate(() => { const el=document.querySelector(".lightbox,.error_box"); if(el&&/problem|error|already|invalid/i.test(el.textContent)) return el.textContent.replace(/\s+/g," ").slice(0,200); return null; });
  if (afterSaveErr) log("   SAVE ERROR:", afterSaveErr);

  // ---------- PHASE 2: 重新加载，确认 html 类型 + 配 embed ----------
  log(">> PHASE2 reload, verify kind");
  await gotoEdit(); await sleep(4500);
  const state = await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    const embed = [...document.querySelectorAll('[name*="embed"]')].map(e=>e.name+"["+e.type+"]="+(e.type==="checkbox"?e.checked:(e.value||""))).slice(0,20);
    const playTxt = /This file will be played|played in the browser/i.test(document.body.innerText);
    const uploadIds = [...document.querySelectorAll('[name*="[embed][checkbox]"]')].map(e=>e.name);
    return { typeVal: sel?sel.value:null, embed, playTxt, uploadIds };
  });
  log("   state:", JSON.stringify(state));

  // 切到 html 后，若还没有 embed 勾选框 → 重新上传 zip
  if (!state.uploadIds.length) {
    log("   no embed checkbox -> re-upload zip");
    let fc=null;
    try { const res = await Promise.all([ page.waitForEvent("filechooser",{timeout:12000}).catch(()=>null), page.locator("button:has-text('Upload files')").first().click().catch(()=>{}) ]); fc=res[0]; } catch(e){}
    if (fc) await fc.setFiles(ZIP); else { const inp=await page.$('input[type=file]'); if(inp) await inp.setInputFiles(ZIP); }
    // 等上传完成出现 embed checkbox
    for (let i=0;i<60;i++){ await sleep(2000); const ok=await page.evaluate(()=>!!document.querySelector('[name*="[embed][checkbox]"]') && !/Uploading/i.test(document.body.innerText)); if(ok){log("   re-upload done @",i*2,"s");break;} }
  }

  // 勾选 play in browser（每个 upload 的 embed 勾选）
  log(">> configure embed");
  const cfg = await page.evaluate(() => {
    let played = 0;
    document.querySelectorAll('[name*="[embed][checkbox]"]').forEach(cb => { if(!cb.checked){cb.checked=true; cb.dispatchEvent(new Event("change",{bubbles:true}));} played++; });
    const setVal = (n,v) => { const e=document.querySelector(`[name="${n}"]`); if(e){e.value=v; e.dispatchEvent(new Event("input",{bubbles:true})); e.dispatchEvent(new Event("change",{bubbles:true}));} };
    const setSel = (n,v) => { const e=document.querySelector(`select[name="${n}"]`); if(e){e.value=v; e.dispatchEvent(new Event("change",{bubbles:true}));} };
    const setChk = (n,v) => { const e=document.querySelector(`input[name="${n}"]`); if(e){e.checked=v; e.dispatchEvent(new Event("change",{bubbles:true}));} };
    setSel("embed[embed_type]","frame"); setSel("embed[size_type]","manual");
    setVal("embed[width]","420"); setVal("embed[height]","868");
    setChk("embed[mobile_friendly]",true); setChk("embed[autostart]",true); setChk("embed[fullscreen]",true);
    return { played, embed: [...document.querySelectorAll('[name*="embed"]')].map(e=>e.name+"="+(e.type==="checkbox"?e.checked:(e.value||""))).slice(0,20) };
  });
  log("   embed cfg:", JSON.stringify(cfg));
  await sleep(800);
  await page.screenshot({ path: SHOTS + "/33_embed.png" });

  // 封面
  log(">> upload cover");
  try { const res=await Promise.all([ page.waitForEvent("filechooser",{timeout:10000}).catch(()=>null), page.locator("button:has-text('Upload Cover Image')").first().click().catch(()=>{}) ]); if(res[0]){await res[0].setFiles(COVER); log("   cover set");} } catch(e){log("cover err",e.message);}
  await sleep(5000); await clearShroud();
  const coverOk = await page.evaluate(() => { const hid=document.querySelector('input[name="game[cover_image_id]"]'); return hid?hid.value:null; });
  log("   cover_image_id:", coverOk);

  // 公开
  log(">> visibility=published");
  await page.evaluate(() => { const cb=document.querySelector('input[name="game[published]"][value="published"]'); if(cb){cb.checked=true; cb.dispatchEvent(new Event("change",{bubbles:true}));} });
  await sleep(400); await clearShroud();

  // 保存并查看
  log(">> Save & view page");
  const sv = page.locator("button:has-text('Save & view page')").first();
  if (await sv.count()) await sv.click({ force:true }).catch(e=>log("sv err",e.message));
  await sleep(9000); await clearShroud();
  log("FINAL URL:", page.url());
  const err = await page.evaluate(() => { const el=document.querySelector(".lightbox,.error_box"); if(el&&/problem|error|already|invalid/i.test(el.textContent)) return el.textContent.replace(/\s+/g," ").slice(0,220); return null; });
  if (err) log("ERROR BOX:", err);
  await page.screenshot({ path: SHOTS + "/34_result.png" });

  await ctx.close();
  log("DONE");
})().catch((e) => { log("FATAL", e.stack); process.exit(1); });

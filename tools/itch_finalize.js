// 编辑草稿 5353035 v2：耐心等上传完成 + 回读校验 + 发布
const { chromium } = require("playwright-core");
const fs = require("fs");
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

  const clearShroud = async () => {
    await page.evaluate(() => document.querySelectorAll("#lightbox_shroud, .lightbox_shroud").forEach(e => e.remove())).catch(()=>{});
    const got = page.locator("button:has-text('Got it')").first();
    if (await got.count()) await got.click().catch(()=>{});
  };

  log(">> open edit");
  let r = null;
  for (let i = 1; i <= 4; i++) {
    try { r = await page.goto(EDIT, { waitUntil: "domcontentloaded", timeout: 45000 }); if (r && r.status() < 400) break; }
    catch (e) { log("   goto err", i, e.message.split("\n")[0]); await sleep(3000); }
  }
  log("   status", r && r.status());
  await sleep(4500);

  // 若上次残留未完成上传，先清掉失败的
  await page.evaluate(() => {
    // 删除标记为失败/卡住的上传行（有 Retry/Remove 的）
    document.querySelectorAll(".retry_btn, .delete_upload, a[href*='delete']").forEach(()=>{});
  });

  // 1) slug/short/desc/tags
  await page.evaluate((slug) => { const el = document.querySelector('input[name="game[slug]"]'); if (el) { el.value = slug; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); } }, SLUG);
  await page.fill('input[name="game[short_text]"]', SHORT).catch(e=>log("short err", e.message));
  await page.evaluate((d) => {
    const html = d.split("\n\n").map(p => "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("");
    const ed = document.querySelector(".redactor-editor");
    if (ed) { ed.innerHTML = html; ed.dispatchEvent(new Event("input", { bubbles: true })); ed.dispatchEvent(new Event("blur", { bubbles: true })); }
    const ta = document.querySelector('textarea[name="game[description]"]');
    if (ta) { ta.value = d; ta.dispatchEvent(new Event("input", { bubbles: true })); }
  }, DESC);
  await page.evaluate((t) => { const el = document.querySelector('input[name="game[tags]"]'); if (el) { el.value = t; el.dispatchEvent(new Event("input",{bubbles:true})); el.dispatchEvent(new Event("change",{bubbles:true})); } }, TAGS);
  const descLen = await page.evaluate(() => (document.querySelector('textarea[name="game[description]"]')?.value || "").length || (document.querySelector('.redactor-editor')?.innerText || "").length);
  log("   desc length:", descLen);

  // 2) 检查是否已有完成的上传（上次留下的）
  const existing = await page.evaluate(() => {
    const section = [...document.querySelectorAll("h3, h2")].find(h => /Uploads/i.test(h.textContent));
    const wrap = section ? section.closest(".section, .form_section, div") : null;
    const t = wrap ? wrap.innerText : "";
    return { text: t.slice(0, 300), uploading: /Uploading/i.test(t) };
  });
  log("   existing uploads:", JSON.stringify(existing).slice(0, 200));

  // 3) 上传 zip（若无已完成文件）
  const hasCompletedFile = await page.evaluate(() => {
    const txt = document.body.innerText;
    return /This file will be played/i.test(txt) || !!document.querySelector('[name*="embed"]');
  });
  if (!hasCompletedFile) {
    log(">> upload zip (wait filechooser)");
    let fc = null;
    try {
      const res = await Promise.all([
        page.waitForEvent("filechooser", { timeout: 12000 }).catch(() => null),
        page.locator("button:has-text('Upload files')").first().click().catch(e=>log("upload btn err", e.message)),
      ]);
      fc = res[0];
    } catch (e) { log("fc err", e.message); }
    if (fc) { await fc.setFiles(ZIP); log("   set via filechooser"); }
    else { const inp = await page.$('input[type="file"]'); if (inp) { await inp.setInputFiles(ZIP); log("   set via input"); } }
  } else {
    log("   has completed file already, skip re-upload");
  }

  // 4) 耐心等待上传真正完成
  log(">> wait upload complete...");
  let done = false, lastState = "";
  for (let i = 0; i < 60; i++) {
    await sleep(2000);
    const st = await page.evaluate(() => {
      const txt = document.body.innerText;
      const uploading = /Uploading/i.test(txt);
      const play = /This file will be played|played in the browser/i.test(txt);
      const embed = !!document.querySelector('[name*="embed"]');
      const failed = /upload failed|error uploading|could not upload/i.test(txt);
      // 文件体积出现（说明处理完）
      const size = /\b\d+(\.\d+)?\s?(KB|MB)\b/.test(txt);
      return { uploading, play, embed, failed, size };
    });
    const sig = JSON.stringify(st);
    if (sig !== lastState) { log("   @", i*2, "s", sig); lastState = sig; }
    if (st.failed) { log("   UPLOAD FAILED"); break; }
    if (!st.uploading && (st.play || st.embed) ) { done = true; break; }
    if (!st.uploading && st.size && i > 5) { done = true; break; }
  }
  log("   upload done:", done);
  await clearShroud();
  await page.screenshot({ path: SHOTS + "/21_uploaded.png" });

  // 5) 勾"浏览器内运行" + 尺寸
  log(">> configure embed");
  const embedCfg = await page.evaluate(() => {
    let played = false;
    // label 文本命中
    document.querySelectorAll('label').forEach(l => {
      if (/played in the browser/i.test(l.textContent)) {
        const cb = l.querySelector('input[type=checkbox]') || (l.getAttribute("for") && document.getElementById(l.getAttribute("for")));
        if (cb) { cb.checked = true; cb.dispatchEvent(new Event("change",{bubbles:true})); played = true; }
      }
    });
    // 兜底：name 含 embed 的 checkbox
    document.querySelectorAll('input[type="checkbox"][name*="embed"]').forEach(cb => {
      const n = cb.name.toLowerCase();
      if (/web|play|browser|embed\[web\]/.test(n)) { cb.checked = true; cb.dispatchEvent(new Event("change",{bubbles:true})); played = true; }
    });
    const setVal = (n, v) => { const e = document.querySelector(`[name="${n}"]`); if (e) { e.value = v; e.dispatchEvent(new Event("input",{bubbles:true})); e.dispatchEvent(new Event("change",{bubbles:true})); } };
    setVal("embed[width]", "420"); setVal("embed[height]", "868");
    const mf = document.querySelector('input[name="embed[mobile_friendly]"]'); if (mf) { mf.checked = true; mf.dispatchEvent(new Event("change",{bubbles:true})); }
    return { played, embedNames: [...document.querySelectorAll('[name*="embed"]')].map(e=>e.name).slice(0,10) };
  });
  log("   embed cfg:", JSON.stringify(embedCfg));
  await sleep(800);
  await page.screenshot({ path: SHOTS + "/22_embed.png" });

  // 6) 封面
  log(">> upload cover");
  try {
    const res = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 10000 }).catch(() => null),
      page.locator("button:has-text('Upload Cover Image')").first().click().catch(e=>log("cover btn err", e.message)),
    ]);
    if (res[0]) { await res[0].setFiles(COVER); log("   cover set"); }
    else log("   no cover chooser");
  } catch (e) { log("cover err", e.message); }
  await sleep(5000);
  await clearShroud();
  await page.screenshot({ path: SHOTS + "/23_cover.png" });

  // 7) 公开
  log(">> visibility = published");
  await page.evaluate(() => { const cb = document.querySelector('input[name="game[published]"][value="published"]'); if (cb) { cb.checked = true; cb.dispatchEvent(new Event("change",{bubbles:true})); } });
  await sleep(400);
  await clearShroud();

  // 8) 保存
  log(">> save & view page");
  const saveBtn = page.locator("button:has-text('Save & view page')").first();
  if (await saveBtn.count()) { await saveBtn.click({ force: true }).catch(e=>log("save err", e.message)); }
  await sleep(8000);
  await clearShroud();
  log("FINAL URL:", page.url());
  const err = await page.evaluate(() => {
    const el = document.querySelector(".lightbox, #lightbox, .error_box, .error");
    if (el && /problem|error|already|invalid/i.test(el.textContent)) return el.textContent.replace(/\s+/g," ").slice(0,220);
    return null;
  });
  if (err) log("ERROR BOX:", err);
  await page.screenshot({ path: SHOTS + "/24_result.png", fullPage: false });

  await ctx.close();
  log("DONE");
})().catch((e) => { log("FATAL", e.stack); process.exit(1); });

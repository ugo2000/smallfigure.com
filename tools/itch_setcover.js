// Set the real cover image on itch.io project 5353321
// Key insight: upload cover -> do NOT reload -> POST form immediately (with live cover_image_id)
// Reloading between upload and save wipes the cover (empty hidden field gets submitted).
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const EDIT = "https://itch.io/game/edit/5353321";
const STORE = "https://ugo2000.itch.io/smallfigure-merge-museum";
const ROOT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772";
const COVER = ROOT + "/outputs/cover-630x500.png";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

async function open(ctx) {
  const page = await ctx.newPage();
  for (let i = 0; i < 8; i++) {
    try {
      await page.goto(EDIT, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForFunction(() => !!document.querySelector('input[name="game[title]"]'), { timeout: 20000 });
      await sleep(2000);
      return page;
    } catch (e) { log("nav retry", i + 1, (e.message || "").slice(0, 50)); await sleep(6000); }
  }
  throw new Error("could not load edit page");
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME, headless: true,
    proxy: { server: PROXY }, args: ["--no-sandbox"],
    viewport: { width: 1280, height: 1200 },
  });
  try {
    let page = await open(ctx);
    log("edit page loaded");

    // ---------- 1) upload the cover via the real "Upload Cover Image" button ----------
    const before = await page.evaluate(() => document.querySelector('input[name="game[cover_image_id]"]').value);
    log("cover_image_id before:", before || "(empty)");

    const fcPromise = page.waitForEvent("filechooser", { timeout: 30000 }).catch(() => null);
    const clicked = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button, .button, a.btn")]
        .find(b => /^upload cover image$/i.test((b.textContent || "").replace(/\s+/g, " ").trim()));
      if (!btn) return false;
      btn.click();
      return true;
    });
    log("cover button clicked:", clicked);
    const fc = await fcPromise;
    if (!fc) { log("FATAL: no filechooser fired for cover"); throw new Error("no filechooser"); }
    await fc.setFiles(COVER);
    log("cover file set, waiting for upload to finish...");

    // ---------- 2) wait for the cover id to appear (no reload!) ----------
    let coverId = null, previewInfo = null;
    for (let i = 0; i < 40; i++) {
      await sleep(3000);
      const st = await page.evaluate(() => {
        const el = document.querySelector('input[name="game[cover_image_id]"]');
        const w = document.querySelector(".game_edit_cover_uploader_widget");
        const imgs = [...document.querySelectorAll(".game_edit_cover_uploader_widget img")].map(i => i.src);
        return { id: el ? el.value : null, hasImage: w ? w.className.includes("has_image") : false, imgs };
      }).catch(() => null);
      if (st && st.id) {
        coverId = st.id; previewInfo = st;
        log("cover uploaded -> id:", coverId, "| has_image:", st.hasImage, "| imgs:", JSON.stringify(st.imgs));
        break;
      }
      if (i % 4 === 3) log("  still waiting for cover id...");
    }
    if (!coverId) { log("FATAL: cover id never appeared"); throw new Error("cover upload timeout"); }

    // ---------- 3) SAVE immediately on the same page (carry the live cover_image_id) ----------
    const res = await page.evaluate(async () => {
      const form = document.querySelector('input[name="game[title]"]').closest("form");
      const fd = new FormData(form);
      const params = new URLSearchParams();
      for (const [k, v] of fd.entries()) {
        if (v instanceof File && v.name === "") continue;
        params.append(k, v);
      }
      const sentCover = params.get("game[cover_image_id]");
      const resp = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        credentials: "same-origin", redirect: "follow",
      });
      const text = await resp.text();
      return { status: resp.status, sentCover, body: text.slice(0, 900) };
    });
    log("SAVE POST status:", res.status, "| cover sent:", res.sentCover);
    log("SAVE BODY:", res.body);

    // ---------- 4) reload and verify persistence ----------
    await sleep(4000);
    await page.close();
    page = await open(ctx);
    const after = await page.evaluate(() => ({
      coverImageId: (document.querySelector('input[name="game[cover_image_id]"]') || {}).value,
      hasImage: (document.querySelector(".game_edit_cover_uploader_widget") || {}).className,
      kind: (() => { const s = document.querySelector('select[name="game[type]"]'); return s && s.selectize ? s.selectize.getValue() : (s ? s.value : null); })(),
      published: (() => { const r = document.querySelector('input[name="game[published]"]:checked'); return r ? r.value : null; })(),
      shortLen: (document.querySelector('input[name="game[short_text]"]') || { value: "" }).value.length,
      descLen: (document.querySelector('textarea[name="game[description]"]') || { value: "" }).value.length,
      tags: (document.querySelector('input[name="game[tags]"]') || { value: "" }).value,
    }));
    log("VERIFY EDIT:", JSON.stringify(after));

    // ---------- 5) verify the live store page ----------
    await sleep(2000);
    const store = await ctx.newPage();
    await store.goto(STORE + "?cb=" + Date.now(), { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    await sleep(4000);
    const storeInfo = await store.evaluate(() => {
      const og = document.querySelector('meta[property="og:image"]');
      const tw = document.querySelector('meta[name="twitter:image"]');
      const coverDiv = document.querySelector(".game_cover, .cover, .screenshot_list");
      const allImgs = [...document.querySelectorAll("img")].map(i => i.src).filter(s => /img\.itch\.zone/.test(s));
      return {
        ogImage: og ? og.content : null,
        twitterImage: tw ? tw.content : null,
        coverDivClass: coverDiv ? coverDiv.className : null,
        imgCount: allImgs.length,
        imgs: allImgs.slice(0, 8),
        title: document.title,
      };
    });
    log("VERIFY STORE:", JSON.stringify(storeInfo, null, 1));
    await store.screenshot({ path: ROOT + "/tools/itch_shots/store_with_cover.png" });
    await ctx.close();
    log("DONE");
  } catch (e) {
    log("ERROR:", e.message);
    try { await ctx.close(); } catch (_) {}
  }
})();

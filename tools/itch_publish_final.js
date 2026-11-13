// Final: cover + screenshots + embed 420x868 + publish + verify store page
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const EDIT = "https://itch.io/game/edit/5353321";
const STORE = "https://ugo2000.itch.io/smallfigure-merge-museum";
const ROOT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772";
const COVER = ROOT + "/outputs/cover-630x500.png";
const SHOTS3 = [ROOT + "/outputs/game-menu.png", ROOT + "/outputs/game-play.png", ROOT + "/outputs/game-collection.png"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

async function open(ctx, url) {
  const page = await ctx.newPage();
  for (let i = 0; i < 8; i++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForFunction(() => !!document.querySelector('input[name="game[title]"]'), { timeout: 20000 });
      return page;
    } catch (e) { log("nav retry", i + 1, (e.message || "").slice(0, 60)); await sleep(7000); }
  }
  throw new Error("could not load " + url);
}

async function clickBtnCatchChooser(page, labelRe) {
  const fcPromise = page.waitForEvent("filechooser", { timeout: 25000 }).catch(() => null);
  const clicked = await page.evaluate((labelRe) => {
    const btns = [...document.querySelectorAll("button, a.btn, .button, .btn")];
    const b = btns.find(e => labelRe.test((e.textContent || "").replace(/\s+/g, " ").trim()));
    if (!b) return false;
    b.click();
    return true;
  }, labelRe);
  if (!clicked) log("   (button not matched)");
  return await fcPromise;
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME, headless: true,
    proxy: { server: PROXY }, args: ["--no-sandbox"],
    viewport: { width: 1280, height: 900 },
  });
  try {
    let page = await open(ctx, EDIT);
    log("loaded:", await page.title());

    // ---- 1) cover ----
    const coverId0 = await page.evaluate(() => document.querySelector('input[name="game[cover_image_id]"]').value);
    log("cover_image_id before:", coverId0 || "(empty)");
    if (!coverId0) {
      const fc = await clickBtnCatchChooser(page, /^Upload Cover Image$/i);
      if (!fc) log("WARN: no filechooser for cover");
      else {
        await fc.setFiles(COVER);
        log("cover file set; waiting for id...");
        let got = null;
        for (let i = 0; i < 30; i++) {
          await sleep(3000);
          got = await page.evaluate(() => {
            const el = document.querySelector('input[name="game[cover_image_id]"]');
            return el ? el.value : "";
          }).catch(() => "");
          if (got) break;
        }
        log("cover_image_id after:", got || "STILL EMPTY");
      }
    }

    // reload fresh page state after cover upload re-render
    await page.close();
    page = await open(ctx, EDIT);

    // ---- 2) screenshots ----
    const shotCount = await page.evaluate(() => document.querySelectorAll(".screenshot_row, .screenshot_widget, .screenshot_thumbnail, img.screenshot").length);
    log("screenshot count before:", shotCount);
    for (let i = shotCount; i < 3; i++) {
      const fc = await clickBtnCatchChooser(page, /^Add screenshots?$/i);
      if (!fc) { log("WARN: no filechooser for shot", i + 1); break; }
      await fc.setFiles(SHOTS3[i]);
      log("shot", i + 1, "set; settling...");
      await sleep(15000);
    }

    // ---- 3) embed settings + publish (direct POST) ----
    const res = await page.evaluate(async () => {
      const form = document.querySelector('input[name="game[title]"]').closest("form");
      // set DOM values first so FormData picks them up
      const w = form.querySelector('input[name="embed[width]"]');
      const h = form.querySelector('input[name="embed[height]"]');
      if (w) w.value = "420";
      if (h) h.value = "868";
      for (const cbName of ["embed[mobile_friendly]", "embed[autostart]", "embed[fullscreen]"]) {
        const cb = form.querySelector(`input[name="${cbName}"]`);
        if (cb) cb.checked = true;
      }
      const fd = new FormData(form);
      fd.set("game[published]", "published");
      const params = new URLSearchParams();
      for (const [k, v] of fd.entries()) params.append(k, v);
      const resp = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        credentials: "same-origin", redirect: "follow",
      });
      const text = await resp.text();
      return { status: resp.status, body: text.slice(0, 500) };
    });
    log("PUBLISH POST:", JSON.stringify(res));
    await sleep(4000);

    // ---- 4) verify store page ----
    const page2 = await ctx.newPage();
    let store = {};
    try {
      await page2.goto(STORE, { waitUntil: "domcontentloaded", timeout: 45000 });
      await sleep(4000);
      store = await page2.evaluate(() => ({
        title: document.title,
        h1: (document.querySelector("h1") || {}).textContent || "",
        hasIframe: !!document.querySelector("iframe.game_frame, .iframe_wrapper iframe, iframe"),
        playBtn: /play in browser|run in browser/i.test(document.body.textContent || ""),
        gameCanvas: !!document.querySelector("canvas"),
        bodySnippet: (document.body.textContent || "").replace(/\s+/g, " ").slice(0, 200),
      }));
      await page2.screenshot({ path: ROOT + "/tools/itch_shots/store_final.png" });
    } catch (e) { store = { error: e.message.slice(0, 100) }; }
    log("STORE VERIFY:", JSON.stringify(store, null, 1));
  } catch (e) {
    log("ERROR:", e.message);
  } finally {
    await ctx.close();
    log("DONE");
  }
})();

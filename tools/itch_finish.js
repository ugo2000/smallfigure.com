// Finish publishing: phases = zip | dump | cover | shots | publish
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const EDIT = "https://itch.io/game/edit/5353321";
const STORE = "https://ugo2000.itch.io/smallfigure-merge-museum";
const ROOT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772";
const ZIP = ROOT + "/outputs/smallfigure-merge-museum-web.zip";
const COVER = ROOT + "/outputs/cover-630x500.png";
const SHOTS3 = [ROOT + "/outputs/game-menu.png", ROOT + "/outputs/game-play.png", ROOT + "/outputs/game-collection.png"];
const PHASE = process.argv[2] || "zip";
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

async function clickUploadBtn(page, scopeSel, labelRe) {
  // click the "Upload files"-ish button inside a scoped container, catching filechooser
  const fcPromise = page.waitForEvent("filechooser", { timeout: 25000 }).catch(() => null);
  const clicked = await page.evaluate(({ scopeSel, labelRe }) => {
    const scope = document.querySelector(scopeSel) || document;
    const btns = [...scope.querySelectorAll("button, a, .btn, div.upload_btn, span")];
    const b = btns.find(e => labelRe.test((e.textContent || "").trim()));
    if (!b) return false;
    b.click();
    return (b.textContent || "").trim().slice(0, 40);
  }, { scopeSel, labelRe: new RegExp(labelRe, "i") });
  log("   clicked:", JSON.stringify(clicked));
  const fc = await fcPromise;
  return fc;
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME, headless: true,
    proxy: { server: PROXY }, args: ["--no-sandbox"],
    viewport: { width: 1280, height: 900 },
  });
  try {
    const page = await open(ctx, EDIT);
    log("loaded:", await page.title());

    if (PHASE === "zip") {
      const fc = await clickUploadBtn(page, "body", "^Upload files$");
      if (!fc) { log("FAIL: no filechooser for zip"); }
      else {
        await fc.setFiles(ZIP);
        log("   zip file set, waiting for upload to finish...");
        let done = false;
        for (let i = 0; i < 60; i++) {
          await sleep(3000);
          const st = await page.evaluate(() => {
            const list = document.querySelector(".game_edit_upload_list_widget, .upload_list");
            const txt = list ? list.textContent : "";
            const uploading = /uploading|%\s*uploaded/i.test(txt) || document.querySelector(".upload_bar, .upload_progress");
            const hasFile = /smallfigure-merge-museum-web\.zip/i.test(txt);
            const embedCb = document.querySelector('input[name*="embed"]');
            return { uploading: !!uploading, hasFile, embedCb: !!embedCb, txt: txt.slice(0, 300) };
          });
          log("   poll", i + 1, JSON.stringify({ up: st.uploading, file: st.hasFile, embed: st.embedCb }));
          if (st.hasFile && !st.uploading) { done = true; break; }
          if (st.hasFile && st.embedCb) { done = true; break; }
        }
        log(done ? "UPLOAD DONE" : "UPLOAD TIMEOUT (may still be processing)");
        await sleep(5000);
      }
      await page.screenshot({ path: ROOT + "/tools/itch_shots/zipupload.png", fullPage: false });
    }

    if (PHASE === "dump") {
      const info = await page.evaluate(() => {
        const form = document.querySelector('input[name="game[title]"]').closest("form");
        const fields = [];
        for (const el of form.querySelectorAll("input,select,textarea")) {
          if (!el.name) continue;
          fields.push({ name: el.name, tag: el.tagName, type: el.type || "", value: String(el.value).slice(0, 50) });
        }
        const list = document.querySelector(".game_edit_upload_list_widget, .upload_list");
        return { fields, uploadText: list ? list.textContent.slice(0, 600) : "" };
      });
      for (const f of info.fields) log("  ", f.name, "|", f.tag, f.type, "=", JSON.stringify(f.value));
      log("UPLOAD LIST TEXT:", info.uploadText.replace(/\s+/g, " ").slice(0, 500));
    }

    if (PHASE === "cover") {
      const fc = await clickUploadBtn(page, ".game_edit_cover_uploader_widget, .cover_uploader_drop", "^Upload Cover Image$");
      if (!fc) { log("FAIL: no filechooser for cover"); }
      else {
        await fc.setFiles(COVER);
        log("   cover set, waiting...");
        for (let i = 0; i < 30; i++) {
          await sleep(3000);
          const id = await page.evaluate(() => {
            const el = document.querySelector('input[name="game[cover_image_id]"]');
            return el ? el.value : null;
          });
          if (id) { log("   cover_image_id =", id); break; }
        }
      }
    }

    if (PHASE === "shots") {
      for (let i = 0; i < SHOTS3.length; i++) {
        const fc = await clickUploadBtn(page, ".screenshot_uploader, .game_edit_screenshot_uploader, body", "^Add screenshots?$");
        if (!fc) { log("FAIL: no filechooser for shot " + i); break; }
        await fc.setFiles(SHOTS3[i]);
        log("   shot", i + 1, "set; waiting...");
        await sleep(12000);
      }
      const n = await page.evaluate(() => document.querySelectorAll(".screenshot_row, .screenshot_widget, img.screenshot").length);
      log("   screenshot count ~", n);
    }

    if (PHASE === "publish") {
      // embed settings + publish, all in one direct POST from live form
      const res = await page.evaluate(async () => {
        const form = document.querySelector('input[name="game[title]"]').closest("form");
        const fd = new FormData(form);
        // find upload embed fields
        const embedFields = [];
        for (const el of form.querySelectorAll("input,select,textarea")) {
          if (el.name && (el.name.indexOf("embed") >= 0 || el.name.indexOf("upload[") === 0)) {
            embedFields.push(el.name + "=" + String(el.value).slice(0, 40));
          }
        }
        return { embedFields };
      });
      log("embed/upload fields found:", JSON.stringify(res.embedFields, null, 1));
    }
  } catch (e) {
    log("ERROR:", e.message);
  } finally {
    await ctx.close();
    log("DONE");
  }
})();

// Direct FormData POST approach for itch.io edit page.
// Usage: node itch_formpost.js dump|save
//  dump -> list all form fields of the edit form
//  save -> build FormData from live form, override values, fetch POST, verify
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const EDIT = "https://itch.io/game/edit/5353321";
const MODE = process.argv[2] || "dump";
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

How to play: move / drag to aim, tap or click to drop. On a keyboard, use LEFT / RIGHT and SPACE. Two identical characters merge on contact.

Credits: original character art (c) 2026 smallfigure.com. Built with plain JavaScript; audio synthesised in code. No third-party art or music.

Privacy: https://smallfigure.com/game/privacy.html`;

async function open(ctx) {
  const page = await ctx.newPage();
  for (let i = 0; i < 8; i++) {
    try {
      await page.goto(EDIT, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForFunction(() => !!document.querySelector('input[name="game[title]"]'), { timeout: 20000 });
      return page;
    } catch (e) { log("nav retry", i + 1, (e.message || "").slice(0, 60)); await sleep(7000); }
  }
  throw new Error("could not load edit page");
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME, headless: true,
    proxy: { server: PROXY }, args: ["--no-sandbox"],
    viewport: { width: 1280, height: 900 },
  });
  try {
    const page = await open(ctx);
    log("edit page loaded:", await page.title());

    if (MODE === "dump") {
      const info = await page.evaluate(() => {
        const form = document.querySelector('input[name="game[title]"]').closest("form");
        const fields = [];
        for (const el of form.querySelectorAll("input,select,textarea")) {
          if (!el.name) continue;
          fields.push({ name: el.name, tag: el.tagName, type: el.type || "", value: String(el.value).slice(0, 60) });
        }
        return { action: form.action, method: form.method, enctype: form.enctype, id: form.id, cls: form.className, fields };
      });
      log("FORM:", JSON.stringify({ action: info.action, method: info.method, enctype: info.enctype, id: info.id, cls: info.cls }));
      for (const f of info.fields) log("  ", f.name, "|", f.tag, f.type, "=", JSON.stringify(f.value));
      log("FIELD COUNT:", info.fields.length);
    }

    if (MODE === "save") {
      // 1) save text fields + kind=html via direct FormData POST
      const res = await page.evaluate(async (vals) => {
        const form = document.querySelector('input[name="game[title]"]').closest("form");
        const fd = new FormData(form);
        fd.set("game[title]", vals.title);
        fd.set("game[slug]", vals.slug);
        fd.set("game[short_text]", vals.short);
        fd.set("game[tags]", vals.tags);
        fd.set("game[description]", vals.desc);
        fd.set("game[type]", "html");
        fd.set("game[user_classification]", "game");
        fd.set("game[instructions]", "Move / drag to aim. Tap or click to drop. On a keyboard, use LEFT / RIGHT and SPACE. Two identical characters merge on contact.");
        fd.set("game[release_status]", "released");
        const resp = await fetch(form.action, { method: "POST", body: fd, credentials: "same-origin", redirect: "follow" });
        return { status: resp.status, finalUrl: resp.url, ok: resp.ok };
      }, { title: TITLE, slug: SLUG, short: SHORT, tags: TAGS, desc: DESC });
      log("SAVE POST:", JSON.stringify(res));
      await sleep(4000);

      // 2) verify by reloading
      const page2 = await open(ctx);
      const state = await page2.evaluate(() => {
        const val = (n) => { const el = document.querySelector(`[name="${n}"]`); return el ? String(el.value) : null; };
        const kindSel = document.querySelector('select[name="game[type]"]');
        const st = kindSel && kindSel.selectize;
        return {
          title: val("game[title]"), slug: val("game[slug]"),
          shortLen: (val("game[short_text]") || "").length,
          descLen: (val("game[description]") || "").length,
          tags: val("game[tags]"),
          kindNative: kindSel ? kindSel.value : null,
          kindSelectize: st ? st.getValue() : null,
          classification: val("game[user_classification]"),
        };
      });
      log("VERIFY:", JSON.stringify(state));
    }
  } catch (e) {
    log("ERROR:", e.message);
  } finally {
    await ctx.close();
    log("DONE");
  }
})();

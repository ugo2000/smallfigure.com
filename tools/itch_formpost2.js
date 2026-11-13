// Retry direct save with urlencoded body + dump response body for errors
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const EDIT = "https://itch.io/game/edit/5353321";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

const TITLE = "Smallfigure: Merge Museum";
const SLUG = "smallfigure-merge-museum";
const SHORT = "A cozy merge puzzle of 11 hand-drawn tiny folks. Drop, merge pairs, fill the museum before the pile tops out.";
const TAGS = "merge,puzzle,casual,html5,browser,singleplayer,collection,cute,portrait,family";
const DESC = `Smallfigure: Merge Museum is a small, calm merge puzzle made from the original character art of smallfigure.com.

Drop a character from the top of the board. Two of the same kind merge into the next, stranger character. Chain merges for combo bonuses, unlock all 11 entries in the museum, and try not to let the pile cross the red line.

No installs, no accounts, no timers, no energy. Just one more try.

Playable in the browser — English by default, with a one-tap Chinese toggle. Under 150 KB, loads instantly, zero external assets.

How to play: move / drag to aim, tap or click to drop. On a keyboard, use LEFT / RIGHT and SPACE. Two identical characters merge on contact.

Credits: original character art (c) 2026 smallfigure.com. Built with plain JavaScript; audio synthesised in code. No third-party art or music.

Privacy: https://smallfigure.com/game/privacy.html`;
const INSTR = "Move / drag to aim. Tap or click to drop. On a keyboard, use LEFT / RIGHT and SPACE. Two identical characters merge on contact.";

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
    log("loaded:", await page.title());

    const res = await page.evaluate(async (vals) => {
      const form = document.querySelector('input[name="game[title]"]').closest("form");
      const fd = new FormData(form);
      fd.set("game[title]", vals.title);
      fd.set("game[slug]", vals.slug);
      fd.set("game[short_text]", vals.short);
      fd.set("game[tags]", vals.tags);
      fd.set("game[description]", vals.desc);
      fd.set("game[instructions]", vals.instr);
      fd.set("game[type]", "html");
      fd.set("game[user_classification]", "game");
      fd.set("game[release_status]", "released");
      // urlencoded body
      const params = new URLSearchParams();
      for (const [k, v] of fd.entries()) params.append(k, v);
      const resp = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        credentials: "same-origin", redirect: "follow",
      });
      const text = await resp.text();
      return { status: resp.status, finalUrl: resp.url, ok: resp.ok, bodySnippet: text.slice(0, 1500) };
    }, { title: TITLE, slug: SLUG, short: SHORT, tags: TAGS, desc: DESC, instr: INSTR });
    log("SAVE POST:", JSON.stringify({ status: res.status, finalUrl: res.finalUrl, ok: res.ok }));
    log("BODY SNIPPET:\n" + res.bodySnippet);
    await sleep(4000);

    const page2 = await open(ctx);
    const state = await page2.evaluate(() => {
      const val = (n) => { const el = document.querySelector(`[name="${n}"]`); return el ? String(el.value) : null; };
      const kindSel = document.querySelector('select[name="game[type]"]');
      const st = kindSel && kindSel.selectize;
      return {
        shortLen: (val("game[short_text]") || "").length,
        descLen: (val("game[description]") || "").length,
        instrLen: (val("game[instructions]") || "").length,
        tags: val("game[tags]"),
        kindNative: kindSel ? kindSel.value : null,
        kindSelectize: st ? st.getValue() : null,
      };
    });
    log("VERIFY:", JSON.stringify(state));
  } catch (e) {
    log("ERROR:", e.message);
  } finally {
    await ctx.close();
    log("DONE");
  }
})();

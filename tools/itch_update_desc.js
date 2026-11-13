// 在 itch.io 游戏页描述里加回站链接（smallfigure.com/game/），做反向导流
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const EDIT = "https://itch.io/game/edit/5353321";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

const DESC = `Smallfigure: Merge Museum is a small, calm merge puzzle made from the original character art of smallfigure.com.

Drop a character from the top of the board. Two of the same kind merge into the next, stranger character. Chain merges for combo bonuses, unlock all 11 entries in the museum, and try not to let the pile cross the red line.

No installs, no accounts, no timers, no energy. Just one more try.

Playable in the browser — English by default, with a one-tap Chinese toggle. Under 150 KB, loads instantly, zero external assets.

How to play: move / drag to aim, tap or click to drop. On a keyboard, use LEFT / RIGHT and SPACE. Two identical characters merge on contact.

Also playable on the original site: https://smallfigure.com/game/ (free, same build, with the full character encyclopedia).

Credits: original character art (c) 2026 smallfigure.com. Built with plain JavaScript; audio synthesised in code. No third-party art or music.

Privacy: https://smallfigure.com/game/privacy.html`;

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME, headless: true,
    proxy: { server: PROXY }, args: ["--no-sandbox"],
    viewport: { width: 1280, height: 900 },
  });
  try {
    const page = await ctx.newPage();
    let ok = false;
    for (let i = 0; i < 6; i++) {
      try {
        await page.goto(EDIT, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForFunction(() => !!document.querySelector('input[name="game[title]"]'), { timeout: 20000 });
        ok = true; break;
      } catch (e) { log("nav retry", i + 1); await sleep(8000); }
    }
    if (!ok) throw new Error("edit page unreachable");

    const res = await page.evaluate(async (desc) => {
      const form = document.querySelector('input[name="game[title]"]').closest("form");
      const fd = new FormData(form);
      fd.set("game[description]", desc);
      const params = new URLSearchParams();
      for (const [k, v] of fd.entries()) params.append(k, v);
      const resp = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(), credentials: "same-origin", redirect: "follow",
      });
      return { status: resp.status, body: (await resp.text()).slice(0, 300) };
    }, DESC);
    log("DESC UPDATE:", JSON.stringify(res));
    await sleep(3000);

    // verify
    const p2 = await ctx.newPage();
    await p2.goto(EDIT, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
    await sleep(3000);
    const st = await p2.evaluate(() => {
      const ta = document.querySelector('textarea[name="game[description]"]');
      const d = ta ? ta.value : "";
      return {
        descLen: d.length,
        hasSite: /smallfigure\.com\/game\//.test(d),
        kind: (document.querySelector('select[name="game[type]"]') || {}).value,
        published: (() => {
          const r = document.querySelector('input[name="game[published]"]:checked');
          return r ? r.value : null;
        })(),
      };
    });
    log("VERIFY:", JSON.stringify(st));
  } catch (e) { log("ERROR:", e.message); }
  finally { await ctx.close(); log("DONE"); }
})();

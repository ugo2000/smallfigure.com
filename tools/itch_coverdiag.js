// Diagnose cover image state on edit page 5353321
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const EDIT = "https://itch.io/game/edit/5353321";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME, headless: true,
    proxy: { server: PROXY }, args: ["--no-sandbox"],
    viewport: { width: 1280, height: 1200 },
  });
  try {
    const page = await ctx.newPage();
    for (let i = 0; i < 8; i++) {
      try {
        await page.goto(EDIT, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForFunction(() => !!document.querySelector('input[name="game[title]"]'), { timeout: 20000 });
        break;
      } catch (e) { console.log("nav retry", i + 1); await sleep(6000); }
    }
    await sleep(2500);

    const state = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const cov = q('input[name="game[cover_image_id]"]');
      // find any hidden inputs about cover
      const coverInputs = [...document.querySelectorAll('input')].filter(i => /cover/i.test(i.name || "")).map(i => ({ name: i.name, value: i.value, type: i.type }));
      // look for a cover preview element
      const coverImgs = [...document.querySelectorAll('img')].filter(i => /cover|32201440|3220144/i.test((i.src || "") + " " + (i.className || ""))).map(i => ({ src: (i.src || "").slice(0, 110), cls: i.className }));
      // buttons that mention cover
      const coverBtns = [...document.querySelectorAll("button, a.btn, .button, .btn, label")]
        .map(e => ({ text: (e.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60), id: e.id || null, cls: (e.className || "").toString().slice(0, 50) }))
        .filter(e => /cover/i.test(e.text + " " + e.cls + " " + e.id));
      // section structure around cover input
      const sec = cov ? (cov.closest(".upload_editor, section, .game_row, form > div") || cov.parentElement) : null;
      return {
        coverImageId: cov ? cov.value : "NO_INPUT",
        coverInputs,
        coverImgs: coverImgs.slice(0, 5),
        coverBtns: coverBtns.slice(0, 8),
        secSnippet: sec ? sec.outerHTML.replace(/\s+/g, " ").slice(0, 900) : null,
        // screenshots already attached
        shotInputs: [...document.querySelectorAll('input[name*="screenshot"]')].map(i => i.value).slice(0, 8),
      };
    });
    console.log(JSON.stringify(state, null, 1));
    await page.screenshot({ path: "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots/edit_cover_state.png", fullPage: false });
    await ctx.close();
  } catch (e) {
    console.log("ERR", e.message.slice(0, 200));
    await ctx.close();
  }
})();

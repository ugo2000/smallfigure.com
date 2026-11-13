// Dump upload area DOM on html-kind edit page
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const EDIT = "https://itch.io/game/edit/5353321";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME, headless: true,
    proxy: { server: PROXY }, args: ["--no-sandbox"],
    viewport: { width: 1280, height: 900 },
  });
  try {
    const page = await ctx.newPage();
    await page.goto(EDIT, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForFunction(() => !!document.querySelector('input[name="game[title]"]'), { timeout: 20000 });
    await sleep(3000);
    const info = await page.evaluate(() => {
      const secs = [...document.querySelectorAll(".game_edit_section, .user_form_section, section, .form_section")].map(s => ({
        cls: (s.className || "").toString().slice(0, 60),
        text: (s.textContent || "").replace(/\s+/g, " ").slice(0, 160),
      })).filter(s => /upload|cover|screenshot/i.test(s.cls + s.text)).slice(0, 12);
      const btns = [...document.querySelectorAll("button, a.btn, .button, .btn")].map(b => ({
        tag: b.tagName, cls: (b.className || "").toString().slice(0, 50), text: (b.textContent || "").replace(/\s+/g, " ").trim().slice(0, 50), visible: !!(b.offsetWidth || b.offsetHeight),
      })).filter(b => /upload|cover|screenshot|file/i.test(b.text + b.cls));
      const fileInputs = [...document.querySelectorAll('input[type="file"]')].map(i => ({ cls: (i.className || "").toString().slice(0, 50), accept: i.accept || "" }));
      return { secs, btns, fileInputs };
    });
    log("SECTIONS:", JSON.stringify(info.secs, null, 1));
    log("BUTTONS:", JSON.stringify(info.btns, null, 1));
    log("FILE INPUTS:", JSON.stringify(info.fileInputs, null, 1));
  } catch (e) { log("ERROR:", e.message); }
  finally { await ctx.close(); log("DONE"); }
})();

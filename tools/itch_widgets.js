// Diagnose widget types for each field on /game/new.
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.on("dialog", async d => { await d.accept().catch(()=>{}); });
  await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded", timeout: 40000 }).catch(e=>log("goto",e.message));
  await page.waitForFunction(() => !!document.querySelector('select[name="game[type]"]'), { timeout: 20000 }).catch(()=>{});
  await sleep(4000);

  const info = await page.evaluate(() => {
    const probe = (name) => {
      const el = document.querySelector(`[name="${name}"]`);
      if (!el) return { name, exists: false };
      const parent = el.closest(".form_field,.field,.input_row,.subform") || el.parentElement;
      const hasSelectize = !!(el.selectize || (parent && parent.querySelector(".selectize-control")) || el.classList.contains("selectized"));
      const redactor = !!(document.querySelector(`.redactor-editor`) && (el.tagName==="TEXTAREA"));
      return { name, tag: el.tagName, type: el.type, cls: (el.className||"").toString().slice(0,40), hasSelectize, redactor, id: el.id };
    };
    return {
      title: probe("game[title]"),
      slug: probe("game[slug]"),
      short: probe("game[short_text]"),
      tags: probe("game[tags]"),
      desc: probe("game[description]"),
      classification: probe("game[user_classification]"),
      kind: probe("game[type]"),
      redactorEditors: [...document.querySelectorAll(".redactor-editor")].length,
      selectizeControls: [...document.querySelectorAll(".selectize-control")].map(c=>{const s=c.querySelector("select");return s?s.name:"";}),
    };
  });
  log("WIDGETS:", JSON.stringify(info, null, 0));
  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

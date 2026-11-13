// Compare cover-section DOM: our project (5353321, no cover) vs paper-bloom (5033993, has cover)
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function dump(ctx, id, label) {
  const page = await ctx.newPage();
  for (let i = 0; i < 8; i++) {
    try {
      await page.goto("https://itch.io/game/edit/" + id, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForFunction(() => !!document.querySelector('input[name="game[title]"]'), { timeout: 20000 });
      break;
    } catch (e) { console.log(label, "nav retry", i + 1); await sleep(6000); }
  }
  await sleep(2500);
  const info = await page.evaluate(() => {
    const cov = document.querySelector('input[name="game[cover_image_id]"]');
    // find the DOM block that CONTAINS the cover input
    let node = cov, chain = [];
    while (node && chain.length < 6) {
      chain.push({ tag: node.tagName, cls: (node.className || "").toString().slice(0, 60), id: node.id || null });
      node = node.parentElement;
    }
    // the nearest container that has an "Upload Cover Image" button
    const btns = [...document.querySelectorAll("button, a.btn, .button, .btn, label")];
    const covBtn = btns.find(b => /upload cover image/i.test((b.textContent || "").trim()));
    let sec = covBtn;
    while (sec && !/upload_editor|cover/i.test((sec.className || "").toString())) sec = sec.parentElement;
    return {
      coverImageId: cov ? cov.value : "NO_INPUT",
      chain,
      covBtnHTML: covBtn ? covBtn.outerHTML.replace(/\s+/g, " ").slice(0, 400) : null,
      secClass: sec ? (sec.className || "").toString() : null,
      secHTML: sec ? sec.outerHTML.replace(/\s+/g, " ").slice(0, 2500) : null,
      // any inputs inside the cover section
      secInputs: sec ? [...sec.querySelectorAll("input")].map(i => ({ n: i.name, v: i.value, t: i.type })).slice(0, 12) : null,
    };
  });
  console.log("===== " + label + " (" + id + ") =====");
  console.log(JSON.stringify(info, null, 1));
  await page.close();
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    executablePath: CHROME, headless: true,
    proxy: { server: PROXY }, args: ["--no-sandbox"],
    viewport: { width: 1280, height: 1200 },
  });
  try {
    await dump(ctx, "5353321", "OURS");
    await dump(ctx, "5033993", "PAPER-BLOOM (reference)");
  } catch (e) {
    console.log("ERR", e.message.slice(0, 200));
  } finally {
    await ctx.close();
  }
})();

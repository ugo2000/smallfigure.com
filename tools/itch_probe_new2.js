// Definitive probe of /game/new: dump ALL kind options, try selecting html, observe form.
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

  await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(5000);

  // Dump native select options for game[type]
  const native = await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    if (!sel) return { found: false };
    return { found: true, options: [...sel.options].map(o => ({ value: o.value, text: o.textContent.trim() })) , value: sel.value };
  });
  log("NATIVE select game[type]:", JSON.stringify(native));

  // Dump selectize options (if selectize wrapped it)
  const sz = await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    if (!sel) return { found: false };
    const $ = window.jQuery || window.$;
    if (!($ && $(sel)[0] && $(sel)[0].selectize)) return { selectize: false };
    const st = $(sel)[0].selectize;
    return { selectize: true, options: Object.keys(st.options).map(k => ({ value: k, text: st.options[k].text })), value: st.getValue() };
  });
  log("SELECTIZE game[type]:", JSON.stringify(sz));

  // Also dump the visible selectize dropdown items if open
  const dropdownItems = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".selectize-dropdown .option")].map(o => o.textContent.trim());
    return items;
  });
  log("VISIBLE dropdown items:", JSON.stringify(dropdownItems));

  // Try to select html via selectize if available
  if (sz.selectize) {
    const tryHtml = await page.evaluate(() => {
      const sel = document.querySelector('select[name="game[type]"]');
      const $ = window.jQuery || window.$;
      const st = $(sel)[0].selectize;
      if (!st.options["html"]) st.addOption({ value: "html", text: "HTML" });
      st.setValue("html");
      return st.getValue();
    });
    log("after set html, value=", tryHtml);
    await sleep(2500);
    const after = await page.evaluate(() => {
      const sel = document.querySelector('select[name="game[type]"]');
      const $ = window.jQuery || window.$;
      return { selVal: sel?.value, selectizeVal: $(sel)[0]?.selectize?.getValue() };
    });
    log("post-render kind:", JSON.stringify(after));
    // Check if embed / "play in browser" section appears
    const sections = await page.evaluate(() => {
      return {
        hasEmbed: !!document.querySelector('[name*="[embed][checkbox]"]'),
        hasPlayInBrowser: /played in the browser/i.test(document.body.textContent),
        bodyHasHtml: /html/i.test(document.body.textContent),
      };
    });
    log("sections after html:", JSON.stringify(sections));
  }

  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

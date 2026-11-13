// Dump /game/new form structure AFTER selecting kind=html.
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

  await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(e=>log("goto err", e.message));
  await sleep(5000);
  log("PAGE url:", page.url(), "title:", await page.title().catch(()=>"?"));

  // select kind = html
  await page.waitForSelector('select[name="game[type]"]', { timeout: 20000 }).catch(()=>log("no kind select within 20s"));
  await page.evaluate(() => {
    const sel = document.querySelector('select[name="game[type]"]');
    const st = sel.selectize;
    if (!st) return "no-selectize";
    if (!st.options["html"]) st.addOption({ value: "html", text: "HTML" });
    st.setValue("html");
    return st.getValue();
  });
  await sleep(2500);

  const form = await page.evaluate(() => {
    const fields = [];
    document.querySelectorAll("input, select, textarea").forEach(el => {
      const nm = el.getAttribute("name") || "";
      const id = el.id || "";
      const type = el.type || el.tagName;
      if (!nm && !id) return;
      // only interesting ones
      if (/game\[|embed|pric|classification|publish|visibility|charge|amount|min_price/i.test(nm+id)) {
        const label = (() => { const l=document.querySelector(`label[for="${id}"]`); return l?l.textContent.trim().slice(0,40):""; })();
        fields.push({ tag: el.tagName, type, name: nm, id, label, val: (el.value||"").slice(0,30) });
      }
    });
    return fields;
  });
  log("FORM FIELDS (after html):");
  form.forEach(f => log("  ", JSON.stringify(f)));

  // Also dump all labels/sections text to find classification & pricing controls
  const sections = await page.evaluate(() => {
    return [...document.querySelectorAll("label, .form_label, h3, h4, .subform_head")].map(e=>e.textContent.trim()).filter(t=>t.length && t.length<60).slice(0,60);
  });
  log("LABELS/SECTIONS:");
  sections.forEach(s => log("  L:", s));

  await page.screenshot({ path: "tools/itch_shots/83_newform_html.png", fullPage: true }).catch(()=>{});
  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

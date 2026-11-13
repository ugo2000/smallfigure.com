// 探查 /game/new 表单结构
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: CHROME,
    proxy: { server: PROXY }, viewport: { width: 1440, height: 980 },
    args: ["--disable-quic", "--no-sandbox"],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(45000);
  await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded" });
  await sleep(4000);
  const form = await page.evaluate(() => {
    const fields = [...document.querySelectorAll("input, select, textarea")].map(e => ({
      tag: e.tagName, type: e.type || e.tagName, name: e.name, id: e.id,
      value: (e.value||"").slice(0,30), checked: e.checked,
      label: (e.closest("label")?.textContent || e.previousElementSibling?.textContent || "").trim().slice(0,40)
    }));
    const buttons = [...document.querySelectorAll("button, input[type=submit]")].map(b => (b.value||b.textContent||"").trim().slice(0,40));
    return { url: location.href, title: document.title, fields: fields.slice(0,40), buttons };
  });
  console.log("URL:", form.url);
  console.log("TITLE:", form.title);
  console.log("FIELDS:");
  form.fields.forEach(f => console.log("  ", JSON.stringify(f)));
  console.log("BUTTONS:", JSON.stringify(form.buttons));
  await ctx.close();
})().catch(e => { console.log("FATAL", e.stack); process.exit(1); });

// 精确 dump /game/new 的 kind/type 控件与选项
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: CHROME,
    proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 },
    args: ["--disable-quic", "--no-sandbox"],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(60000);
  await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded" });
  await sleep(4000);
  const dump = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll("select, input").forEach(e => {
      const n = e.name || "";
      if (/type|kind/i.test(n) || /type|kind/i.test(e.id||"") || /downloadable|html/i.test(e.getAttribute&&e.getAttribute('aria-label')||"")) {
        let opts = null;
        if (e.tagName === "SELECT") opts = [...e.options].map(o => o.value + " :: " + o.textContent.trim());
        out.push({ tag: e.tagName, type: e.type, name: n, id: e.id, value: e.value, opts });
      }
    });
    // 也把 "Kind of project" 附近的 DOM 文本挖出来
    const heads = [...document.querySelectorAll("h3, h2, .label, label")].filter(h => /Kind of project/i.test(h.textContent));
    let nearHtml = null;
    if (heads[0]) {
      const wrap = heads[0].parentElement;
      nearHtml = wrap ? wrap.innerText.slice(0, 200) : null;
    }
    return { controls: out, nearHtml };
  });
  console.log(JSON.stringify(dump, null, 2));
  await ctx.close();
})().catch(e => { console.log("FATAL", e.stack); process.exit(1); });

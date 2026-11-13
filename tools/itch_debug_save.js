// 调试 save 是否生效：干净 slug + 测试文案，抓 POST 响应
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const SHOTS = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);
(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, { headless: true, executablePath: CHROME, proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 }, args: ["--disable-quic", "--no-sandbox"] });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(60000);
  page.on("dialog", async d => { log("   DIALOG:", d.type(), d.message().slice(0,100)); await d.accept().catch(()=>{}); });
  page.on("response", async resp => { const req = resp.request(); if (req.method() === "POST") log("   POST", resp.status(), req.url().slice(0,70)); });

  await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4000);

  const TEST_SLUG = "mmslugtest1";
  const before = await page.evaluate((s) => {
    const el = document.querySelector('input[name="game[slug]"]');
    el.value = s; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true }));
    const st = document.querySelector('input[name="game[short_text]"]');
    st.value = "ZZTEST"; st.dispatchEvent(new Event("input",{bubbles:true})); st.dispatchEvent(new Event("change",{bubbles:true}));
    return { slug: document.querySelector('input[name="game[slug]"]').value, short: st.value };
  }, TEST_SLUG);
  log("   before save:", JSON.stringify(before));
  await sleep(500);
  // 再读一次 slug（看 itch JS 是否又追加）
  const slugNow = await page.evaluate(() => document.querySelector('input[name="game[slug]"]').value);
  log("   slug right before click:", slugNow);

  // 找表单和提交按钮
  const btnInfo = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button, input[type=submit]")].filter(b => /save/i.test(b.value || b.textContent || "")).map(b => ({ tag: b.tagName, type: b.type, cls: b.className, txt: (b.value||b.textContent||"").trim() }));
    const forms = [...document.querySelectorAll("form")].map(f => ({ action: f.action, method: f.method, id: f.id }));
    return { btns: btns.slice(0,8), forms: forms.slice(0,6) };
  });
  log("   buttons:", JSON.stringify(btnInfo.btns));
  log("   forms:", JSON.stringify(btnInfo.forms));

  // 用表单原生 requestSubmit 保证提交
  const submitted = await page.evaluate(() => {
    const form = document.querySelector('form[action*="game"], form');
    if (!form) return "no form";
    if (form.requestSubmit) { form.requestSubmit(); return "requestSubmit done"; }
    form.submit(); return "submit done";
  });
  log("   submit:", submitted);
  await sleep(8000);
  log("   URL after submit:", page.url());
  const errTxt = await page.evaluate(() => {
    const cands = [...document.querySelectorAll(".error, .error_box, .form_error, .lightbox, #lightbox, .notice, .alert")];
    const hits = cands.map(e => e.textContent.replace(/\s+/g," ").trim()).filter(t => t && t.length < 200);
    return hits.slice(0,5);
  });
  log("   error/notice texts:", JSON.stringify(errTxt));
  await page.screenshot({ path: SHOTS + "/50_after_submit.png" });

  // 刷新验证
  await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded", timeout: 45000 }).catch(()=>{});
  await sleep(4000);
  const after = await page.evaluate(() => ({ slug: document.querySelector('input[name="game[slug]"]')?.value, short: document.querySelector('input[name="game[short_text]"]')?.value }));
  log("   AFTER reload:", JSON.stringify(after));
  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

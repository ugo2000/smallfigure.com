// 验证 itch-profile 持久化登录态是否仍有效（ugo2000）
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: CHROME,
    proxy: { server: PROXY },
    viewport: { width: 1440, height: 980 },
    args: ["--disable-quic", "--no-sandbox"],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(45000);
  let status = "unknown";
  try {
    const r = await page.goto("https://itch.io/my-games", { waitUntil: "domcontentloaded", timeout: 45000 });
    status = "http " + (r && r.status());
    await sleep(4000);
    const info = await page.evaluate(() => {
      const user = document.querySelector('.user_header_widget a, .login_header a, a[href*="/user/"]');
      const loginLink = !!document.querySelector('a[href*="login?"], a[href*="/login"]');
      const title = document.title;
      // 找页面右上角用户名
      const headerLinks = [...document.querySelectorAll("header a, .header a, .user_panel a")].map(a => a.textContent.trim() + "=>" + (a.href||"")).filter(s=>s.length<120);
      return { title, loginLink, headerLinks: headerLinks.slice(0, 12) };
    });
    console.log("STATUS:", status);
    console.log("TITLE:", info.title);
    console.log("HAS_LOGIN_LINK:", info.loginLink);
    console.log("HEADER:", JSON.stringify(info.headerLinks, null, 2));
  } catch (e) {
    console.log("ERR:", e.message.split("\n")[0]);
  }
  await ctx.close();
})().catch(e => { console.log("FATAL", e.stack); process.exit(1); });

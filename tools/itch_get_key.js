// 确认登录账号 + 提取 butler API key（备用）
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const fs = require("fs");
const ROOT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: CHROME,
    proxy: { server: PROXY }, viewport: { width: 1440, height: 980 },
    args: ["--disable-quic", "--no-sandbox"],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(45000);

  // 1) 确认账号
  await page.goto("https://itch.io/my-games", { waitUntil: "domcontentloaded" });
  await sleep(3500);
  const who = await page.evaluate(() => {
    const a = document.querySelector('a[href*="/user/"]');
    const name = document.querySelector(".user_panel .user_name, .user_header_widget .name");
    return { userLink: a ? a.href : null, name: name ? name.textContent.trim() : null, title: document.title };
  });
  console.log("ACCOUNT:", JSON.stringify(who));

  // 2) 去设置页找 API key
  await page.goto("https://itch.io/user/settings", { waitUntil: "domcontentloaded" });
  await sleep(3500);
  // 找 reveal 按钮并点开
  const reveal = page.locator("button:has-text('Reveal')").first();
  if (await reveal.count()) { await reveal.click().catch(()=>{}); await sleep(1200); }
  const keyInfo = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll("input")].map(i => ({ type: i.type, name: i.name, value: (i.value||"").slice(0,60), id: i.id }));
    const texts = [...document.querySelectorAll("*")].map(e=>e.textContent||"").filter(t=>/api key/i.test(t)).slice(0,5);
    return { inputs: inputs.slice(0, 40), apiText: texts };
  });
  console.log("SETTINGS_INPUTS:", JSON.stringify(keyInfo.inputs));
  console.log("API_TEXT:", JSON.stringify(keyInfo.apiText));

  // 尝试直接读可能是 key 的 input（type=text 且较长）
  const keyVal = await page.evaluate(() => {
    const cand = [...document.querySelectorAll("input[type=text], input:not([type])")].find(i => (i.value||"").length >= 20);
    return cand ? cand.value : null;
  });
  console.log("POSSIBLE_KEY:", keyVal ? keyVal.slice(0,12)+"..." : "none");
  if (keyVal && keyVal.length >= 20) {
    fs.writeFileSync(ROOT + "/.itch_token", keyVal.trim());
    console.log("SAVED .itch_token (len " + keyVal.trim().length + ")");
  }
  await ctx.close();
})().catch(e => { console.log("FATAL", e.stack); process.exit(1); });

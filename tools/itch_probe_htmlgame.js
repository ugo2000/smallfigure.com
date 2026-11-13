// 对照已有 HTML5 游戏，读出正确的 kind / embed 字段
const { chromium } = require("playwright-core");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function probe(page, id) {
  await page.goto("https://itch.io/game/edit/" + id, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(e=>console.log("goto err", id, e.message));
  await sleep(4000);
  return await page.evaluate(() => {
    const typeSel = document.querySelector('select[name="game[type]"]');
    const typeVal = typeSel ? typeSel.value : null;
    const typeHTML = typeSel ? typeSel.outerHTML.replace(/\s+/g," ").slice(0, 400) : null;
    const embed = [...document.querySelectorAll('[name*="embed"]')].map(e => e.name + "[" + e.type + "]=" + (e.type === "checkbox" ? e.checked : (e.value||""))).slice(0, 20);
    const playTxt = /This file will be played|played in the browser/i.test(document.body.innerText);
    const title = document.querySelector('input[name="game[title]"]')?.value;
    // 也找 hidden input 里关于 type 的
    const hiddenType = [...document.querySelectorAll('input[type=hidden]')].filter(i=>/type|web|html/i.test(i.name)).map(i=>i.name+"="+i.value).slice(0,10);
    return { title, typeVal, typeHTML, embed, playTxt, hiddenType };
  });
}

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: CHROME,
    proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 },
    args: ["--disable-quic", "--no-sandbox"],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(60000);
  for (const id of ["5033993", "4757130"]) {
    const info = await probe(page, id);
    console.log("=== edit/" + id + " ===");
    console.log(JSON.stringify(info, null, 2));
  }
  await ctx.close();
})().catch(e => { console.log("FATAL", e.stack); process.exit(1); });

// 探查 edit/5353035 的 type 选项、上传状态、published 状态
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
  const r = await page.goto("https://itch.io/game/edit/5353035", { waitUntil: "domcontentloaded" });
  console.log("status", r && r.status());
  await sleep(4500);
  const info = await page.evaluate(() => {
    const typeSel = document.querySelector('select[name="game[type]"]');
    const typeOpts = typeSel ? [...typeSel.options].map(o => o.value + " :: " + o.textContent.trim()) : [];
    const typeVal = typeSel ? typeSel.value : null;
    const title = document.querySelector('input[name="game[title]"]')?.value;
    const slug = document.querySelector('input[name="game[slug]"]')?.value;
    const shortT = document.querySelector('input[name="game[short_text]"]')?.value;
    const descEd = document.querySelector('.redactor-editor')?.innerHTML?.slice(0,80);
    const tags = document.querySelector('input[name="game[tags]"]')?.value;
    const pub = [...document.querySelectorAll('input[name="game[published]"]')].map(e=>e.value+":"+e.checked).join(",");
    const uploads = [...document.querySelectorAll('.upload_row, .file_list .file, .game_upload, [class*=upload]')].map(e=>(e.textContent||"").trim().slice(0,60)).filter(Boolean).slice(0,10);
    const embed = [...document.querySelectorAll('input[name*="embed"], [name*="embed"]')].map(e=>e.name+"="+(e.type==='checkbox'?e.checked:e.value)).slice(0,15);
    const bodyHasPlay = /played in the browser/i.test(document.body.innerText);
    return { typeOpts, typeVal, title, slug, shortT, descEd, tags, pub, uploads, embed, bodyHasPlay };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772/tools/itch_shots/10_edit_page.png", fullPage: true });
  await ctx.close();
})().catch(e => { console.log("FATAL", e.stack); process.exit(1); });

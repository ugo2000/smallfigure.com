// 用已登录的 itch-profile 把 Merge Museum 上传并发布到 itch.io
const { chromium } = require("playwright-core");
const fs = require("fs");
const PROFILE = "C:/Users/Administrator/.workbuddy/itch-profile";
const CHROME = "C:/Users/Administrator/.agent-browser/browsers/chrome-153.0.8010.52/chrome.exe";
const PROXY = "http://127.0.0.1:7897";
const ROOT = "C:/Users/Administrator/WorkBuddy/Worktrees/smallfigure.com/main-8002f772";
const ZIP = ROOT + "/outputs/smallfigure-merge-museum-web.zip";
const COVER = ROOT + "/outputs/cover-630x500.png";
const SHOT1 = ROOT + "/outputs/game-menu.png";
const SHOT2 = ROOT + "/outputs/game-play.png";
const SHOT3 = ROOT + "/outputs/game-collection.png";
const SHOTS = ROOT + "/tools/itch_shots";
fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(...a);

const TITLE = "Smallfigure: Merge Museum";
const SLUG = "smallfigure-merge-museum";
const TAGLINE = "Drop. Merge. Collect 11 original tiny folks.";
const SHORT = "A cozy merge puzzle built from 11 hand-drawn characters. Drop a tiny folk, merge two of a kind, and fill the encyclopedia before the pile tops out.";
const DESC = `Smallfigure: Merge Museum is a small, calm merge puzzle made from the original character art of smallfigure.com. Every piece has a story: a crystal bell that only rings for lost things, a flame imp keeping a candle as a pet, an alien gentleman dressed for a dinner party on a planet that no longer exists.

Drop a character from the top of the board. Two of the same kind merge into the next, stranger character. Chain merges for combo bonuses, unlock all 11 entries in the museum, and try not to let the pile cross the red line.

No installs, no accounts, no timers, no energy. Just one more try.

Playable in the browser — English by default, with a one-tap Chinese toggle. Under 150 KB, loads instantly, zero external assets.

How to play: Move / drag to aim. Tap or click to drop. On a keyboard, use ← → and SPACE. Two identical characters merge on contact.

Credits: Original character art © 2026 smallfigure.com. Built with plain JavaScript; audio synthesised in code. No third-party art or music.

Privacy: https://smallfigure.com/game/privacy.html`;
const TAGS = "merge,puzzle,casual,html5,browser,singleplayer,collection,cute,portrait,no-install,family";

(async () => {
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true, executablePath: CHROME,
    proxy: { server: PROXY }, viewport: { width: 1440, height: 1100 },
    args: ["--disable-quic", "--no-sandbox"],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());
  page.setDefaultTimeout(60000);

  // filechooser 拦截：按当前目标 setFiles
  let pending = null;
  page.on("filechooser", async (chooser) => {
    if (pending) { try { await chooser.setFiles(pending); } catch (e) { log("setFiles err", e.message); } pending = null; }
  });

  log(">> open /game/new");
  const r = await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded" });
  log("   status", r && r.status());
  await sleep(4000);

  // 1) 基础文本字段
  log(">> fill title/slug/short");
  await page.fill('input[name="game[title]"]', TITLE).catch(e=>log("title err",e.message));
  await page.fill('input[name="game[slug]"]', SLUG).catch(e=>log("slug err",e.message));
  await page.fill('input[name="game[short_text]"]', SHORT).catch(e=>log("short err",e.message));

  // 2) 分类 = game（默认已是）；类型 = html
  log(">> classification / type");
  await page.evaluate(() => {
    const cls = document.querySelector('select[name="game[user_classification]"]');
    if (cls) { cls.value = "game"; cls.dispatchEvent(new Event("change", { bubbles: true })); }
    const sel = document.querySelector('select[name="game[type]"]');
    if (sel) {
      const opts = [...sel.options];
      const t = opts.find(o => /html|browser|web/i.test(o.textContent));
      if (t) { sel.value = t.value; sel.dispatchEvent(new Event("change", { bubbles: true })); }
    }
  });
  await sleep(500);

  // 3) 定价：Name your own price（$0 or donate）
  log(">> pricing: $0 or donate");
  const donate = page.locator("button:has-text('$0 or donate')").first();
  if (await donate.count()) { await donate.click().catch(e=>log("donate err",e.message)); await sleep(800); }

  // 4) 描述（redactor + textarea 双写）
  log(">> description");
  await page.evaluate((d) => {
    const html = d.split("\n\n").map(p => "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("");
    const ed = document.querySelector(".redactor-editor");
    if (ed) { ed.innerHTML = html; ed.dispatchEvent(new Event("input", { bubbles: true })); ed.dispatchEvent(new Event("blur", { bubbles: true })); }
    const ta = document.querySelector('textarea[name="game[description]"]');
    if (ta) { ta.value = d; ta.dispatchEvent(new Event("input", { bubbles: true })); ta.dispatchEvent(new Event("change", { bubbles: true })); }
  }, DESC);

  // 5) 标签
  log(">> tags");
  await page.evaluate((t) => {
    const el = document.querySelector('input[name="game[tags]"]');
    if (el) { el.value = t; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); }
  }, TAGS);
  await sleep(500);

  // 6) AI disclosure = no
  log(">> ai_disclosure = no");
  await page.evaluate(() => {
    const cb = document.querySelector('input[name="ai_disclosure[ai_generated]"][value="no"]');
    if (cb) { cb.checked = true; cb.dispatchEvent(new Event("change", { bubbles: true })); }
  });

  await page.screenshot({ path: SHOTS + "/01_form_filled.png" });
  log("   saved 01_form_filled.png");

  // 7) 上传封面
  log(">> upload cover");
  pending = COVER;
  await page.locator("button:has-text('Upload Cover Image')").first().click().catch(e=>log("cover click err",e.message));
  await sleep(6000);
  await page.screenshot({ path: SHOTS + "/02_cover.png" });

  // 8) 上传游戏 zip
  log(">> upload game zip");
  pending = ZIP;
  await page.locator("button:has-text('Upload files')").first().click().catch(e=>log("upload click err",e.message));
  // 等待上传完成（出现 embed 设置 / 文件行）
  let uploaded = false;
  for (let i = 0; i < 25; i++) {
    await sleep(1500);
    uploaded = await page.evaluate(() =>
      /played in the browser|This file will be played|embed/i.test(document.body.innerText) ||
      !!document.querySelector(".upload_row, .file_list .file, .game_upload, input[name*='embed'], input[name*='upload']"));
    if (uploaded) break;
  }
  log("   upload detected:", uploaded);
  await page.screenshot({ path: SHOTS + "/03_after_upload.png" });

  // 9) 勾选"浏览器内运行" + 尺寸
  log(">> configure embed (play in browser)");
  await page.evaluate(() => {
    const labels = [...document.querySelectorAll("label")];
    for (const l of labels) {
      if (/played in the browser|web/i.test(l.textContent)) {
        const cb = l.querySelector('input[type=checkbox]') || (l.getAttribute("for") ? document.getElementById(l.getAttribute("for")) : null);
        if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event("change", { bubbles: true })); }
      }
    }
    const setVal = (n, v) => { const e = document.querySelector(`[name="${n}"]`); if (e) { e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); } };
    setVal("embed[width]", "420"); setVal("embed[height]", "868");
    const mf = document.querySelector('input[name="embed[mobile_friendly]"]'); if (mf && !mf.checked) { mf.checked = true; mf.dispatchEvent(new Event("change", { bubbles: true })); }
  });
  await sleep(800);
  await page.screenshot({ path: SHOTS + "/04_embed.png" });

  // 10) 发布为公开
  log(">> set published = published");
  await page.evaluate(() => {
    const cb = document.querySelector('input[name="game[published]"][value="published"]');
    if (cb) { cb.checked = true; cb.dispatchEvent(new Event("change", { bubbles: true })); }
  });
  await sleep(400);

  // 11) 保存并查看
  log(">> click Save & view page");
  const saveBtn = page.locator("button:has-text('Save & view page')").first();
  if (await saveBtn.count()) { await saveBtn.click().catch(e=>log("save err",e.message)); }
  await sleep(6000);
  const finalUrl = page.url();
  log("FINAL URL:", finalUrl);
  await page.screenshot({ path: SHOTS + "/05_result.png", fullPage: false });

  // 12) 验证公开页可加载 + 有游戏 iframe
  log(">> verify public page");
  try {
    const p2 = await ctx.newPage();
    await p2.goto(finalUrl, { waitUntil: "domcontentloaded" });
    await sleep(8000);
    const v = await p2.evaluate(() => ({
      title: document.title,
      iframe: !!document.querySelector("iframe"),
      runBtn: [...document.querySelectorAll("button,a")].some(e => /Run game|Play/i.test(e.innerText || "")),
      url: location.href,
    }));
    log("VERIFY:", JSON.stringify(v));
    await p2.screenshot({ path: SHOTS + "/06_public.png" });
    await p2.close();
  } catch (e) { log("verify err", e.message); }

  await ctx.close();
  log("DONE");
})().catch((e) => { log("FATAL", e.stack); process.exit(1); });

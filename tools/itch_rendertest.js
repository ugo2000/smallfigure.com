// Test: does setting selectize values survive subsequent re-renders on /game/new?
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
  await page.goto("https://itch.io/game/new", { waitUntil: "domcontentloaded", timeout: 40000 }).catch(e=>log("goto",e.message));
  await page.waitForFunction(() => !!document.querySelector('select[name="game[type]"]'), { timeout: 20000 }).catch(()=>{});
  await sleep(3000);

  const readKind = () => page.evaluate(() => document.querySelector('select[name="game[type]"]')?.selectize?.getValue() || document.querySelector('select[name="game[type]"]')?.value);
  const readClass = () => page.evaluate(() => document.querySelector('select[name="game[user_classification]"]')?.selectize?.getValue() || document.querySelector('select[name="game[user_classification]"]')?.value);
  const readHidden = () => page.evaluate(() => document.querySelector('select[name="game[type]"]')?.value);

  // set kind=html
  await page.evaluate(() => { const sel=document.querySelector('select[name="game[type]"]'); const st=sel.selectize; if(!st.options["html"]) st.addOption({value:"html",text:"HTML"}); st.setValue("html"); });
  await sleep(1500);
  log("after kind set: kind=", await readKind(), "hidden=", await readHidden());

  // set classification (triggers possible re-render)
  await page.evaluate(() => { const sel=document.querySelector('select[name="game[user_classification]"]'); const st=sel.selectize; const opt=Object.keys(st.options).find(k=>/game/i.test(st.options[k].text)); if(opt) st.setValue(opt); });
  await sleep(1500);
  log("after class set: kind=", await readKind(), "class=", await readClass(), "hidden=", await readHidden());

  // set kind AGAIN (after class re-render) to see if it sticks
  await page.evaluate(() => { const sel=document.querySelector('select[name="game[type]"]'); const st=sel.selectize; st.setValue("html"); });
  await sleep(1500);
  log("after kind re-set: kind=", await readKind(), "class=", await readClass(), "hidden=", await readHidden());

  // Now type title + short natively, then set classification again, see if text survives
  await page.fill('input[name="game[title]"]', "Test Title XYZ").catch(e=>log("title fill err",e.message.slice(0,40)));
  await page.fill('input[name="game[short_text]"]', "Short desc here").catch(e=>log("short fill err",e.message.slice(0,40)));
  await sleep(500);
  const before = await page.evaluate(()=>({title:document.querySelector('input[name="game[title]"]')?.value, short:document.querySelector('input[name="game[short_text]"]')?.value}));
  log("before class re-set: title=", before.title, "short=", before.short);

  await page.evaluate(() => { const sel=document.querySelector('select[name="game[user_classification]"]'); const st=sel.selectize; const opt=Object.keys(st.options).find(k=>/game/i.test(st.options[k].text)); if(opt) st.setValue(opt); });
  await sleep(1500);
  const after = await page.evaluate(()=>({title:document.querySelector('input[name="game[title]"]')?.value, short:document.querySelector('input[name="game[short_text]"]')?.value, kind:document.querySelector('select[name="game[type]"]')?.selectize?.getValue()}));
  log("after class re-set: title=", after.title, "short=", after.short, "kind=", after.kind);

  await ctx.close();
  log("DONE");
})().catch(e => { log("FATAL", e.stack); process.exit(1); });

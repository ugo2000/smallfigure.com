/* 灯箱暂停按钮移除 验收脚本（本地 dev + playwright-core） */
const { chromium } = require('playwright-core');

const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
const BASE = process.env.SF_BASE || 'http://127.0.0.1:8892';
const OUT = require('path').resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(String(e)));
  const results = [];
  const ok = (name, cond) => { results.push([cond ? 'PASS' : 'FAIL', name]); };

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.card', { timeout: 15000 });

  // 1. 暂停按钮已从 DOM 移除
  const btnCount = await page.locator('#lbPlay').count();
  ok('DOM 中不再有 #lbPlay', btnCount === 0);

  // 2. 打开一张静态图：灯箱正常，动作区只剩 下载 + 语言切换
  await page.locator('.card').first().click();
  await page.waitForSelector('#lightbox:not([hidden])', { timeout: 5000 });
  const lbVisible = await page.locator('#lightbox').isVisible();
  const dlVisible = await page.locator('#lbDownload').isVisible();
  const actionsHtml = await page.locator('.lb-actions').innerHTML();
  ok('静态图灯箱正常打开', lbVisible);
  ok('下载按钮在位', dlVisible);
  ok('动作区无暂停按钮', !actionsHtml.includes('lbPlay') && !actionsHtml.includes('暂停'));
  await page.screenshot({ path: OUT + '/_lb_static_noplay.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 3. 打开动图（WebP 循环）：同样无暂停按钮，图正常显示
  await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('.card'))
      .find(c => (c.querySelector('h3') || {}).textContent || '');
    return null;
  });
  // 直接走小人动图分类
  await page.locator('#chips .chip[data-cat="motion"]').click();
  await page.waitForTimeout(400);
  await page.locator('.card').first().click();
  await page.waitForSelector('#lightbox:not([hidden])', { timeout: 5000 });
  const animName = await page.locator('#lbName').textContent();
  const imgSrc = await page.locator('#lbStage img').getAttribute('src');
  ok('动图灯箱打开（' + animName + '）', !!animName);
  ok('动图用 img 原生播放', !!imgSrc && imgSrc.includes('.webp'));
  const animActions = await page.locator('.lb-actions').innerHTML();
  ok('动图灯箱也无暂停按钮', !animActions.includes('lbPlay'));
  await page.screenshot({ path: OUT + '/_lb_anim_noplay.png' });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 4. 灯箱关闭后 body 滚动恢复
  const overflow = await page.evaluate(() => document.body.style.overflow);
  ok('关闭灯箱后页面滚动恢复', overflow === '');

  // 5. 全局 [hidden] 防御规则在位
  const hiddenRule = await page.evaluate(() => {
    const el = document.createElement('div');
    el.hidden = true;
    el.className = 'btn';   /* 历史上 .btn 的 display 会盖掉 hidden */
    document.body.appendChild(el);
    const d = getComputedStyle(el).display;
    el.remove();
    return d;
  });
  ok('带 .btn 类的 hidden 元素计算为 none', hiddenRule === 'none');

  // 6. 无 JS 报错
  ok('全程无 JS 报错', jsErrors.length === 0);
  if (jsErrors.length) console.log('JS ERRORS:', jsErrors);

  await browser.close();
  let fail = 0;
  for (const [st, name] of results) { if (st === 'FAIL') fail++; console.log(st + '  ' + name); }
  console.log('----');
  console.log(fail === 0 ? 'ALL PASS (' + results.length + '/' + results.length + ')' : 'FAILED ' + fail + '/' + results.length);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(2); });

/* 回到顶部按钮验收（tools/_test_totop.js）
 * 用法：SF_BASE=http://127.0.0.1:8794 node tools/_test_totop.js
 * 断言：初始隐藏 / 滚动后出现 / 悬停展开文字 / 点击回到顶部 / 不与音乐按钮重叠 / 中英文案齐全
 */
const { chromium } = require('playwright-core');

const EXEC = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
const BASE = process.env.SF_BASE || 'http://127.0.0.1:8794';

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('PASS ', name); }
  else { fail++; console.log('FAIL ', name, extra !== undefined ? '| ' + extra : ''); }
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  /* 本地纯静态服务器没有 Pages Functions，/api/* 必然 404；线上未登录时 /api/auth/me 返回 401
     （登录门控的预期行为）——都与本页无关，只收真正的 JS 异常 */
  const isApiNoise = (t) => /\/(api|functions)\//.test(t) || /status of (404|401)/.test(t);
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !isApiNoise(m.text())) errors.push(m.text()); });

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const btn = page.locator('#toTopBtn');
  ok('按钮存在于 DOM', await btn.count() === 1);

  /* 1. 初始（页面顶部）应隐藏 */
  ok('页面顶部时按钮隐藏', await btn.isHidden());

  /* 2. 滚动超过阈值后出现 */
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(500);
  ok('滚动后按钮出现', await btn.isVisible());

  /* 3. 位置：固定在右下角，且在音乐按钮上方（不重叠） */
  const geo = await page.evaluate(() => {
    const t = document.getElementById('toTopBtn').getBoundingClientRect();
    const m = document.getElementById('bgmBtn').getBoundingClientRect();
    return { t: { x: t.x, y: t.y, w: t.width, h: t.height }, m: { x: m.x, y: m.y, w: m.width, h: m.height } };
  });
  ok('按钮固定在视口右侧', geo.t.x > 1100, 'x=' + geo.t.x);
  ok('按钮在视口底部附近', geo.t.y > 500, 'y=' + geo.t.y);
  const overlap = !(geo.t.y + geo.t.h <= geo.m.y || geo.m.y + geo.m.h <= geo.t.y
    || geo.t.x + geo.t.w <= geo.m.x || geo.m.x + geo.m.w <= geo.t.x);
  ok('与音乐按钮不重叠', !overlap, JSON.stringify(geo));
  ok('按钮尺寸合理（44px 高）', Math.abs(geo.t.h - 44) < 2, 'h=' + geo.t.h);

  /* 4. 悬停展开文字 */
  const before = await page.evaluate(() => {
    const l = document.querySelector('.to-top-label');
    return { w: l.getBoundingClientRect().width, op: getComputedStyle(l).opacity };
  });
  await btn.hover();
  await page.waitForTimeout(450);
  const after = await page.evaluate(() => {
    const l = document.querySelector('.to-top-label');
    return { w: l.getBoundingClientRect().width, op: getComputedStyle(l).opacity };
  });
  ok('悬停前文字收起', before.w < 2 && parseFloat(before.op) < 0.1, JSON.stringify(before));
  ok('悬停后文字展开', after.w > 40 && parseFloat(after.op) > 0.9, JSON.stringify(after));

  /* 5. 点击回到顶部 */
  await btn.click();
  await page.waitForTimeout(1400);
  const y = await page.evaluate(() => window.pageYOffset);
  ok('点击后回到页面顶部', y < 10, 'scrollY=' + y);
  ok('回到顶部后按钮重新隐藏', await btn.isHidden());

  /* 6. 英文文案切换 */
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(300);
  await page.click('.lang-btn[data-lang="en"]');
  await page.waitForTimeout(700);
  const enText = await page.locator('.to-top-label').textContent();
  const enAria = await btn.getAttribute('aria-label');
  ok('英文标签正确', /back to top/i.test(enText), enText);
  ok('英文 aria-label 正确', /back to top/i.test(enAria), enAria);
  await page.click('.lang-btn[data-lang="zh"]');
  await page.waitForTimeout(600);
  const zhText = await page.locator('.to-top-label').textContent();
  ok('切回中文标签正确', zhText.trim() === '回到顶部', zhText);

  /* 7. 移动端不顶出屏幕 */
  await page.setViewportSize({ width: 375, height: 700 });
  await page.waitForTimeout(400);
  const mob = await page.evaluate(() => {
    const t = document.getElementById('toTopBtn').getBoundingClientRect();
    return { right: window.innerWidth - t.right, x: t.x };
  });
  ok('移动端按钮未超出右边界', mob.right >= 0, JSON.stringify(mob));

  ok('全程无 JS 报错', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
  console.log(`\n---- ${fail === 0 ? 'ALL PASS' : 'FAILED'} (${pass}/${pass + fail}) ----`);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });

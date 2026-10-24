/* 登录门控 + 下载归属 全链路验收（playwright-core，显式 chromium 路径）
 * 用法：先起本地服务 npx wrangler pages dev _site --port 8788 --ip 127.0.0.1
 *      （D1 本地库需先跑 tools/d1_migrations/000_baseline.sql 与 001_auth.sql）
 * 然后：NODE_PATH=<node workspace>/node_modules node tools/_test_auth_flow.js
 * 覆盖：匿名态登录入口 / 下载按钮引导文案 / 未登录拦截 / 注册 / 登录后补下载 /
 *       右键拦截 / 已登录下载 / 退出登录。注意注册限流 5 次/小时，复跑前重启 dev 服务。 */
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe' });
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const results = [];
  const ok = (name, cond) => { results.push((cond ? 'PASS' : 'FAIL') + ' ' + name); console.log((cond ? 'PASS' : 'FAIL') + ' ' + name); };

  await p.goto('http://127.0.0.1:8788/', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2500);

  // 1) 未登录：头部显示登录按钮
  ok('匿名态头部显示登录按钮', await p.locator('#loginBtn').count() === 1);

  // 2) 点卡片开灯箱，下载按钮显示「登录后下载」
  await p.locator('.card').first().click();
  await p.waitForTimeout(400);
  ok('灯箱下载按钮显示登录引导', (await p.locator('#lbDownload').textContent()).includes('登录后下载'));

  // 3) 点下载 → 弹登录窗，不触发文件下载
  let downloadCount = 0;
  p.on('download', () => downloadCount++);
  await p.locator('#lbDownload').click();
  await p.waitForTimeout(400);
  ok('未登录点下载弹出登录窗', await p.locator('#authModal').isVisible());
  ok('未登录不触发文件下载', downloadCount === 0);

  // 4) 切注册 tab 并提交（随机邮箱，避免重复注册干扰复跑）
  const stamp = Date.now();
  const email = 'u' + stamp + '@test.com';
  await p.locator('.auth-tab[data-tab="register"]').click();
  await p.fill('#authEmail', email);
  await p.fill('#authPass', 'browser12345');
  await p.locator('#authSubmit').click();
  await p.waitForTimeout(1500);
  ok('注册后弹窗关闭', !(await p.locator('#authModal').isVisible()));
  ok('头部显示用户名', (await p.locator('.auth-user').textContent()).includes('u' + stamp));
  ok('登录后补下载触发', downloadCount === 1);

  // 5) 右键菜单被拦
  const prevented = await p.evaluate(() => {
    const img = document.querySelector('.card img');
    const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    img.dispatchEvent(e);
    return e.defaultPrevented;
  });
  ok('卡片图右键被拦截', prevented === true);

  // 6) 已登录再下载一次（计数+归属）
  const dl2 = p.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await p.locator('#lbDownload').click();
  await dl2;
  await p.waitForTimeout(800);
  ok('已登录可正常下载', downloadCount === 2);

  // 7) 退出登录（先关灯箱，遮罩会挡住头部按钮）
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  await p.locator('#logoutBtn').click();
  await p.waitForTimeout(600);
  ok('退出后显示登录按钮', await p.locator('#loginBtn').count() === 1);

  console.log(results.join('\n'));
  const fails = results.filter(r => r.startsWith('FAIL')).length;
  console.log(fails === 0 ? 'ALL PASS' : fails + ' FAILED');
  await p.screenshot({ path: '_test_auth_done.png' });
  await browser.close();
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error(e.message); process.exit(1); });

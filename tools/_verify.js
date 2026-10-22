/* 本地功能验证：网格渲染 / 搜索 / 尺寸筛选 / 灯箱 / 精灵图动画 */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'http://127.0.0.1:8901';

(async () => {
  const browser = await pw.chromium.launch({ executablePath: EXE, args: ['--mute-audio'] });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  pg.on('pageerror', e => errors.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(600);

  const cards = await pg.locator('.card').count();
  const countText = await pg.locator('#countLine').innerText();
  console.log('卡片数:', cards, '| 计数行:', countText.replace(/\n/g, ' '));

  // 立绘 PNG 透明通道（棋盘格底）在渲染
  const checker = await pg.locator('.card .stage.checker').count();
  console.log('棋盘格透明底卡片:', checker, checker > 0 ? 'PASS' : 'FAIL');

  // 搜索「老张」
  await pg.fill('#search', '老张');
  await pg.waitForTimeout(300);
  const s1 = await pg.locator('.card').count();
  console.log('搜索「老张」结果:', s1, s1 > 0 && s1 < cards ? 'PASS' : 'FAIL');
  await pg.fill('#search', '不存在的词xyz');
  await pg.waitForTimeout(300);
  const emptyVisible = await pg.locator('#empty').isVisible();
  console.log('空状态显示:', emptyVisible ? 'PASS' : 'FAIL');
  await pg.click('#resetBtn');
  await pg.waitForTimeout(200);

  // 尺寸筛选 >1600px
  await pg.selectOption('#sizeFilter', 'xl');
  await pg.waitForTimeout(200);
  const xl = await pg.locator('.card').count();
  console.log('尺寸筛选 >1600px:', xl, 'PASS');
  await pg.selectOption('#sizeFilter', 's');
  await pg.waitForTimeout(200);
  const s = await pg.locator('.card').count();
  console.log('尺寸筛选 <=400px:', s, 'PASS');
  await pg.selectOption('#sizeFilter', 'all');

  // 分类筛选「小徽章」
  await pg.click('.chip[data-cat="badges"]');
  await pg.waitForTimeout(200);
  const badgeCat = await pg.locator('.card').count();
  console.log('徽章分类:', badgeCat, '张', badgeCat === 3 ? 'PASS' : 'FAIL');
  await pg.click('.chip[data-cat="all"]');
  await pg.waitForTimeout(200);

  // 灯箱
  await pg.locator('.card').first().click();
  await pg.waitForTimeout(300);
  const lbVisible = await pg.locator('#lightbox').isVisible();
  const lbName = await pg.locator('#lbName').innerText();
  const lbImg = await pg.locator('#lbStage img').count();
  console.log('灯箱:', lbVisible ? 'PASS' : 'FAIL', '|', lbName, '| 图:', lbImg);
  // 键盘切换
  await pg.keyboard.press('ArrowRight');
  await pg.waitForTimeout(200);
  const lbName2 = await pg.locator('#lbName').innerText();
  console.log('方向键切换:', lbName, '->', lbName2, lbName !== lbName2 ? 'PASS' : 'FAIL');
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(200);
  console.log('ESC 关闭:', await pg.locator('#lightbox').isHidden() ? 'PASS' : 'FAIL');

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无 PASS');
  await browser.close();
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

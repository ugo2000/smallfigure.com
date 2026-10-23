/* 中文界面灯箱标签视觉确认：截中文 / 英文两个灯箱对比 */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'https://www.smallfigure.com';

(async () => {
  const browser = await pw.chromium.launch({
    executablePath: EXE,
    args: ['--mute-audio', '--proxy-server=http://127.0.0.1:7897']
  });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);

  /* 中文：燧石战斧（原先标签全是英文 flint/axe/transparent） */
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(700);
  await pg.click('.chip[data-cat="stoneage"]');
  await pg.waitForTimeout(700);
  await pg.click('.card');
  await pg.waitForTimeout(800);
  const zh = await pg.evaluate(() => ({
    cat: document.querySelector('#lbCat').textContent,
    name: document.querySelector('#lbName').textContent,
    desc: document.querySelector('#lbDesc').textContent,
    tags: [...document.querySelectorAll('#lbTags span')].map(e => e.textContent.trim())
  }));
  console.log('中文灯箱:', JSON.stringify(zh, null, 1));
  await pg.screenshot({ path: 'tools/_shot_lb_zh.png' });
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(400);

  /* 英文 */
  await pg.click('.site-header .lang-btn[data-lang="en"]');
  await pg.waitForTimeout(700);
  await pg.click('.chip[data-cat="stoneage"]');
  await pg.waitForTimeout(700);
  await pg.click('.card');
  await pg.waitForTimeout(800);
  const en = await pg.evaluate(() => ({
    cat: document.querySelector('#lbCat').textContent,
    name: document.querySelector('#lbName').textContent,
    desc: document.querySelector('#lbDesc').textContent,
    tags: [...document.querySelectorAll('#lbTags span')].map(e => e.textContent.trim())
  }));
  console.log('英文灯箱:', JSON.stringify(en, null, 1));
  await pg.screenshot({ path: 'tools/_shot_lb_en.png' });

  /* 切语言后标签是否即时刷新（不重开灯箱）
     注意：灯箱遮罩会挡住顶栏切换器，必须用灯箱内的迷你切换器 .lang-toggle-sm */
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(300);
  await pg.click('.chip[data-cat="flora"]');
  await pg.waitForTimeout(600);
  await pg.click('.card');
  await pg.waitForTimeout(700);
  const before = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
  const miniZh = await pg.$('#lightbox .lang-toggle-sm .lang-btn[data-lang="zh"]');
  if (miniZh) {
    await miniZh.click();
    await pg.waitForTimeout(700);
    const after = await pg.$$eval('#lbTags span', els => els.map(e => e.textContent.trim()));
    console.log('开着灯箱切语言：before =', JSON.stringify(before));
    console.log('                  after  =', JSON.stringify(after));
  } else {
    console.log('（灯箱内未找到迷你切换器，跳过即时刷新检查）');
  }

  await browser.close();
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });
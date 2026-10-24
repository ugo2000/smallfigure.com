/* 分类行折叠/展开 验收脚本（本地 dev + playwright-core） */
const { chromium } = require('playwright-core');

const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
const BASE = process.env.SF_BASE || 'http://127.0.0.1:8891';
const OUT = require('path').resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const results = [];
  const ok = (name, cond) => { results.push([cond ? 'PASS' : 'FAIL', name]); };

  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#chips .chip', { timeout: 15000 });
  await page.waitForFunction(() => document.querySelectorAll('#chips .chip').length > 5, null, { timeout: 15000 });

  const totalChips = await page.locator('#chips .chip').count();

  // 1. 默认折叠：容器带 clamped，内联 max-height 已设，更多按钮可见
  const clamped = await page.locator('#chips').evaluate(el => el.classList.contains('clamped'));
  const inlineH = await page.locator('#chips').evaluate(el => el.style.maxHeight);
  const moreVisible = await page.locator('#chipsMore').isVisible();
  ok('默认折叠态 clamped', clamped);
  ok('内联 max-height 已设置', !!inlineH && parseInt(inlineH) > 0);
  ok('更多按钮可见', moreVisible);

  // 2. 只显示一行：容器可视高度只有一行，且内容确实被裁剪
  const rowInfo = await page.evaluate(() => {
    const el = document.querySelector('#chips');
    const chips = Array.from(el.querySelectorAll('.chip'));
    const rowH = chips[0].offsetHeight;
    return {
      oneRow: el.clientHeight <= rowH + 2,
      clipped: el.scrollHeight > el.clientHeight + 2,
      visible: chips.filter(c => c.getBoundingClientRect().top < chips[0].getBoundingClientRect().top + 2).length,
      total: chips.length,
    };
  });
  ok('默认只显示一行（容器可视高度=一行）', rowInfo.oneRow);
  ok('一行放不下全部分类（有裁剪）', rowInfo.clipped);

  // 3. 按钮初始文案与状态
  const label0 = await page.locator('#chipsMoreLabel').textContent();
  const exp0 = await page.locator('#chipsMore').getAttribute('aria-expanded');
  ok('初始文案为「更多」', label0 === '更多');
  ok('aria-expanded=false', exp0 === 'false');

  // 4. 点击展开：按钮 open、文案「收起」、chips 行数变多、aria-expanded=true
  await page.locator('#chipsMore').click();
  await page.waitForTimeout(300);
  const openCls = await page.locator('#chipsMore').evaluate(el => el.classList.contains('open'));
  const label1 = await page.locator('#chipsMoreLabel').textContent();
  const exp1 = await page.locator('#chipsMore').getAttribute('aria-expanded');
  const expCls = await page.locator('#chips').evaluate(el => el.classList.contains('expanded') && !el.classList.contains('clamped'));
  const arrowRot = await page.locator('#chipsMore .arrow').evaluate(el => getComputedStyle(el).transform);
  ok('展开后按钮带 open 类', openCls);
  ok('展开后文案为「收起」', label1 === '收起');
  ok('aria-expanded=true', exp1 === 'true');
  ok('chips 容器切到 expanded', expCls);
  ok('箭头旋转 180°', arrowRot === 'matrix(-1, 0, 0, -1, 0, 0)' || arrowRot.includes('matrix(-1'));

  const rowsAfter = await page.evaluate(() => {
    const chips = Array.from(document.querySelectorAll('#chips .chip'));
    const tops = new Set(chips.map(c => Math.round(c.getBoundingClientRect().top)));
    return tops.size;
  });
  ok('展开后出现多行', rowsAfter > 1);
  await page.screenshot({ path: OUT + '/_chips_expanded_zh.png' });

  // 5. 展开态点一个分类：能正常筛选，且展开态保持
  await page.locator('#chips .chip').nth(3).click();
  await page.waitForTimeout(300);
  const activeCat = await page.locator('#chips .chip.active').getAttribute('data-cat');
  const stillOpen = await page.locator('#chipsMore').evaluate(el => el.classList.contains('open'));
  const countText = await page.locator('#countLine').textContent();
  ok('点击分类后筛选生效', activeCat && activeCat !== 'all' && countText.includes('当前显示'));
  ok('选完分类仍保持展开（选中项可见）', stillOpen);

  // 6. 再点一次收起
  await page.locator('#chipsMore').click();
  await page.waitForTimeout(300);
  const label2 = await page.locator('#chipsMoreLabel').textContent();
  const collapsed2 = await page.evaluate(() => {
    const el = document.querySelector('#chips');
    return {
      clamped: el.classList.contains('clamped'),
      oneRow: el.clientHeight <= el.querySelector('.chip').offsetHeight + 2,
    };
  });
  ok('再点一次收起', label2 === '更多' && collapsed2.clamped && collapsed2.oneRow);

  // 7. 收起态下选中项仍可见？选中项若不在第一行，展开过一次再收起后……
  //    设计允许：用户主动收起。此处只验证交互不报错。
  await page.screenshot({ path: OUT + '/_chips_collapsed_zh.png' });

  // 8. 切英文：文案变 More
  await page.locator('.lang-btn[data-lang="en"]').first().click();
  await page.waitForTimeout(300);
  const labelEn = await page.locator('#chipsMoreLabel').textContent();
  ok('英文文案为「More」', labelEn === 'More');
  await page.locator('#chipsMore').click();
  await page.waitForTimeout(200);
  const labelEn2 = await page.locator('#chipsMoreLabel').textContent();
  ok('英文展开文案为「Less」', labelEn2 === 'Less');
  await page.screenshot({ path: OUT + '/_chips_expanded_en.png' });
  await page.locator('.lang-btn[data-lang="zh"]').first().click();

  // 9. 移动端：同样一行折叠
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mob.goto(BASE, { waitUntil: 'domcontentloaded' });
  await mob.waitForFunction(() => document.querySelectorAll('#chips .chip').length > 5, null, { timeout: 15000 });
  const mobRow = await mob.evaluate(() => {
    const el = document.querySelector('#chips');
    return el.clientHeight <= el.querySelector('.chip').offsetHeight + 2 && el.scrollHeight > el.clientHeight + 2;
  });
  ok('移动端也只显示一行', mobRow);
  await mob.locator('#chipsMore').click();
  await mob.waitForTimeout(300);
  const mobExp = await mob.locator('#chipsMore').evaluate(el => el.classList.contains('open'));
  ok('移动端可展开', mobExp);
  await mob.screenshot({ path: OUT + '/_chips_expanded_m.png', fullPage: false });
  await mob.close();

  await browser.close();

  let fail = 0;
  for (const [st, name] of results) {
    if (st === 'FAIL') fail++;
    console.log(st + '  ' + name);
  }
  console.log('----');
  console.log('total chips: ' + totalChips + ', first row visible: ' + rowInfo.visible);
  console.log(fail === 0 ? 'ALL PASS (' + results.length + '/' + results.length + ')' : 'FAILED ' + fail + '/' + results.length);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(2); });

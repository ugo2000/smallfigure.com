/* 线上验收：① 默认排序=最新优先  ② 新分类「手作纹样」6 项  ③ 灯箱双语 */
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'https://smallfigure.com/';

function assert(cond, msg) {
  if (!cond) { console.log('FAIL: ' + msg); process.exitCode = 1; }
  else console.log('PASS: ' + msg);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'networkidle' });

  // ---- 1. 排序下拉默认值 ----
  const sortVal = await page.$eval('#sortBy', el => el.value);
  assert(sortVal === 'newest', '排序下拉默认值为 newest（实际 ' + sortVal + '）');

  const firstOpts = await page.$$eval('#sortBy option', os => os.map(o => ({ v: o.value, t: o.textContent.trim() })));
  console.log('   排序选项:', JSON.stringify(firstOpts));

  // ---- 2. 首屏前几张应是最新加入的手作纹样 ----
  await page.waitForSelector('.card, .card-wrap, [data-id]', { timeout: 15000 }).catch(() => {});
  const headIds = await page.evaluate(() => {
    const cards = document.querySelectorAll('#grid [data-id], #grid .card');
    return Array.from(cards).slice(0, 8).map(c => c.getAttribute('data-id'));
  });
  console.log('   首屏前 8 个 id:', JSON.stringify(headIds));

  const data = await page.evaluate(async () => {
    const r = await fetch('data/images.json', { cache: 'no-store' });
    return await r.json();
  });
  const byId = {};
  data.images.forEach(i => byId[i.id] = i);
  const craftIds = data.images.filter(i => i.category === 'crafts').map(i => i.id);
  assert(craftIds.length === 6, 'crafts 分类共 6 项（实际 ' + craftIds.length + '）');

  // 首屏前 6 个应该全部是 crafts（最新加入）
  const top6 = headIds.slice(0, 6);
  assert(top6.every(id => craftIds.includes(id)),
    '默认排序下首屏前 6 张全是最新加入的手作纹样（实际 ' + JSON.stringify(top6) + '）');

  // added 时间戳单调不增
  const addedSeq = await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('#grid [data-id], #grid .card')).map(c => c.getAttribute('data-id'));
    return ids;
  });
  let mono = true;
  for (let i = 1; i < addedSeq.length; i++) {
    const a = byId[addedSeq[i - 1]] && byId[addedSeq[i - 1]].added;
    const b = byId[addedSeq[i]] && byId[addedSeq[i]].added;
    if (a && b && a < b) { mono = false; break; }
  }
  assert(mono, '整页顺序按 added 时间倒序（无逆序）');

  // ---- 3. 切到其它排序再切回来，重置按钮仍回 newest ----
  await page.selectOption('#sortBy', 'name');
  await page.waitForTimeout(400);
  await page.evaluate(() => document.getElementById('resetBtn').click());
  await page.waitForTimeout(400);
  const afterReset = await page.$eval('#sortBy', el => el.value);
  assert(afterReset === 'newest', '重置按钮后排序回到 newest（实际 ' + afterReset + '）');

  // ---- 4. 分类筛选 chip ----
  const chips = await page.$$eval('#chips .chip, .chip', cs => cs.map(c => c.textContent.trim()));
  assert(chips.some(c => c.indexOf('手作纹样') >= 0), '分类 chip 含「手作纹样」');

  const craftChip = await page.evaluateHandle(() => {
    const cs = Array.from(document.querySelectorAll('.chip'));
    return cs.find(c => c.textContent.indexOf('手作纹样') >= 0) || null;
  });
  if (craftChip) {
    await craftChip.asElement().click();
    await page.waitForTimeout(600);
    const ids = await page.evaluate(() => Array.from(document.querySelectorAll('#grid [data-id], #grid .card')).map(c => c.getAttribute('data-id')));
    assert(ids.length === 6 && ids.every(id => craftIds.includes(id)),
      '点「手作纹样」筛出 6 张且全属该类（实际 ' + ids.length + '）');
  }

  // 缩略图真实加载
  const thumbsOk = await page.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('#grid img'));
    for (const i of imgs) { i.loading = 'eager'; i.scrollIntoView(); await i.decode().catch(() => {}); }
    return imgs.filter(i => i.naturalWidth > 0).length + '/' + imgs.length;
  });
  console.log('   缩略图加载:', thumbsOk);
  assert(thumbsOk.split('/')[0] === thumbsOk.split('/')[1], '该分类全部缩略图加载成功');

  // ---- 5. 灯箱双语 ----
  await page.click('#grid [data-id], #grid .card');
  await page.waitForTimeout(700);
  const lb = await page.evaluate(() => {
    const el = document.querySelector('#lightbox');
    if (!el) return null;
    return {
      text: el.innerText,
      hidden: el.hasAttribute('hidden'),
      name: (document.querySelector('#lbName') || {}).innerText || '',
      cat: (document.querySelector('#lbCat') || {}).innerText || '',
      desc: (document.querySelector('#lbDesc') || {}).innerText || ''
    };
  });
  assert(lb && !lb.hidden, '灯箱已打开（hidden=false）');
  assert(lb && /手作纹样/.test(lb.name + lb.cat + lb.text), '灯箱显示中文名：' + (lb && lb.name));

  // 英文界面（用头部语言按钮）
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.click('header [data-lang="en"], .lang-toggle [data-lang="en"]');
  await page.waitForTimeout(900);
  const enText = await page.evaluate(() => document.body.innerText);
  assert(/Handmade Motifs/.test(enText), '切到英文后显示 Handmade Motifs');
  const enChip = await page.$$eval('.chip', cs => cs.map(c => c.textContent.trim()).join('|'));
  assert(/Handmade Motifs/.test(enChip), '英文 chip 显示 Handmade Motifs');

  // 英文界面下再开一次灯箱，应显示英文名
  await page.click('#grid [data-id], #grid .card');
  await page.waitForTimeout(700);
  const lbEn = await page.evaluate(() => ({
    name: (document.querySelector('#lbName') || {}).innerText || '',
    cat: (document.querySelector('#lbCat') || {}).innerText || '',
    desc: (document.querySelector('#lbDesc') || {}).innerText || ''
  }));
  console.log('   英文灯箱:', lbEn.name, '|', lbEn.cat);
  assert(/Handmade Motif/.test(lbEn.name + lbEn.cat), '英文灯箱显示英文名');
  assert(/tie-dye|batik/i.test(lbEn.desc), '英文灯箱显示英文简介');
  await page.keyboard.press('Escape');

  // ---- 6. hero 数字 ----
  const hero = await page.evaluate(() => document.querySelector('.hero') ? document.querySelector('.hero').innerText : document.body.innerText.slice(0, 400));
  console.log('   hero:', hero.replace(/\s+/g, ' ').slice(0, 160));

  assert(errors.length === 0, '0 个 JS 错误' + (errors.length ? '：' + errors.join(' | ') : ''));

  await browser.close();
  console.log(process.exitCode ? '=== 有 FAIL ===' : '=== 全部 PASS ===');
})();

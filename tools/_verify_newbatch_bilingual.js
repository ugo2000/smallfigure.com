/* 线上新九分类验收（外星货币/古怪符号/飞船/空间武器/飞行靴子/复古盾牌/变身能量块/变形怪兽/古怪望远镜）
   playwright-core，显式 chromium 路径 */
const { chromium } = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const URL = 'https://smallfigure.com/';

const CATS = [
  { key: 'currency',      zh: '外星货币',   en: 'Alien Currency',        n: 3, item: '星纹圆币 · 外星货币' },
  { key: 'symbols',       zh: '古怪符号',   en: 'Odd Symbols',           n: 3, item: '青铜符碑 · 古怪符号' },
  { key: 'ships',         zh: '飞船',       en: 'Spaceships',            n: 3, item: '碟形光束船 · 飞船' },
  { key: 'spaceweapons',  zh: '空间武器',   en: 'Space Weapons',         n: 3, item: '青光能量步枪 · 空间武器' },
  { key: 'flyboots',      zh: '飞行靴子',   en: 'Flying Boots',          n: 3, item: '喷气皮靴 · 飞行靴子' },
  { key: 'shields',       zh: '复古盾牌',   en: 'Retro Shields',         n: 3, item: '铆钉木圆盾 · 复古盾牌' },
  { key: 'energyblocks',  zh: '变身能量块', en: 'Morphing Energy Blocks',n: 3, item: '星核晶块 · 变身能量块' },
  { key: 'morphmonsters', zh: '变形怪兽',   en: 'Morph Monsters',        n: 3, item: '凝胶变形兽 · 变形怪兽' },
  { key: 'telescopes',    zh: '古怪望远镜', en: 'Odd Telescopes',        n: 3, item: 'U 形怀表镜 · 古怪望远镜' },
];

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

  const meta = await page.evaluate(async () => {
    const r = await fetch('data/images.json', { cache: 'no-store' });
    return r.json();
  });
  await page.waitForSelector('#grid .card', { timeout: 20000 });

  // 1. 总数 153，分类 33
  assert(meta.count === 153, '线上 count = 153（实际 ' + meta.count + '）');
  assert(meta.images.length === 153, '线上 images 长度 = 153（实际 ' + meta.images.length + '）');
  assert(meta.categories.length === 33, '线上分类数 = 33（实际 ' + meta.categories.length + '）');

  // 2. 九个新分类在 categories 里，中英标签齐全
  for (const c of CATS) {
    const found = meta.categories.find(x => x.key === c.key);
    assert(!!found, '分类存在: ' + c.key);
    if (found) {
      assert(found.label === c.zh, c.key + ' 中文标签 = ' + c.zh + '（实际 ' + found.label + '）');
      assert(found.labelEn === c.en, c.key + ' 英文标签 = ' + c.en + '（实际 ' + found.labelEn + '）');
    }
  }

  // 3. 每分类数据里 3 项，字段完整
  for (const c of CATS) {
    const items = meta.images.filter(x => x.category === c.key);
    assert(items.length === c.n, c.zh + ' 数据项 = ' + c.n + '（实际 ' + items.length + '）');
    const bad = items.filter(it => !it.name || !it.nameEn || !it.desc || !it.descEn ||
                                    !it.file || !it.thumb || !it.color || !it.tags || !it.tagsEn);
    assert(bad.length === 0, c.zh + ' 字段完整（缺字段 ' + bad.length + '）');
    // zh_tags() 只保留含中文的词 → 中文标签必须每一条都含中文
    const enBad = items.filter(it => it.tags.some(t => !/[一-鿿]/.test(t)));
    assert(enBad.length === 0, c.zh + ' 中文标签纯净（混入英文 ' + enBad.length + '）');
    const zhBad = items.filter(it => it.tagsEn.some(t => /[一-鿿]/.test(t)));
    assert(zhBad.length === 0, c.zh + ' 英文标签纯净（混入中文 ' + zhBad.length + '）');
  }

  // 4. 点 chip 验证前端筛选
  for (const c of CATS) {
    await page.click('#chips .chip[data-cat="' + c.key + '"]');
    await page.waitForTimeout(350);
    const cards = await page.$$eval('#grid .card', els => els.length);
    assert(cards === c.n, 'chip「' + c.zh + '」筛出 ' + c.n + ' 张（实际 ' + cards + '）');
    const titles = await page.$$eval('#grid .card h3', els => els.map(e => e.textContent));
    assert(titles.includes(c.item), '分类内含「' + c.item + '」');
    // 图片真实加载（卡片用 loading="lazy"，需滚动进视口 + decode 后再断言）
    const imgOk = await page.evaluate(async () => {
      const imgs = [...document.querySelectorAll('#grid .card img')];
      for (const i of imgs) { i.loading = 'eager'; i.scrollIntoView(); }
      await new Promise(r => setTimeout(r, 200));
      await Promise.all(imgs.map(i => i.decode().catch(() => {})));
      return imgs.every(i => i.complete && i.naturalWidth > 0);
    });
    assert(imgOk, c.zh + ' 缩略图全部加载成功');
  }

  // 5. 灯箱中英双语检查（取货币第一项）
  await page.click('#chips .chip[data-cat="currency"]');
  await page.waitForTimeout(350);
  await page.evaluate(() => {
    const cards = [...document.querySelectorAll('#grid .card')];
    cards[0].click();
  });
  await page.waitForSelector('#lightbox:not([hidden])', { timeout: 5000 });
  const lbName = await page.$eval('#lbName', el => el.textContent.trim());
  const lbDesc = await page.$eval('#lbDesc', el => el.textContent.trim());
  const lbTags = await page.$$eval('#lbTags span', els => els.map(e => e.textContent));
  assert(lbName.includes('外星货币'), '灯箱中文名含「外星货币」（实际 ' + lbName + '）');
  assert(lbDesc.length > 10 && !/undefined|null|\[object/.test(lbDesc), '灯箱中文简介纯净');
  assert(lbTags.length >= 3 && !lbTags.some(t => /undefined|null/.test(t)), '灯箱中文标签纯净');
  assert(!lbTags.some(t => /[A-Za-z]{3,}/.test(t)), '灯箱中文标签无英文（实际 ' + JSON.stringify(lbTags) + '）');
  await page.click('#lightbox .lang-btn[data-lang="en"]');
  await page.waitForTimeout(200);
  const lbNameEn = await page.$eval('#lbName', el => el.textContent.trim());
  const lbDescEn = await page.$eval('#lbDesc', el => el.textContent.trim());
  const lbTagsEn = await page.$$eval('#lbTags span', els => els.map(e => e.textContent));
  assert(lbNameEn.includes('Alien Currency'), '灯箱英文名含「Alien Currency」（实际 ' + lbNameEn + '）');
  assert(lbDescEn.length > 10 && !/undefined|null|\[object/.test(lbDescEn), '灯箱英文简介纯净');
  assert(lbTagsEn.length >= 3 && !lbTagsEn.some(t => /[一-鿿]/.test(t)), '灯箱英文标签纯净');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 6. 搜索命中（新分类关键词）
  const searches = [['望远镜', 'Telescop'], ['能量块', 'Energy Block'], ['飞船', 'Spaceship']];
  for (const [zh, en] of searches) {
    await page.click('#chips .chip[data-cat="all"]');
    await page.waitForTimeout(150);
    await page.fill('#search', zh);
    await page.waitForTimeout(400);
    const n = await page.$$eval('#grid .card', els => els.length);
    assert(n >= 1, '搜索「' + zh + '」命中 >=1 张（实际 ' + n + '）');
    const t = await page.$$eval('#grid .card h3', els => els.map(e => e.textContent));
    assert(t.some(x => x.includes(zh) || x.includes(en)), '搜索「' + zh + '」结果含中文或英文名');
    await page.fill('#search', '');
    await page.waitForTimeout(250);
  }

  // 7. hero 数字
  const heroCount = await page.$eval('[data-i18n="hero.pill.count"]', el => el.textContent.trim());
  const heroCats = await page.$eval('[data-i18n="hero.pill.cats"]', el => el.textContent.trim());
  assert(heroCount.includes('153'), 'hero 素材数 = 153（实际 ' + heroCount + '）');
  assert(heroCats.includes('33'), 'hero 分类数 = 33（实际 ' + heroCats + '）');

  assert(errors.length === 0, '无页面 JS 错误（' + errors.length + '）' + (errors.length ? JSON.stringify(errors) : ''));
  await browser.close();
  console.log(process.exitCode ? '\n=== 新九分类验收未通过 ===' : '\n=== 新九分类线上验收全部通过 ===');
})().catch(e => { console.log('SCRIPT ERROR: ' + e.message); process.exit(2); });

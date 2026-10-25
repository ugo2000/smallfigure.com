/* 故事解说区 + SEO/GEO 注入 验收脚本（_site 构建产物 + playwright-core）
 * 用法：SF_BASE=http://127.0.0.1:8893 node tools/_test_story.js */
const { chromium } = require('playwright-core');

const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
const BASE = process.env.SF_BASE || 'http://127.0.0.1:8893';
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
  await page.waitForFunction(() => document.querySelectorAll('.card .chip, #chips .chip').length > 5, null, { timeout: 15000 });

  /* ---------- 1. 灯箱故事块（指定有故事的 hero-t，避免最新排序下首卡是无故事新素材） ---------- */
  await page.locator('#chips .chip[data-cat="characters"]').click();
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    const card = document.querySelector('.card[data-id="hero-t"]');
    if (card) card.click();
  });
  await page.waitForSelector('#lightbox:not([hidden])', { timeout: 5000 });
  const lbName = await page.locator('#lbName').textContent();
  const storyVisible = await page.locator('#lbStory').isVisible();
  const labelText = await page.locator('.lb-story-label').textContent();
  const storyText = await page.locator('#lbStoryText').textContent();
  const noBadge = await page.locator('.lb-story-badge').count() === 0;
  const noNote = await page.locator('.lb-story-note').count() === 0;
  const noCatStory = await page.locator('#lbStoryCat').count() === 0;
  ok('灯箱打开：' + lbName, !!lbName);
  ok('故事块可见', storyVisible);
  ok('标签为「故事由来」', labelText.includes('故事由来'));
  ok('灯箱故事块无虚构徽章（声明不逐图重复）', noBadge);
  ok('灯箱故事块无每图 AI 声明（声明不逐图重复）', noNote);
  ok('灯箱不含分类故事段（分类解说只在主页）', noCatStory);
  ok('素材故事正文不含篇末虚构标识', !storyText.includes('本站虚构设定') && storyText.length > 10);
  await page.screenshot({ path: OUT + '/_story_lightbox_zh.png' });
  await page.keyboard.press('Escape');

  /* ---------- 2. 切英文：故事块跟随 ---------- */
  await page.evaluate(() => {
    const card = document.querySelector('.card[data-id="hero-t"]');
    if (card) card.click();
  });
  await page.waitForSelector('#lightbox:not([hidden])', { timeout: 5000 });
  await page.locator('.lightbox .lang-btn[data-lang="en"]').click();
  await page.waitForTimeout(400);
  const labelEn = await page.locator('.lb-story-label').textContent();
  const storyEn = await page.locator('#lbStoryText').textContent();
  ok('英文标签 Backstory', labelEn.includes('Backstory'));
  ok('英文故事不含篇末标识', !storyEn.includes('Fictional lore') && storyEn.length > 10);
  await page.screenshot({ path: OUT + '/_story_lightbox_en.png' });
  await page.keyboard.press('Escape');
  await page.locator('.lang-btn[data-lang="zh"]').first().click();

  /* ---------- 3. 主页分类解说面板 ---------- */
  await page.locator('#chips .chip[data-cat="weapons"]').click();
  await page.waitForTimeout(400);
  const introVisible = await page.locator('#catIntro').isVisible();
  const introLabel = await page.locator('.cat-intro-label').textContent();
  const introText = await page.locator('#catIntroText').textContent();
  ok('选中分类后解说面板出现', introVisible);
  ok('面板标签「分类解说」', introLabel.includes('分类解说'));
  ok('面板有故事内容', introText.length > 10);
  await page.screenshot({ path: OUT + '/_cat_intro_zh.png' });
  /* 回到「全部」应隐藏 */
  await page.locator('#chips .chip[data-cat="all"]').click();
  await page.waitForTimeout(300);
  const introHidden = await page.locator('#catIntro').isHidden();
  ok('切回全部后面板隐藏', introHidden);

  /* ---------- 4. 同分类两张图的故事必须不同（核心诉求：每个图像都要不同） ---------- */
  const pair = await page.evaluate(() => {
    return fetch('data/images.json').then(r => r.json()).then(d => {
      const byCat = {};
      d.images.forEach(im => { (byCat[im.category] = byCat[im.category] || []).push({ id: im.id, name: im.name }); });
      const cat = Object.keys(byCat).find(k => byCat[k].length >= 2);
      return cat ? { cat, a: byCat[cat][0], b: byCat[cat][1] } : null;
    });
  });
  ok('找到同分类两张图用于对比', !!pair);
  if (pair) {
    const texts = [];
    for (const one of [pair.a, pair.b]) {
      await page.locator('#chips .chip[data-cat="all"]').click();
      await page.fill('#search', one.name);
      await page.waitForTimeout(500);
      await page.evaluate((id) => {
        const card = document.querySelector('.card[data-id="' + id + '"]');
        if (card) card.click();
      }, one.id);
      await page.waitForTimeout(400);
      texts.push((await page.locator('#lbStoryText').textContent() || '').trim());
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    ok('同分类两张图灯箱故事都有内容', texts[0].length > 10 && texts[1].length > 10);
    ok('同分类两张图的故事各不相同', texts[0] !== texts[1]);
    /* 清空搜索，避免影响后续断言 */
    await page.fill('#search', '');
    await page.waitForTimeout(400);
  }

  /* ---------- 5. 灯箱 meta 增加「生成方式: AI 生成」 ---------- */
  await page.locator('#chips .chip[data-cat="characters"]').click();
  await page.waitForTimeout(300);
  await page.locator('.card').first().click();
  await page.waitForSelector('#lightbox:not([hidden])', { timeout: 5000 });
  const metaHtml = await page.locator('#lbMeta').innerHTML();
  ok('meta 含生成方式: AI 生成', metaHtml.includes('生成方式') && metaHtml.includes('AI 生成'));
  await page.keyboard.press('Escape');

  /* ---------- 6. 页脚统一声明（全站唯一声明处） ---------- */
  const footerNoteCount = await page.locator('.site-footer .footer-note').count();
  const footerNote = footerNoteCount === 1 ? await page.locator('.site-footer .footer-note').textContent() : '';
  ok('页脚统一声明区块唯一', footerNoteCount === 1);
  ok('统一声明含 AI 生成 / 虚构 / 不逐图重复', footerNote.includes('AI 生成') && footerNote.includes('虚构') && footerNote.includes('不逐图重复'));

  /* ---------- 6b. 故事库全量校验：每张图都不同 / 全覆盖 / 无逐图标识 ---------- */
  const storyStats = await page.evaluate(() => {
    return fetch('data/stories.json').then(r => r.json()).then(s => {
      return fetch('data/images.json').then(r => r.json()).then(d => {
        const zh = Object.values(s.items).map(v => v.zh);
        return {
          total: zh.length,
          dup: zh.length - new Set(zh).size,
          missing: d.images.filter(im => !s.items[im.id]).length,
          marked: Object.values(s.items).filter(v => String(v.zh).includes('本站虚构设定')).length,
        };
      });
    });
  });
  ok('素材故事 303 条全覆盖', storyStats.total === 303 && storyStats.missing === 0);
  ok('素材故事零重复（每张图都不同）', storyStats.dup === 0);
  ok('故事库无逐图虚构标识', storyStats.marked === 0);

  /* ---------- 7. SEO/GEO 注入（构建产物层） ---------- */
  const html = await page.content();
  const ldJson = await page.evaluate(() => {
    const el = document.querySelector('script[type="application/ld+json"]');
    return el ? JSON.parse(el.textContent) : null;
  });
  ok('JSON-LD 存在且可解析', !!ldJson);
  ok('JSON-LD 含 WebSite + CollectionPage', !!ldJson && ldJson['@graph'].some(g => g['@type'] === 'WebSite') && ldJson['@graph'].some(g => g['@type'] === 'CollectionPage'));
  ok('JSON-LD ItemList 303 条', !!ldJson && ldJson['@graph'][1].mainEntity.itemListElement.length === 303);
  ok('canonical 指向主域名', html.includes('rel="canonical" href="https://smallfigure.com/"'));
  ok('hreflang 三语声明', (html.match(/hreflang=/g) || []).length >= 3);
  ok('OG 卡片齐全', ['og:title', 'og:description', 'og:image', 'og:url'].every(k => html.includes(k)));
  ok('Twitter 卡片', html.includes('twitter:card'));
  ok('noscript 全文版存在', html.includes('<noscript>') && html.includes('全文版'));
  ok('title 含关键词', (await page.title()).includes('素材图鉴'));
  ok('hero 静态兜底数字实时化', html.includes('303 件原创小人') && html.includes('303 件素材') && html.includes('58 个分类'));
  /* robots / sitemap 直接 fetch */
  const robots = await page.evaluate(() => fetch('robots.txt').then(r => r.text()));
  const sitemap = await page.evaluate(() => fetch('sitemap.xml').then(r => r.text()));
  ok('robots.txt 放行 AI 爬虫', robots.includes('GPTBot') && robots.includes('Sitemap:'));
  ok('sitemap.xml 含 303 张图', (sitemap.match(/<image:image>/g) || []).length === 303);
  /* og 图可访问（og:image 是生产绝对 URL，本地测试改为取文件名后 fetch 相对路径） */
  const ogOk = await page.evaluate(async () => {
    const m = document.querySelector('meta[property="og:image"]');
    if (!m) return false;
    const file = m.content.split('/').pop();
    const r = await fetch(file);
    return r.ok && r.headers.get('content-type').includes('image');
  });
  ok('og:image 可访问', ogOk);

  /* ---------- 8. 无 JS 报错 ---------- */
  ok('全程无 JS 报错', jsErrors.length === 0);
  if (jsErrors.length) console.log('JS ERRORS:', jsErrors);

  await browser.close();
  let fail = 0;
  for (const [st, name] of results) { if (st === 'FAIL') fail++; console.log(st + '  ' + name); }
  console.log('----');
  console.log(fail === 0 ? 'ALL PASS (' + results.length + '/' + results.length + ')' : 'FAILED ' + fail + '/' + results.length);
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(2); });

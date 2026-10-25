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
  const badgeText = await page.locator('.lb-story-badge').textContent();
  const noteText = await page.locator('.lb-story-note').textContent();
  const storyText = await page.locator('#lbStoryText').textContent();
  const catStoryText = await page.locator('#lbStoryCat').textContent();
  ok('灯箱打开：' + lbName, !!lbName);
  ok('故事块可见', storyVisible);
  ok('标签为「故事由来」', labelText.includes('故事由来'));
  ok('虚构创作徽章在位', badgeText.includes('虚构创作'));
  ok('AI 虚构声明常驻', noteText.includes('AI 辅助') && noteText.includes('虚构'));
  ok('素材故事含篇末（本站虚构设定）', storyText.includes('（本站虚构设定）'));
  ok('分类故事作为铺垫显示', catStoryText.length > 10 && catStoryText.includes('虚构设定'));
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
  const badgeEn = await page.locator('.lb-story-badge').textContent();
  const noteEn = await page.locator('.lb-story-note').textContent();
  const storyEn = await page.locator('#lbStoryText').textContent();
  ok('英文标签 Backstory', labelEn.includes('Backstory'));
  ok('英文徽章 Fiction', badgeEn.includes('Fiction'));
  ok('英文声明在位', noteEn.toLowerCase().includes('fictional'));
  ok('英文故事篇末 (Fictional lore.)', storyEn.includes('(Fictional lore.)'));
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
  ok('面板有故事内容', introText.length > 10 && introText.includes('虚构设定'));
  await page.screenshot({ path: OUT + '/_cat_intro_zh.png' });
  /* 回到「全部」应隐藏 */
  await page.locator('#chips .chip[data-cat="all"]').click();
  await page.waitForTimeout(300);
  const introHidden = await page.locator('#catIntro').isHidden();
  ok('切回全部后面板隐藏', introHidden);

  /* ---------- 4. 无故事素材优雅降级（每页 100 张，无故事素材多在后续页，用搜索框定位） ---------- */
  const noStory = await page.evaluate(() => {
    return fetch('data/stories.json').then(r => r.json()).then(s => {
      return fetch('data/images.json').then(r => r.json()).then(d => {
        const missing = d.images.find(im => !s.items[im.id]);
        return missing ? { id: missing.id, name: missing.name } : null;
      });
    });
  });
  ok('找到无故事素材用于降级测试', !!noStory);
  if (noStory) {
    await page.locator('#chips .chip[data-cat="all"]').click();
    await page.fill('#search', noStory.name);
    await page.waitForTimeout(500);
    await page.evaluate((id) => {
      const card = document.querySelector('.card[data-id="' + id + '"]');
      if (card) card.click();
    }, noStory.id);
    await page.waitForTimeout(400);
    const lbOpen = await page.locator('#lightbox').isVisible();
    /* 54 个分类故事全覆盖，无故事素材仍显示分类故事铺垫；应隐藏的是素材故事段 */
    const storyBoxVisible = await page.locator('#lbStory').isVisible();
    const itemStoryHidden = await page.locator('#lbStoryText').isHidden();
    const catStoryVisible = await page.locator('#lbStoryCat').isVisible();
    const descShown = (await page.locator('#lbDesc').textContent() || '').length > 0;
    ok('无故事素材灯箱正常打开', lbOpen);
    ok('无故事素材故事块仍展示分类故事', storyBoxVisible);
    ok('无故事素材的素材故事段隐藏', itemStoryHidden);
    ok('分类故事段可见且有内容', catStoryVisible && (await page.locator('#lbStoryCat').textContent() || '').length > 10);
    ok('无故事素材仍显示 desc', descShown);
    await page.keyboard.press('Escape');
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

  /* ---------- 6. 页脚 AI 披露 ---------- */
  const footerAi = await page.locator('.site-footer').innerHTML();
  ok('页脚有 AI 生成披露', footerAi.includes('AI 生成') && footerAi.includes('虚构'));

  /* ---------- 7. SEO/GEO 注入（构建产物层） ---------- */
  const html = await page.content();
  const ldJson = await page.evaluate(() => {
    const el = document.querySelector('script[type="application/ld+json"]');
    return el ? JSON.parse(el.textContent) : null;
  });
  ok('JSON-LD 存在且可解析', !!ldJson);
  ok('JSON-LD 含 WebSite + CollectionPage', !!ldJson && ldJson['@graph'].some(g => g['@type'] === 'WebSite') && ldJson['@graph'].some(g => g['@type'] === 'CollectionPage'));
  ok('JSON-LD ItemList 279 条', !!ldJson && ldJson['@graph'][1].mainEntity.itemListElement.length === 279);
  ok('canonical 指向主域名', html.includes('rel="canonical" href="https://smallfigure.com/"'));
  ok('hreflang 三语声明', (html.match(/hreflang=/g) || []).length >= 3);
  ok('OG 卡片齐全', ['og:title', 'og:description', 'og:image', 'og:url'].every(k => html.includes(k)));
  ok('Twitter 卡片', html.includes('twitter:card'));
  ok('noscript 全文版存在', html.includes('<noscript>') && html.includes('全文版'));
  ok('title 含关键词', (await page.title()).includes('素材图鉴'));
  /* robots / sitemap 直接 fetch */
  const robots = await page.evaluate(() => fetch('robots.txt').then(r => r.text()));
  const sitemap = await page.evaluate(() => fetch('sitemap.xml').then(r => r.text()));
  ok('robots.txt 放行 AI 爬虫', robots.includes('GPTBot') && robots.includes('Sitemap:'));
  ok('sitemap.xml 含 279 张图', (sitemap.match(/<image:image>/g) || []).length === 279);
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

/* 素材详情页 / 分类页 验收脚本（_site 构建产物 + playwright-core）
 * 用法：SF_BASE=http://127.0.0.1:8899 node tools/_test_item_pages.js
 *
 * 覆盖：
 *   1. 详情页可访问，canonical 指向自己（不串到首页）
 *   2. 每页有唯一 title / description / OG / JSON-LD
 *   3. 正文含该素材专属故事与规格
 *   4. 面包屑与内链（相关素材、分类页、首页）可跟随
 *   5. 分类聚合页：ItemList 数量正确、素材卡链接指向详情页
 *   6. sitemap 含全部详情页与分类页 URL
 *   7. 主页 noscript 含可跟随链接
 *   8. llms.txt 含逐件详情页链接
 */
const { chromium } = require('playwright-core');

const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
const BASE = process.env.SF_BASE || 'http://127.0.0.1:8899';
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

  /* ---------- 1. 主页卡片有「详情页」链接 ---------- */
  const detailLinks = await page.evaluate(() => document.querySelectorAll('.card .card-detail').length);
  ok('卡片带详情页链接', detailLinks > 0);
  const detailHref = await page.evaluate(() => {
    const a = document.querySelector('.card .card-detail');
    return a ? a.getAttribute('href') : '';
  });
  ok('详情页链接指向 /i/<id>/', /^\/i\/[A-Za-z0-9._-]+\/$/.test(detailHref));

  /* ---------- 2. 抓一份数据用于交叉校验 ---------- */
  const data = await page.evaluate(async () => {
    const [im, st] = await Promise.all([
      fetch('/data/images.json').then(r => r.json()),
      fetch('/data/stories.json').then(r => r.json()),
    ]);
    return {
      nItems: im.images.length,
      nCats: im.categories.length,
      sample: im.images.find(x => (st.items[x.id] || {}).zh) || im.images[0],
      cat: im.categories[0],
      catOfSample: im.categories.find(c => c.key === (im.images.find(x => (st.items[x.id] || {}).zh) || im.images[0]).category),
      story: (st.items[(im.images.find(x => (st.items[x.id] || {}).zh) || im.images[0]).id] || {}).zh,
    };
  });
  const S = data.sample;

  /* ---------- 3. 详情页 ---------- */
  const resp = await page.goto(BASE + '/i/' + S.id + '/', { waitUntil: 'domcontentloaded' });
  ok('详情页可访问（200）', resp && resp.status() === 200);
  const d = await page.evaluate(() => {
    const g = (s) => { const e = document.querySelector(s); return e ? (e.getAttribute('content') || e.getAttribute('href') || e.textContent || '').trim() : ''; };
    let ld = null;
    const s = document.querySelector('script[type="application/ld+json"]');
    if (s) { try { ld = JSON.parse(s.textContent); } catch (e) { ld = null; } }
    /* 页头 logo 也是一个 h1，正文主标题取 main 里的那个 */
    const mainH1 = document.querySelector('main h1');
    return {
      title: document.title,
      desc: g('meta[name="description"]'),
      canonical: g('link[rel="canonical"]'),
      ogTitle: g('meta[property="og:title"]'),
      ogImage: g('meta[property="og:image"]'),
      ogUrl: g('meta[property="og:url"]'),
      robots: g('meta[name="robots"]'),
      h1: mainH1 ? mainH1.textContent.trim() : '',
      story: (document.querySelector('.item-story-text') || {}).textContent || '',
      specs: (document.querySelector('.item-specs') || {}).textContent || '',
      crumbs: (document.querySelector('.crumbs') || {}).textContent || '',
      related: document.querySelectorAll('.related-item').length,
      allLinks: Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href')),
      ld,
    };
  });
  const PROD = 'https://smallfigure.com';
  ok('详情页 title 含素材名', d.title.includes(S.name));
  ok('详情页 title 唯一（含站点名）', d.title.includes('smallfigure'));
  ok('详情页 description 非空且含素材名', !!d.desc && d.desc.includes(S.name));
  ok('详情页 canonical 指向自己', d.canonical === PROD + '/i/' + S.id + '/');
  ok('详情页 og:url 指向自己', d.ogUrl === PROD + '/i/' + S.id + '/');
  ok('详情页 og:image 存在且不带查询参数', !!d.ogImage && !d.ogImage.includes('?'));
  ok('详情页 robots 允许索引', /index/.test(d.robots) && !/noindex/.test(d.robots));
  ok('详情页 H1 为素材名', d.h1 === S.name.trim());
  ok('详情页含专属故事正文', d.story.trim().length > 20);
  ok('详情页含规格参数', d.specs.includes('×'));
  ok('详情页含面包屑', d.crumbs.includes(S.name));
  ok('详情页有相关素材内链', d.related > 0);
  ok('详情页链接回首页', d.allLinks.includes('/'));
  ok('详情页 JSON-LD 可解析', !!d.ld);
  ok('详情页 JSON-LD 含 ImageObject', !!(d.ld && JSON.stringify(d.ld).includes('ImageObject')));
  ok('详情页 JSON-LD 含 BreadcrumbList', !!(d.ld && JSON.stringify(d.ld).includes('BreadcrumbList')));

  /* ---------- 4. 分类聚合页 ---------- */
  const catResp = await page.goto(BASE + '/c/' + data.catOfSample.key + '/', { waitUntil: 'domcontentloaded' });
  ok('分类页可访问（200）', catResp && catResp.status() === 200);
  const c = await page.evaluate(() => {
    let ld = null;
    const s = document.querySelector('script[type="application/ld+json"]');
    if (s) { try { ld = JSON.parse(s.textContent); } catch (e) { ld = null; } }
    const mainH1 = document.querySelector('main h1');
    const canon = document.querySelector('link[rel="canonical"]');
    return {
      title: document.title,
      h1: mainH1 ? mainH1.textContent.trim() : '',
      cards: document.querySelectorAll('.cat-card').length,
      itemHrefs: Array.from(document.querySelectorAll('.cat-card')).map(a => a.getAttribute('href')),
      story: (document.querySelector('.cat-story') || {}).textContent || '',
      canonical: canon ? canon.getAttribute('href') : '',
      ld,
    };
  });
  const PROD2 = 'https://smallfigure.com';
  ok('分类页 title 含分类名', c.title.includes(data.catOfSample.label));
  ok('分类页 H1 为分类名', c.h1 === data.catOfSample.label.trim());
  ok('分类页 canonical 指向自己', c.canonical === PROD2 + '/c/' + data.catOfSample.key + '/');
  ok('分类页有素材卡', c.cards > 0);
  ok('分类页卡片链接指向详情页', c.itemHrefs.length > 0 && c.itemHrefs.every(h => /^\/i\//.test(h)));
  ok('分类页含分类故事', c.story.trim().length > 20);
  ok('分类页 JSON-LD 含 ItemList', !!(c.ld && JSON.stringify(c.ld).includes('ItemList')));

  /* ---------- 5. sitemap ---------- */
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  const sitemap = await page.evaluate(() => fetch('/sitemap.xml').then(r => r.text()));
  ok('sitemap 含全部素材详情页 URL', (sitemap.match(/<loc>https:\/\/smallfigure\.com\/i\//g) || []).length === data.nItems);
  ok('sitemap 含全部分类页 URL', (sitemap.match(/<loc>https:\/\/smallfigure\.com\/c\//g) || []).length === data.nCats);
  ok('sitemap 图片条目数 = 素材数', (sitemap.match(/<image:image>/g) || []).length === data.nItems);
  ok('sitemap 无重复 URL', (() => {
    const urls = (sitemap.match(/<loc>(.*?)<\/loc>/g) || []);
    return new Set(urls).size === urls.length;
  })());

  /* ---------- 6. noscript 与 llms.txt ---------- */
  const noscriptHtml = await page.evaluate(() => {
    const ns = document.querySelector('noscript');
    return ns ? ns.innerHTML : '';
  });
  ok('noscript 含详情页链接', /href="https:\/\/smallfigure\.com\/i\//.test(noscriptHtml));
  ok('noscript 含分类页链接', /href="https:\/\/smallfigure\.com\/c\//.test(noscriptHtml));

  const llms = await page.evaluate(() => fetch('/llms.txt').then(r => r.text()));
  ok('llms.txt 含素材明细段', llms.includes('## 素材明细'));
  ok('llms.txt 含逐件详情页链接', (llms.match(/\]\(https:\/\/smallfigure\.com\/i\//g) || []).length === data.nItems);
  ok('llms.txt 含分类页链接', llms.includes('/c/'));

  /* ---------- 7. 详情页无 JS 报错 ---------- */
  ok('全程无 JS 报错', jsErrors.length === 0);

  /* ---------- 8. Markdown 协商（详情页 / 分类页）----------
   * 注意：本地静态服务没有 Functions 路由，不会返回 Markdown；
   * 该断言只在生产域名（SF_BASE 指向线上）时生效。 */
  if (/^https:\/\/smallfigure\.com/.test(BASE)) {
    const mdItem = await page.evaluate(async (id) => {
      const r = await fetch('/i/' + id + '/', { headers: { Accept: 'text/markdown' } });
      return { status: r.status, ct: r.headers.get('content-type') || '', body: (await r.text()).slice(0, 300) };
    }, S.id);
    ok('详情页 Markdown 协商返回 200', mdItem.status === 200);
    ok('详情页 Markdown Content-Type 正确', mdItem.ct.includes('text/markdown'));
    ok('详情页 Markdown 含标题与故事段', mdItem.body.includes('# ') && mdItem.body.includes('故事由来'));

    const mdCat = await page.evaluate(async () => {
      const r = await fetch('/c/characters/', { headers: { Accept: 'text/markdown' } });
      return { status: r.status, ct: r.headers.get('content-type') || '', body: (await r.text()).slice(0, 300) };
    });
    ok('分类页 Markdown 协商返回 200', mdCat.status === 200);
    ok('分类页 Markdown 含素材列表', mdCat.ct.includes('text/markdown') && mdCat.body.includes('素材列表'));
  }

  /* ---------- 9. 详情页 Link 头（生产环境由 Functions 补 canonical）---------- */
  if (/^https:\/\/smallfigure\.com/.test(BASE)) {
    const linkHdr = await page.evaluate(async () => {
      const r = await fetch('/i/metalfolk-gnome/');
      return r.headers.get('link') || '';
    });
    ok('详情页 Link 头含 canonical', /rel="canonical"/.test(linkHdr));
    ok('详情页 Link 头 canonical 指向自己', linkHdr.includes('/i/metalfolk-gnome/'));
  }

  await browser.close();

  let fail = 0;
  for (const [st, name] of results) {
    if (st === 'FAIL') fail++;
    console.log(st + '  ' + name);
  }
  console.log(fail === 0 ? '---- ALL PASS (' + results.length + '/' + results.length + ') ----' : '---- FAILED ' + fail + '/' + results.length + ' ----');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('SCRIPT ERROR', e); process.exit(1); });

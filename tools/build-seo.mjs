#!/usr/bin/env node
/* smallfigure 构建期 SEO / GEO 注入（tools/build-seo.mjs）
 * 在 sync_site.sh 之后、wrangler pages deploy 之前运行：
 *   1. 重写 index.html 的 <title>/description 静态值（SEO 基线，运行时仍由 i18n 切换）
 *   2. 注入 canonical / hreflang / OG / Twitter / preload
 *   3. 注入 JSON-LD（WebSite + CollectionPage + ItemList 全量 ImageObject）
 *   4. 注入 </body> 前的 noscript 全文版（无 JS 访客与爬虫的可读内容）
 *   5. 生成 _site/sitemap.xml 与 _site/robots.txt
 *   6. og:image 带内容摘要做缓存 bust，并把 og 图复制成对应文件名
 * 规格来源：技术 SEO 架构师（盘古）2026-10-25 交付。
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = path.join(ROOT, '_site');
const BASE = 'https://smallfigure.com';
const OG_SRC = path.join(ROOT, 'og-1200x630.jpg');

const imagesData = JSON.parse(readFileSync(path.join(ROOT, 'data', 'images.json'), 'utf8'));
const storiesData = JSON.parse(readFileSync(path.join(ROOT, 'data', 'stories.json'), 'utf8'));
const images = imagesData.images;
const cats = imagesData.categories;
let html = readFileSync(path.join(SITE, 'index.html'), 'utf8');

const nItems = images.length;
const nCats = cats.length;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const storyOf = (im) => {
  const s = storiesData.items[im.id];
  return s ? s.zh : null;
};

/* ---------- 1. 标题与描述（静态 SEO 基线） ---------- */
const titleZh = `smallfigure · 原创小人素材图鉴｜${nItems} 件透明 PNG 免费下载`;
const descZh = `smallfigure 是原创小人素材图鉴：${nItems} 件透明 PNG 立绘、武器装备、徽章、动物、异星生物等，覆盖 ${nCats} 个分类，每件素材都有自己的故事由来。支持分类与尺寸筛选，注册后免费下载大图。`;
const titleEn = `smallfigure · Original Figure Asset Gallery | ${nItems} Transparent PNGs, Free Download`;
const descEn = `smallfigure is an original figure asset gallery: ${nItems} transparent PNGs across ${nCats} categories — character art, weapons, badges, creatures and more, each with its own backstory. Filter by category and size; free full-size downloads after sign-up.`;

html = html.replace(
  /<title data-i18n="site\.title">[^<]*<\/title>/,
  `<title data-i18n="site.title">${esc(titleZh)}</title>`
);
html = html.replace(
  /(<meta name="description" data-i18n-content="meta\.desc" content=")[^"]*(")/,
  `$1${esc(descZh)}$2`
);
/* hero 静态兜底文本同步实时数字（运行时由 i18n 覆盖，静态值服务爬虫与无 JS 访客） */
html = html.replace(
  /(<p class="hero-sub" data-i18n="hero\.sub">)[^<]*(<\/p>)/,
  `$1${esc(`smallfigure 收集这些故事：${nItems} 件原创小人、小徽章和奇异物件，按分类浏览，大图免费下载`)}$2`
);
html = html.replace(
  /(<span data-i18n="hero\.pill\.count">)[^<]*(<\/span>)/,
  `$1${nItems} 件素材$2`
);
html = html.replace(
  /(<span data-i18n="hero\.pill\.cats">)[^<]*(<\/span>)/,
  `$1${nCats} 个分类$2`
);

/* ---------- 2. meta / OG / hreflang / preload ---------- */
const digest = createHash('sha1')
  .update(readFileSync(path.join(ROOT, 'data', 'images.json')))
  .update(readFileSync(path.join(ROOT, 'data', 'stories.json')))
  .update(html)
  .digest('hex').slice(0, 10);
const ogImage = `${BASE}/og-${digest}.jpg`;

const headTags = [
  '<link rel="canonical" href="' + BASE + '/">',
  '<link rel="alternate" hreflang="zh-CN" href="' + BASE + '/">',
  '<link rel="alternate" hreflang="en" href="' + BASE + '/">',
  '<link rel="alternate" hreflang="x-default" href="' + BASE + '/">',
  '<meta property="og:type" content="website">',
  '<meta property="og:site_name" content="smallfigure">',
  '<meta property="og:title" content="' + esc(titleZh) + '">',
  '<meta property="og:description" content="' + esc(descZh) + '">',
  '<meta property="og:url" content="' + BASE + '/">',
  '<meta property="og:image" content="' + ogImage + '">',
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="630">',
  '<meta property="og:image:alt" content="smallfigure 原创小人素材图鉴宣传图">',
  '<meta property="og:locale" content="zh_CN">',
  '<meta property="og:locale:alternate" content="en_US">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="twitter:title" content="' + esc(titleZh) + '">',
  '<meta name="twitter:description" content="' + esc(descZh) + '">',
  '<meta name="twitter:image" content="' + ogImage + '">',
  '<link rel="preload" as="image" href="assets/img/hero_bg.webp" fetchpriority="high">',
].join('\n');
html = html.replace('</head>', headTags + '\n</head>');

/* ---------- 3. JSON-LD ---------- */
const itemList = images.map((im, i) => {
  const story = storyOf(im);
  const desc = story || im.desc || '';
  const entry = {
    '@type': 'ImageObject',
    '@id': `${BASE}/#asset-${encodeURIComponent(im.id)}`,
    position: i + 1,
    name: im.name,
    description: desc,
    contentUrl: `${BASE}/${im.file}`,
    thumbnailUrl: `${BASE}/${im.thumb}`,
    encodingFormat: im.animated ? 'image/webp' : 'image/png',
    width: im.width,
    height: im.height,
    isAccessibleForFree: true,
    keywords: (im.tags || []).join(', '),
    creator: { '@type': 'Person', name: 'ugo2000' },
    accountablePerson: { '@type': 'Person', name: 'ugo2000' },
  };
  if (im.nameEn) entry.alternateName = im.nameEn;
  if (im.descEn) {
    entry.description = story ? `${desc} / ${im.descEn}` : im.descEn;
  }
  return entry;
});

const jsonld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': BASE + '/#website',
      url: BASE + '/',
      name: 'smallfigure',
      alternateName: 'smallfigure 原创小人素材图鉴',
      description: descZh,
      inLanguage: ['zh-CN', 'en'],
      publisher: { '@type': 'Person', name: 'ugo2000' },
    },
    {
      '@type': 'CollectionPage',
      '@id': BASE + '/#collection',
      url: BASE + '/',
      name: titleZh,
      description: descZh,
      inLanguage: 'zh-CN',
      isPartOf: { '@id': BASE + '/#website' },
      about: { '@type': 'CreativeWork', name: '原创小人素材图鉴' },
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: nItems,
        itemListElement: itemList,
      },
    },
  ],
};
const jsonldTag = '<script type="application/ld+json">\n' + JSON.stringify(jsonld) + '\n</script>';

/* ---------- 4. noscript 全文版（无 JS 访客 / 爬虫可读） ---------- */
const catLabel = (key) => {
  const c = cats.find((x) => x.key === key);
  return c ? c.label : key;
};
const catLabelEn = (key) => {
  const c = cats.find((x) => x.key === key);
  return c && c.labelEn ? c.labelEn : catLabel(key);
};
const catStoryZh = (key) => (storiesData.cats[key] ? storiesData.cats[key].zh : '');

let noscript = '<noscript>\n<h2>smallfigure 原创小人素材图鉴（全文版）</h2>\n<p>' + esc(descZh) +
  '</p>\n<p>本页为无 JavaScript 环境的全文版本；启用 JavaScript 可获得分类筛选、搜索与灯箱大图功能。</p>\n';
cats.forEach((c) => {
  const items = images.filter((im) => im.category === c.key);
  if (!items.length) return;
  noscript += `<h3>${esc(c.label)}（${esc(c.labelEn)}）· ${items.length} 件</h3>\n`;
  const cs = catStoryZh(c.key);
  if (cs) noscript += `<p>${esc(cs)}</p>\n`;
  items.forEach((im) => {
    const story = storyOf(im);
    noscript += `<p><strong>${esc(im.name)}</strong>（${esc(im.nameEn || '')}）：${esc(im.desc || '')}` +
      (story ? ' ' + esc(story) : '') +
      ` 规格：${im.width}×${im.height} px，${im.transparent ? '透明 PNG' : 'PNG'}，${im.animated ? 'WebP 循环动图' : '静图'}。` +
      ` 分类：${esc(catLabel(im.category))} / ${esc(catLabelEn(im.category))}。大图：${BASE}/${im.file}</p>\n`;
  });
});
noscript += '</noscript>';

html = html.replace('</body>', jsonldTag + '\n' + noscript + '\n</body>');

writeFileSync(path.join(SITE, 'index.html'), html);
console.log('[seo] index.html 已注入 meta / JSON-LD(' + nItems + ' 个 ImageObject) / noscript 全文版');

/* ---------- 5. sitemap.xml + robots.txt ---------- */
const lastmod = (imagesData.generated || new Date().toISOString()).slice(0, 10);
let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  `  <url>\n    <loc>${BASE}/</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n`;
images.forEach((im) => {
  sitemap += `    <image:image>\n      <image:loc>${BASE}/${im.file}</image:loc>\n      <image:title>${esc(im.name)}</image:title>\n      <image:caption>${esc(im.desc || '')}</image:caption>\n    </image:image>\n`;
});
sitemap += '  </url>\n</urlset>\n';
writeFileSync(path.join(SITE, 'sitemap.xml'), sitemap);

const robots = [
  '# smallfigure.com robots',
  'User-agent: *',
  'Allow: /',
  'Disallow: /api/',
  'Content-Signal: ai-train=no, search=yes, ai-input=no',
  '',
  '# AI 搜索爬虫：决定内容是否出现在 AI 回答里，放行以提升 GEO 可见性',
  'User-agent: OAI-SearchBot',
  'Allow: /',
  'User-agent: Claude-SearchBot',
  'Allow: /',
  'User-agent: PerplexityBot',
  'Allow: /',
  '',
  '# AI 训练爬虫：拦截不影响出现在 AI 搜索结果，按策略放行',
  'User-agent: GPTBot',
  'Allow: /',
  'User-agent: ClaudeBot',
  'Allow: /',
  'User-agent: Google-Extended',
  'Allow: /',
  'User-agent: Applebot-Extended',
  'Allow: /',
  'User-agent: CCBot',
  'Allow: /',
  'User-agent: Bytespider',
  'Allow: /',
  'User-agent: Amazonbot',
  'Allow: /',
  '',
  '# 用户触发的抓取（部分厂商不应用 robots.txt，按策略放行）',
  'User-agent: ChatGPT-User',
  'Allow: /',
  'User-agent: Claude-User',
  'Allow: /',
  'User-agent: Perplexity-User',
  'Allow: /',
  '',
  '# 传统搜索引擎爬虫',
  'User-agent: Bingbot',
  'Allow: /',
  'User-agent: Baiduspider',
  'Allow: /',
  '',
  `Sitemap: ${BASE}/sitemap.xml`,
  '',
].join('\n');
writeFileSync(path.join(SITE, 'robots.txt'), robots);
console.log('[seo] sitemap.xml（1 个 URL + ' + nItems + ' 张图）与 robots.txt 已生成');

/* ---------- 6. og 图缓存 bust ---------- */
if (existsSync(OG_SRC)) {
  copyFileSync(OG_SRC, path.join(SITE, `og-${digest}.jpg`));
  console.log('[seo] og 图已复制为 og-' + digest + '.jpg');
} else {
  console.warn('[seo] ⚠ 未找到 ' + OG_SRC + '，og:image 将 404（跑 tools/make_og_image.py 生成）');
}
console.log('[seo] 完成。digest=' + digest);

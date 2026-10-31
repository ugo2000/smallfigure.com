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
import { readFileSync, writeFileSync, copyFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ITEM_PATH, CAT_PATH } from './_site_routes.mjs';
import { contentDigest } from './_content_digest.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = path.join(ROOT, '_site');
const BASE = 'https://smallfigure.com';
const OG_SRC = path.join(ROOT, 'og-1200x630.jpg');

const imagesData = JSON.parse(readFileSync(path.join(ROOT, 'data', 'images.json'), 'utf8'));
const storiesData = JSON.parse(readFileSync(path.join(ROOT, 'data', 'stories.json'), 'utf8'));
const images = imagesData.images;
const cats = imagesData.categories;
/* 详情页/分类页清单：由 tools/build_item_pages.mjs 先生成（部署流水线里它跑在 SEO 构建之前） */
const manifestPath = path.join(SITE, 'pages-manifest.json');
const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { items: [], cats: [] };
let html = readFileSync(path.join(SITE, 'index.html'), 'utf8');

/* 幂等保护：_site/index.html 若已被注入过（重跑构建但没先跑 sync_site.sh），
   再次注入会叠加重复的 meta / JSON-LD。先还原成源文件再注入。 */
const SRC_INDEX = path.join(ROOT, 'index.html');
const SITE_INDEX = path.join(SITE, 'index.html');
if (html.includes('application/ld+json') && html !== readFileSync(SRC_INDEX, 'utf8')) {
  console.log('[seo] 检测到 _site/index.html 已注入过 SEO，重置为源文件后重新注入');
  html = readFileSync(SRC_INDEX, 'utf8');
}

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
/* digest：og 图缓存 bust（与 build_item_pages.mjs 共用同一算法，保证分类页 og 图与首页一致） */
const digest = contentDigest(ROOT);
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
  '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
  '<link rel="alternate" type="text/markdown" href="' + BASE + '/" title="Markdown for AI agents">',
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
  '</p>\n<p>本页为无 JavaScript 环境的全文版本；启用 JavaScript 可获得分类筛选、搜索与灯箱大图功能。' +
  '每件素材另有一个可独立收录的详情页，内含完整故事与规格（链接见下）。</p>\n';
cats.forEach((c) => {
  const items = images.filter((im) => im.category === c.key);
  if (!items.length) return;
  noscript += `<h3><a href="${BASE}${CAT_PATH(c.key)}">${esc(c.label)}</a>（${esc(c.labelEn)}）· ${items.length} 件</h3>\n`;
  const cs = catStoryZh(c.key);
  if (cs) noscript += `<p>${esc(cs)}</p>\n`;
  items.forEach((im) => {
    const story = storyOf(im);
    noscript += `<p><strong><a href="${BASE}${ITEM_PATH(im.id)}">${esc(im.name)}</a></strong>（${esc(im.nameEn || '')}）：${esc(im.desc || '')}` +
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
/* sitemap 结构调整：每件素材挂到自己的详情页 /i/<id>/，分类挂到 /c/<key>/，
   首页只留一个 URL（不再把 365 张图全挂在首页下）。
   这样搜索引擎能把每张图收录到各自的落地页，图片搜索也才有对应页面可指。 */
let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  `  <url>\n    <loc>${BASE}/</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
/* 分类页 */
for (const c of manifest.cats || []) {
  sitemap += `  <url>\n    <loc>${c.url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
}
/* 素材详情页：每个 URL 带自己的 image:image（含 title/caption，利于图片搜索） */
for (const im of manifest.items || []) {
  const src = images.find((x) => x.id === im.id);
  if (!src) continue;
  sitemap += `  <url>\n    <loc>${im.url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n` +
    `    <image:image>\n      <image:loc>${BASE}/${src.file}</image:loc>\n      <image:title>${esc(src.name)}</image:title>\n      <image:caption>${esc(src.desc || '')}</image:caption>\n    </image:image>\n` +
    `  </url>\n`;
}
sitemap += '</urlset>\n';
writeFileSync(path.join(SITE, 'sitemap.xml'), sitemap);

/* Content Signals（https://contentsignals.org/）取值说明：
 *   ai-train=no  不用于模型训练/微调
 *   search=yes   允许建索引、出搜索结果与短摘要
 *   ai-input=yes 允许作为 RAG / grounding 输入、允许 AI 搜索答案引用本站内容
 * 注意：官方定义 search **不包含** AI 生成式搜索摘要，所以本站在 ai-input 上取 yes，
 *       与站点 GEO 目标（被 AI 答案引用）一致；训练用途一律 no。 */
const SIG_ALL = 'Content-Signal: ai-train=no, search=yes, ai-input=yes';
const SIG_TRAIN_NO_INPUT = 'Content-Signal: ai-train=no, search=yes, ai-input=no';

/* 每个 User-agent 独立成组、空行分隔（对齐 contentsignals.org 官方示例） */
const groups = [
  ['# 全站默认：允许索引与 AI 引用，拒绝 AI 训练；/api/ 为接口不索引',
    ['User-agent: *', SIG_ALL, 'Allow: /', 'Disallow: /api/']],
  ['# AI 搜索爬虫：用于搜索索引与答案引用，明确拒绝训练用途',
    ['User-agent: OAI-SearchBot', SIG_ALL, 'Allow: /'],
    ['User-agent: Claude-SearchBot', SIG_ALL, 'Allow: /'],
    ['User-agent: PerplexityBot', SIG_ALL, 'Allow: /']],
  ['# Google-Extended：只放行 grounding / 引用，拒绝训练',
    ['User-agent: Google-Extended', SIG_ALL, 'Allow: /']],
  ['# AI 训练爬虫：可抓取但不用于训练，也不喂给模型做 grounding',
    ['User-agent: GPTBot', SIG_TRAIN_NO_INPUT, 'Allow: /'],
    ['User-agent: ClaudeBot', SIG_TRAIN_NO_INPUT, 'Allow: /'],
    ['User-agent: Applebot-Extended', SIG_TRAIN_NO_INPUT, 'Allow: /'],
    ['User-agent: CCBot', SIG_TRAIN_NO_INPUT, 'Allow: /'],
    ['User-agent: Bytespider', SIG_TRAIN_NO_INPUT, 'Allow: /'],
    ['User-agent: Amazonbot', SIG_TRAIN_NO_INPUT, 'Allow: /']],
  ['# 用户触发的抓取（用户提问时实时取内容，属 ai-input）',
    ['User-agent: ChatGPT-User', SIG_ALL, 'Allow: /'],
    ['User-agent: Claude-User', SIG_ALL, 'Allow: /'],
    ['User-agent: Perplexity-User', SIG_ALL, 'Allow: /']],
  ['# 传统搜索引擎爬虫：只建索引与出结果',
    ['User-agent: Bingbot', SIG_TRAIN_NO_INPUT, 'Allow: /'],
    ['User-agent: Baiduspider', SIG_TRAIN_NO_INPUT, 'Allow: /']],
];

const robots = [
  '# smallfigure.com robots',
  '# AI 用途偏好声明（Content Signals, https://contentsignals.org/）',
  '#   ai-train=no  不用于模型训练或微调',
  '#   search=yes   允许建立索引、提供搜索结果与短摘要',
  '#   ai-input=yes 允许作为 RAG / grounding 输入、允许 AI 搜索答案引用本站内容',
  '',
].concat(
  groups.flatMap((block) => {
    const [comment, ...agentGroups] = block;
    return ['', comment].concat(agentGroups.map(g => g.join('\n'))).join('\n');
  }),
  ['', `Sitemap: ${BASE}/sitemap.xml`, '']
).join('\n');
writeFileSync(path.join(SITE, 'robots.txt'), robots);
console.log('[seo] sitemap.xml（1 个 URL + ' + nItems + ' 张图）与 robots.txt 已生成');

/* ---------- 5b. llms.txt（GEO：给 LLM/Agent 的简明纯文本站点索引，https://llmstxt.org/） ---------- */
const catLines = cats.map((c) => {
  const n = images.filter((im) => im.category === c.key).length;
  return `- ${c.label} / ${c.labelEn || ''}：${n} 件（key: ${c.key}）— 分类页 ${BASE}${CAT_PATH(c.key)}`;
}).join('\n');
/* 素材明细：每件一行，含独立详情页 URL，AI 引擎可逐件引用而非只拿到一个大页面 */
const itemLines = images.map((im) => {
  const st = storiesData.items[im.id];
  const brief = (st && st.zh ? st.zh : im.desc || '').replace(/\s+/g, ' ').slice(0, 60);
  return `- [${im.name}](${BASE}${ITEM_PATH(im.id)}) — ${im.width}×${im.height} px，${im.transparent ? '透明 PNG' : 'PNG'}`
    + `${im.animated ? '（WebP 循环动图）' : ''} · ${brief}`;
}).join('\n');
const llms = [
  '# smallfigure · 原创小人素材图鉴',
  '',
  `> ${descZh}`,
  '',
  'smallfigure 是原创 2D 素材图鉴站：全部素材为透明 PNG（部分 WebP 循环动图），每件都有自己的故事由来，注册后可免费下载大图。本站不承诺商用授权。',
  '',
  '## 关键链接',
  `- 首页：${BASE}/`,
  `- 站点地图（含全部图片条目）：${BASE}/sitemap.xml`,
  `- robots.txt：${BASE}/robots.txt`,
  `- Markdown 全文：对 ${BASE}/ 发送带 \`Accept: text/markdown\` 的请求即返回纯 Markdown 全文`,
  '',
  `## 分类（共 ${nCats} 个，合计 ${nItems} 件素材）`,
  catLines,
  '',
  `## 素材明细（共 ${nItems} 件，每件一个独立详情页）`,
  itemLines,
  '',
  '## 授权说明',
  '- 本站不承诺商用授权，转载或使用请保留署名与出处（smallfigure.com）。',
  '',
].join('\n');
writeFileSync(path.join(SITE, 'llms.txt'), llms);
console.log('[seo] llms.txt 已生成（' + nCats + ' 分类 / ' + nItems + ' 素材，含逐件详情页链接）');

/* ---------- 6. og 图缓存 bust ---------- */
/* 清理历史遗留的旧 digest og 图：只保留 og-1200x630.jpg（母版）与当次 digest 那张，
   否则每跑一次构建就多留一个 76KB 的死文件，部署包白白变大 */
if (existsSync(SITE)) {
  for (const f of readdirSync(SITE)) {
    if (/^og-[0-9a-f]{10}\.jpg$/.test(f) && f !== `og-${digest}.jpg`) {
      rmSync(path.join(SITE, f), { force: true });
      console.log('[seo] 清理旧 og 图：' + f);
    }
  }
}
if (existsSync(OG_SRC)) {
  copyFileSync(OG_SRC, path.join(SITE, `og-${digest}.jpg`));
  console.log('[seo] og 图已复制为 og-' + digest + '.jpg');
} else {
  console.warn('[seo] ⚠ 未找到 ' + OG_SRC + '，og:image 将 404（跑 tools/make_og_image.py 生成）');
}
console.log('[seo] 完成。digest=' + digest);

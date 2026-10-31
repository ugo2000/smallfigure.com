#!/usr/bin/env node
/* smallfigure · 素材详情页 + 分类页生成（tools/build_item_pages.mjs）
 *
 * 为什么要有这一层：
 *   主页是 SPA，365 件素材全挤在同一个 URL 上 —— 搜索引擎只能收录 1 个页面，
 *   每张图拿不到自己的落地页，Google Images 更是无从下手。本脚本在构建期
 *   为每件素材生成一个真实静态页 /i/<id>/，为每个分类生成 /c/<key>/，
 *   让每张图都有独立 title / description / canonical / OG / JSON-LD / 正文，
 *   并通过「相关素材」「同分类」把内链织起来。
 *
 * 产出（全部落在 _site 下，部署时随站点一起上传）：
 *   _site/i/<id>/index.html   —— 365 个素材详情页
 *   _site/c/<key>/index.html  —— 68 个分类聚合页
 *
 * 依赖：data/images.json、data/stories.json（故事覆盖 100% 由 build_stories.py 保证）
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ITEM_PATH, CAT_PATH, ITEM_DIR, CAT_DIR } from './_site_routes.mjs';
import { contentDigest } from './_content_digest.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SITE = path.join(ROOT, '_site');
const BASE = 'https://smallfigure.com';

const imagesData = JSON.parse(readFileSync(path.join(ROOT, 'data', 'images.json'), 'utf8'));
const storiesData = JSON.parse(readFileSync(path.join(ROOT, 'data', 'stories.json'), 'utf8'));
const images = imagesData.images || [];
const cats = imagesData.categories || [];
const itemStory = (storiesData.items || {});
const catStory = (storiesData.cats || {});

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const catOf = (key) => cats.find((c) => c.key === key) || { key, label: key, labelEn: '' };
const fmtBytes = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
/* 页面内 <img src> 用根相对路径（详情页在 /i/<id>/ 下，用 / 开头指向站点根）：
   本地预览 / 离线环境都能正常加载，且仍带 ?v= 做缓存 bust。
   JSON-LD / OG 里的 URL 必须是绝对地址（爬虫与社交平台要独立抓取），另用 fileUrlClean。 */
const fileUrl = (im) => (im.ver ? `/${im.file}?v=${im.ver}` : `/${im.file}`);
const thumbUrl = (im) => (im.ver ? `/${im.thumb}?v=${im.ver}` : `/${im.thumb}`);
/* OG / JSON-LD 用的绝对 URL 不带查询参数（社交平台与搜索引擎对 contentUrl 带 ?v= 兼容性差） */
const fileUrlClean = (im) => `${BASE}/${im.file}`;
const thumbUrlClean = (im) => `${BASE}/${im.thumb}`;

/* 页面头部骨架：SEO 三件套（title / description / canonical）+ OG / Twitter / hreflang */
function head({ title, desc, canonical, ogImage, ogImageW, ogImageH, jsonld, extraHead = '' }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="zh-CN" href="${canonical}">
<link rel="alternate" hreflang="en" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<link rel="alternate" type="text/markdown" href="${canonical}" title="Markdown for AI agents">
<meta property="og:type" content="website">
<meta property="og:site_name" content="smallfigure">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="${ogImageW}">
<meta property="og:image:height" content="${ogImageH}">
<meta property="og:image:alt" content="${esc(title)}">
<meta property="og:locale" content="zh_CN">
<meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ogImage}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="stylesheet" href="/item.css">
${extraHead}
${jsonld ? `<script type="application/ld+json">\n${JSON.stringify(jsonld)}\n</script>` : ''}
</head>`;
}

function headerBlock() {
  return `<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/">
      <span class="logo" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="16" cy="16" r="4.5" fill="currentColor"/></svg>
      </span>
      <span class="brand-text">
        <h1>smallfigure</h1>
        <p class="subtitle">万物皆有自己的故事，smallfigure 收集这些故事</p>
      </span>
    </a>
    <a class="back-home" href="/">← 回到图鉴</a>
  </div>
</header>`;
}

function footerBlock() {
  return `<footer class="site-footer">
  <div class="wrap">
    <p class="footer-note">关于虚构与授权的说明：各处「故事由来」均为虚构设定，非事实陈述，素材规格以本页参数区为准；本站不承诺商用授权，转载或使用请保留署名与出处（smallfigure.com）。相关声明统一在此披露，不逐图重复。</p>
    <p class="dim">联系：<a href="mailto:ugo2000@126.com">ugo2000@126.com</a></p>
    <p class="dim">© 2026 smallfigure.com</p>
  </div>
</footer>`;
}

/* ---------- 1. 素材详情页 ---------- */
/* 分类页 og 图：与首页同一张带 digest 的 og 图（首页 og 图文件名由 contentDigest 决定，
   build-seo.mjs 会把 og-1200x630.jpg 复制成 og-<digest>.jpg，两边保持一致） */
function pickOgImage() {
  const digest = contentDigest(ROOT);
  return `${BASE}/og-${digest}.jpg`;
}

function itemPage(im) {
  const c = catOf(im.category);
  const url = BASE + ITEM_PATH(im.id);
  const st = itemStory[im.id] || {};
  const storyZh = st.zh || im.desc || '';
  const storyEn = st.en || im.descEn || '';

  const title = `${im.name} · ${c.label}透明 PNG 免费下载 | smallfigure`;
  const desc = `${im.name}（${im.nameEn || ''}）：${im.desc || ''}${storyZh ? ' ' + storyZh : ''} 规格 ${im.width}×${im.height} px，${im.transparent ? '透明 PNG' : 'PNG'}，${im.animated ? 'WebP 循环动图' : '静图'}。smallfigure 原创素材图鉴，注册后免费下载大图。`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ImageObject',
        '@id': url + '#asset',
        name: im.name,
        alternateName: im.nameEn || undefined,
        description: storyZh || im.desc,
        contentUrl: fileUrlClean(im),
        thumbnailUrl: thumbUrlClean(im),
        encodingFormat: im.animated ? 'image/webp' : 'image/png',
        width: im.width,
        height: im.height,
        isAccessibleForFree: true,
        keywords: (im.tags || []).join(', '),
        creator: { '@type': 'Person', name: 'ugo2000' },
        accountablePerson: { '@type': 'Person', name: 'ugo2000' },
      },
      {
        '@type': 'WebPage',
        '@id': url + '#webpage',
        url,
        name: title,
        description: desc,
        inLanguage: ['zh-CN', 'en'],
        isPartOf: { '@id': BASE + '/#website' },
        primaryImageOfPage: { '@id': url + '#asset' },
        breadcrumb: { '@id': url + '#breadcrumb' },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': url + '#breadcrumb',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: BASE + '/' },
          { '@type': 'ListItem', position: 2, name: c.label, item: BASE + CAT_PATH(c.key) },
          { '@type': 'ListItem', position: 3, name: im.name, item: url },
        ],
      },
    ],
  };

  /* 相关素材：同分类里离得最近的若干件，做内链织网 */
  const siblings = images.filter((x) => x.category === im.category && x.id !== im.id);
  const idx = siblings.findIndex((x) => x.id === im.id);
  const related = (idx >= 0 ? siblings.slice(idx, idx + 8) : siblings.slice(0, 8))
    .concat(siblings.filter((x) => x.id !== im.id))
    .filter((x, i, arr) => arr.findIndex((y) => y.id === x.id) === i)
    .slice(0, 8);

  const relatedHtml = related.length ? `
  <section class="related">
    <p class="related-title">同分类其他素材</p>
    <div class="related-grid">
${related.map((r) => `      <a class="related-item" href="${ITEM_PATH(r.id)}">
        <span class="related-thumb"><img src="${esc(thumbUrl(r))}" alt="${esc(r.name)}" loading="lazy" width="120" height="120"></span>
        <span class="related-name">${esc(r.name)}</span>
      </a>`).join('\n')}
    </div>
  </section>` : '';

  return `${head({
    title, desc, canonical: url,
    ogImage: fileUrlClean(im), ogImageW: im.width, ogImageH: im.height,
    jsonld,
  })}
<body>
${headerBlock()}
<main class="wrap">
  <nav class="crumbs" aria-label="面包屑">
    <a href="/">首页</a><span class="sep">/</span>
    <a href="${CAT_PATH(c.key)}">${esc(c.label)}</a><span class="sep">/</span>
    <span class="cur">${esc(im.name)}</span>
  </nav>

  <div class="item-head">
    <p class="item-cat">${esc(c.label)}${im.transparent ? ' · 透明 PNG' : ''}</p>
    <h1>${esc(im.name)}</h1>
    ${im.nameEn ? `<p class="item-name-en">${esc(im.nameEn)}</p>` : ''}
    ${im.desc ? `<p class="item-desc">${esc(im.desc)}</p>` : ''}
  </div>

  <div class="item-layout">
    <figure class="item-figure${im.transparent ? ' checker' : ''}">
      <img src="${esc(fileUrl(im))}" alt="${esc(im.name)}" width="${im.width}" height="${im.height}" fetchpriority="high">
    </figure>

    <div class="item-info">
      ${storyZh ? `<div class="item-story">
        <p class="item-story-label">故事由来</p>
        <p class="item-story-text">${esc(storyZh)}</p>
        ${storyEn ? `<p class="item-story-en" lang="en">${esc(storyEn)}</p>` : ''}
      </div>` : ''}

      <dl class="item-specs">
        <dt>原始尺寸</dt><dd>${im.srcWidth} × ${im.srcHeight} px</dd>
        <dt>站内尺寸</dt><dd>${im.width} × ${im.height} px</dd>
        <dt>文件体积</dt><dd>${fmtBytes(im.bytes)}</dd>
        <dt>文件格式</dt><dd>${im.animated ? 'WebP 循环动图' : (im.transparent ? '透明 PNG' : 'PNG')}</dd>
        <dt>所属分类</dt><dd><a href="${CAT_PATH(c.key)}">${esc(c.label)} / ${esc(c.labelEn || '')}</a></dd>
      </dl>

      ${(im.tags || []).length ? `<div class="item-tags">${im.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}

      <div class="item-actions">
        <a class="btn primary" href="/">在图鉴中查看并下载</a>
        <a class="btn ghost" href="${CAT_PATH(c.key)}">浏览同类其他素材</a>
      </div>
    </div>
  </div>
${relatedHtml}
</main>
${footerBlock()}
</body>
</html>
`;
}

/* ---------- 2. 分类聚合页 ---------- */
function catPage(c) {
  const url = BASE + CAT_PATH(c.key);
  const items = images.filter((im) => im.category === c.key);
  const cs = catStory[c.key] || {};
  const title = `${c.label} · ${items.length} 件透明 PNG 素材免费下载 | smallfigure`;
  const desc = `${c.label}（${c.labelEn || ''}）分类共 ${items.length} 件透明 PNG 素材：${items.slice(0, 6).map((im) => im.name).join('、')} 等，每件都有自己的故事由来。smallfigure 原创素材图鉴，注册后免费下载大图。`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': url + '#collection',
        url,
        name: title,
        description: desc,
        inLanguage: ['zh-CN', 'en'],
        isPartOf: { '@id': BASE + '/#website' },
        breadcrumb: { '@id': url + '#breadcrumb' },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: items.length,
          itemListElement: items.map((im, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: im.name,
            url: BASE + ITEM_PATH(im.id),
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': url + '#breadcrumb',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首页', item: BASE + '/' },
          { '@type': 'ListItem', position: 2, name: c.label, item: url },
        ],
      },
    ],
  };

  const otherCats = cats.filter((x) => x.key !== c.key);

  return `${head({
    title, desc, canonical: url,
    ogImage: pickOgImage(), ogImageW: 1200, ogImageH: 630,
    jsonld,
  })}
<body>
${headerBlock()}
<main class="wrap">
  <nav class="crumbs" aria-label="面包屑">
    <a href="/">首页</a><span class="sep">/</span><span class="cur">${esc(c.label)}</span>
  </nav>

  <div class="cat-head">
    <h1>${esc(c.label)}</h1>
    <p class="cat-sub">${esc(c.labelEn || '')} · 共 ${items.length} 件素材</p>
    ${cs.zh ? `<div class="cat-story">${esc(cs.zh)}${cs.en ? `<p class="item-story-en" lang="en" style="margin-top:9px">${esc(cs.en)}</p>` : ''}</div>` : ''}
  </div>

  <div class="cat-grid">
${items.map((im) => `    <a class="cat-card" href="${ITEM_PATH(im.id)}">
      <span class="cat-thumb"><img src="${esc(thumbUrl(im))}" alt="${esc(im.name)}" loading="lazy" width="150" height="150"></span>
      <span class="cat-card-meta">
        <span class="n">${esc(im.name)}</span>
        <span class="d">${im.width} × ${im.height} px · ${fmtBytes(im.bytes)}</span>
      </span>
    </a>`).join('\n')}
  </div>

  <section class="cat-all">
    <p class="cat-all-title">全部分类</p>
    <div class="cat-all-list">
${otherCats.map((x) => `      <a href="${CAT_PATH(x.key)}">${esc(x.label)}</a>`).join('\n')}
    </div>
  </section>
</main>
${footerBlock()}
</body>
</html>
`;
}

/* ---------- 输出 ---------- */
const itemDir = path.join(SITE, ITEM_DIR);
const catDir = path.join(SITE, CAT_DIR);
rmSync(itemDir, { recursive: true, force: true });
rmSync(catDir, { recursive: true, force: true });
mkdirSync(itemDir, { recursive: true });
mkdirSync(catDir, { recursive: true });

let nItems = 0;
for (const im of images) {
  const dir = path.join(itemDir, im.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), itemPage(im));
  nItems++;
}
let nCats = 0;
for (const c of cats) {
  const dir = path.join(catDir, c.key);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, 'index.html'), catPage(c));
  nCats++;
}

/* 清单：供 build-seo.mjs 生成 sitemap / llms.txt 时复用 */
const manifest = {
  generated: imagesData.generated || new Date().toISOString(),
  items: images.map((im) => ({
    id: im.id,
    name: im.name,
    nameEn: im.nameEn || '',
    category: im.category,
    file: im.file,
    thumb: im.thumb,
    width: im.width,
    height: im.height,
    url: BASE + ITEM_PATH(im.id),
  })),
  cats: cats.map((c) => ({
    key: c.key,
    label: c.label,
    labelEn: c.labelEn || '',
    count: images.filter((im) => im.category === c.key).length,
    url: BASE + CAT_PATH(c.key),
  })),
};
writeFileSync(path.join(SITE, 'pages-manifest.json'), JSON.stringify(manifest, null, 1));

console.log(`[pages] 详情页 ${nItems} 个（/${ITEM_DIR}/<id>/）、分类页 ${nCats} 个（/${CAT_DIR}/<key>/）已生成`);

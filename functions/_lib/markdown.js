/**
 * 素材详情页 / 分类页 —— Markdown 内容协商（functions/i/[[id]].js 与 functions/c/[[key]].js）
 *
 * 静态详情页（/i/<id>/、/c/<key>/）由构建期生成，正常访问返回 HTML。
 * 当请求带 `Accept: text/markdown` 时，这里返回该素材（或该分类）的纯 Markdown，
 * 方便 AI Agent 直接取单件素材的规格与故事，不必解析 HTML 布局。
 *
 * 注意：这两个路由只处理 Markdown 协商；其他请求一律 env.ASSETS.fetch 透传静态文件。
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const accept = (request.headers.get('accept') || '').toLowerCase();

  if (accept.includes('text/markdown')) {
    try {
      const md = await buildMarkdown(env, request, url.pathname);
      if (md) {
        const tokens = Math.max(1, Math.ceil(md.length / 4));
        return new Response(md, {
          status: 200,
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=14400, must-revalidate',
            'x-markdown-tokens': String(tokens),
          },
        });
      }
    } catch (err) {
      // 生成失败时退化到 HTML，不中断站点
    }
  }

  const res = await env.ASSETS.fetch(request);
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.indexOf('text/html') !== -1) {
    const origin = new URL(request.url).origin;
    const headers = new Headers(res.headers);
    const path = url.pathname.replace(/\/+$/, '');
    const canonical = path ? origin + path + '/' : origin + '/';
    headers.set('Link', `<${canonical}>; rel="canonical", <${origin}/llms.txt>; rel="describedby"`);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }
  return res;
}

async function loadData(env, request) {
  const base = new URL(request.url).origin;
  if (!env || !env.ASSETS) throw new Error('no ASSETS binding');
  const [imgRes, storyRes] = await Promise.all([
    env.ASSETS.fetch(new Request(base + '/data/images.json')),
    env.ASSETS.fetch(new Request(base + '/data/stories.json')),
  ]);
  if (!imgRes.ok) throw new Error('images.json not found (' + imgRes.status + ')');
  const imagesData = await imgRes.json();
  let storiesData = { items: {}, cats: {} };
  if (storyRes.ok) {
    try { storiesData = await storyRes.json(); } catch (_) { /* 故事缺失不影响正文 */ }
  }
  return { base, images: imagesData.images || [], cats: imagesData.categories || [], storiesData };
}

const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|');
const fmtBytes = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');

/* pathname 形如 /i/<id>/ 或 /c/<key>/ */
export async function buildMarkdown(env, request, pathname) {
  const m = pathname.match(/^\/(i|c)\/([^/]+)\/?$/);
  if (!m) return null;
  const kind = m[1];
  const key = decodeURIComponent(m[2]);
  const { base, images, cats, storiesData } = await loadData(env, request);
  const itemStory = (storiesData.items || {});
  const catStory = (storiesData.cats || {});
  const L = [];

  if (kind === 'i') {
    const im = images.find((x) => x.id === key);
    if (!im) return null;
    const c = cats.find((x) => x.key === im.category) || { label: im.categoryLabel, labelEn: im.categoryLabelEn };
    const st = itemStory[im.id] || {};
    const spec = `${im.width}×${im.height} px（原始 ${im.srcWidth}×${im.srcHeight}），${im.transparent ? '透明 PNG' : 'PNG'}，${im.animated ? 'WebP 循环动图' : '静图'}，${fmtBytes(im.bytes)}`;
    L.push(`# ${im.name}${im.nameEn ? ` (${im.nameEn})` : ''}`);
    L.push('');
    L.push(`- 分类：${c.label} / ${c.labelEn || ''}`);
    L.push(`- 规格：${spec}`);
    L.push(`- 标签：${(im.tags || []).join('、')}`);
    L.push(`- 详情页：${base}/i/${im.id}/`);
    L.push(`- 大图：${base}/${im.file}`);
    if (im.desc) { L.push(''); L.push(esc(im.desc)); }
    if (st.zh) { L.push(''); L.push('## 故事由来'); L.push(''); L.push(esc(st.zh)); }
    if (st.en) { L.push(''); L.push(esc(st.en)); }
    L.push('');
    L.push('> 本站不承诺商用授权，转载或使用请保留署名与出处（smallfigure.com）。');
    return L.join('\n');
  }

  const c = cats.find((x) => x.key === key);
  if (!c) return null;
  const items = images.filter((im) => im.category === c.key);
  const cs = catStory[c.key] || {};
  L.push(`# ${c.label}${c.labelEn ? ` (${c.labelEn})` : ''}`);
  L.push('');
  L.push(`- 分类页：${base}/c/${c.key}/`);
  L.push(`- 素材数量：${items.length}`);
  L.push('');
  if (cs.zh) { L.push(esc(cs.zh)); L.push(''); }
  L.push('## 素材列表');
  L.push('');
  for (const im of items) {
    const st = itemStory[im.id] || {};
    const spec = `${im.width}×${im.height} px，${im.transparent ? '透明 PNG' : 'PNG'}`;
    const brief = (st.zh || im.desc || '').replace(/\s+/g, ' ').slice(0, 50);
    L.push(`- [${esc(im.name)}](${base}/i/${im.id}/) — ${esc(spec)} · ${esc(brief)}`);
  }
  L.push('');
    L.push('> 本站不承诺商用授权，转载或使用请保留署名与出处（smallfigure.com）。');
  return L.join('\n');
}

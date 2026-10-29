/**
 * Markdown for Agents —— 内容协商（functions/index.js）
 *
 * 站点首页 `/` 默认返回 HTML（SPA）；当请求的 Accept 头含 `text/markdown` 时，
 * 直接返回一份「干净、去格式」的 Markdown 全文（由 data/images.json + data/stories.json
 * 现生成），方便 AI Agent 读取，而不必去扒复杂的 SPA HTML 布局。
 *
 * 参考：https://llmstxt.org/ 与 Cloudflare Markdown for Agents
 * 校验：isitagentready.com —— checks.contentAccessibility.markdownNegotiation.status == "pass"
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const accept = (request.headers.get('accept') || '').toLowerCase();
  const wantsMarkdown = accept.includes('text/markdown');

  // 仅对站点根路径做 Markdown 协商；其余（资源、API、robots.txt 等）一律透传静态资源
  if (wantsMarkdown && url.pathname === '/') {
    try {
      const md = await buildMarkdown(env, request);
      const tokens = Math.max(1, Math.ceil(md.length / 4)); // 粗略 token 估算（中文约 4 字符/token）
      return new Response(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': 'public, max-age=14400, must-revalidate',
          'x-markdown-tokens': String(tokens),
        },
      });
    } catch (err) {
      // 生成失败时退化到 HTML，不中断站点
    }
  }

  // 默认：透传静态资源（浏览器拿到的仍是 index.html）
  const res = await env.ASSETS.fetch(request);
  // HTML 响应补 Link 头（GEO：canonical + llms.txt describedby，供 Agent/爬虫发现）
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.indexOf('text/html') !== -1) {
    const origin = new URL(request.url).origin;
    const headers = new Headers(res.headers);
    headers.set('Link', '<' + origin + '/>; rel="canonical", <' + origin + '/llms.txt>; rel="describedby"');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  }
  return res;
}

async function buildMarkdown(env, request) {
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

  const images = imagesData.images || [];
  const cats = imagesData.categories || [];
  const nItems = images.length;
  const nCats = cats.length;
  const itemStory = (storiesData.items && storiesData.items) || {};
  const catStory = (storiesData.cats && storiesData.cats) || {};
  const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|');

  const L = [];
  L.push('# smallfigure · 原创小人素材图鉴');
  L.push('');
  L.push(`smallfigure 是原创小人素材图鉴：${nItems} 件透明 PNG 立绘、武器装备、徽章、动物、异星生物等，覆盖 ${nCats} 个分类，每件素材都有自己的故事由来。支持分类与尺寸筛选，注册后免费下载大图。`);
  L.push('');
  L.push(`- 站点：${base}/`);
  L.push(`- 素材总数：${nItems}`);
  L.push(`- 分类总数：${nCats}`);
  L.push(`- 授权：每件素材页脚标注「生成方式: AI 生成」；本站不承诺商用授权`);
  L.push('');

  for (const c of cats) {
    L.push(`## ${esc(c.label)}（${esc(c.labelEn || '')}）`);
    const cs = catStory[c.key] && catStory[c.key].zh ? catStory[c.key].zh : '';
    if (cs) { L.push(''); L.push(esc(cs)); }
    const items = images.filter((im) => im.category === c.key);
    if (items.length) {
      L.push('');
      L.push(`共 ${items.length} 件：`);
      for (const im of items) {
        const st = itemStory[im.id] ? itemStory[im.id].zh : null;
        const desc = st || im.desc || '';
        const spec = `${im.width}×${im.height} px，${im.transparent ? '透明 PNG' : 'PNG'}，${im.animated ? 'WebP 循环动图' : '静图'}`;
        const nameEn = im.nameEn ? ` (${esc(im.nameEn)})` : '';
        L.push(`- **${esc(im.name)}**${nameEn}：[大图](${base}/${esc(im.file)}) — ${esc(desc)} 规格：${esc(spec)}。`);
      }
    }
    L.push('');
  }

  L.push('---');
  L.push('');
  L.push(`> 本页 Markdown 由 smallfigure 为 AI Agent 生成，对应站点全文版；实时数据见 ${base}/sitemap.xml。`);
  return L.join('\n');
}

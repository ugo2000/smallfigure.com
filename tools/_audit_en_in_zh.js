/* 审计：中文模式下的英文残留（收紧判据：只抓真正的英文句子/标签，排除尺寸单位、技术词、站名） */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'https://www.smallfigure.com';

/* 允许保留的技术性/专有名词（中文界面下这些是正常或可接受的） */
const ALLOW = [
  'PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG', 'MP3', 'MB', 'KB', 'GB', 'B',
  'CSS', 'HTML', 'JS', 'AI', 'ID', 'URL', 'API', 'JSON', 'HTTP',
  'smallfigure', 'ugo2000', 'com', '©', 'px'
];
/* 这些是 HTML 属性值（option 的 value 等），不是显示文本，不算残留 */
const SKIP_ATTRS = ['value', 'data-i18n-content'];

(async () => {
  const isHttps = BASE.indexOf('https') === 0;
  const browser = await pw.chromium.launch({
    executablePath: EXE,
    args: ['--mute-audio'].concat(isHttps ? ['--proxy-server=http://127.0.0.1:7897'] : [])
  });
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'zh-CN' });
  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1500);
  await pg.click('.site-header .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(800);

  /* 真正的英文残留判据：出现 ≥2 个连续英文单词（每词 ≥2 字母），
     且这些词不在允许白名单里。尺寸「1024 × 1024」只算数字，MB/KB 单词在白名单。 */
  const detector = `(function(s){
    if(!s) return false;
    const allow = ${JSON.stringify(ALLOW)};
    const words = s.match(/[A-Za-z][A-Za-z'&-]{1,}/g);
    if(!words) return false;
    const bad = words.filter(w => !allow.some(a => a.toLowerCase() === w.toLowerCase()));
    return bad.length >= 1;
  })`;

  async function audit(label) {
    const found = await pg.evaluate((src) => {
      const det = eval(src);
      const out = [];
      const attrs = ['placeholder', 'title', 'aria-label', 'alt'];
      const skipTags = ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA'];
      document.querySelectorAll('body *').forEach(el => {
        if (skipTags.includes(el.tagName)) return;
        if (el.closest('[hidden]')) return;
        if (el.closest('.lang-toggle')) return;
        const own = Array.from(el.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').trim();
        if (own && det(own)) out.push({ where: el.tagName + (el.id ? '#' + el.id : '.' + (typeof el.className === 'string' ? el.className.split(' ')[0] : '')), text: own });
        attrs.forEach(a => {
          const v = el.getAttribute && el.getAttribute(a);
          if (v && det(v)) out.push({ where: el.tagName + '[' + a + ']', text: v });
        });
      });
      const meta = document.querySelector('meta[name="description"]');
      if (meta && det(meta.getAttribute('content') || '')) out.push({ where: 'meta[description]', text: meta.getAttribute('content') });
      if (det(document.title)) out.push({ where: 'title', text: document.title });
      return out;
    }, detector);
    console.log('=== ' + label + '：英文残留 ' + found.length + ' 处 ===');
    found.forEach(f => console.log('  [' + f.where + '] ' + f.text.slice(0, 120)));
    return found.length;
  }

  const n1 = await audit('网格页 ZH');

  /* 逐个分类 chip 点一遍，累计检查（卡片名 / 分类行 / 标签） */
  const chips = await pg.$$eval('.chip', els => els.map(e => e.dataset.cat));
  const catCount = {};
  for (const cat of chips) {
    await pg.click('.chip[data-cat="' + cat + '"]');
    await pg.waitForTimeout(500);
    const bad = await pg.evaluate((src) => {
      const det = eval(src);
      const out = [];
      document.querySelectorAll('.card-meta h3, .card-meta .cat, .card .badge').forEach(el => {
        const t = el.textContent.trim();
        if (det(t)) out.push(t);
      });
      return out;
    }, detector);
    catCount[cat] = bad;
    if (bad.length) { console.log('  分类 ' + cat + ' 有 ' + bad.length + ' 处残留:'); bad.forEach(b => console.log('    - ' + b)); }
  }

  /* 灯箱 */
  await pg.click('.chip[data-cat="all"]');
  await pg.waitForTimeout(300);
  await pg.click('.card');
  await pg.waitForTimeout(700);
  const n2 = await audit('灯箱 ZH');
  await pg.keyboard.press('Escape');

  /* 各分类灯箱逐一检查 */
  const lbBad = {};
  for (const cat of chips) {
    await pg.click('.chip[data-cat="' + cat + '"]');
    await pg.waitForTimeout(400);
    if (!(await pg.$('.card'))) continue;
    await pg.click('.card');
    await pg.waitForTimeout(600);
    const bad = await pg.evaluate((src) => {
      const det = eval(src);
      const out = [];
      ['#lbCat', '#lbName', '#lbDesc'].forEach(s => {
        const el = document.querySelector(s);
        if (el && det(el.textContent.trim())) out.push(s + ' = ' + el.textContent.trim());
      });
      document.querySelectorAll('#lbTags span').forEach(el => {
        if (det(el.textContent.trim())) out.push('#lbTags = ' + el.textContent.trim());
      });
      return out;
    }, detector);
    if (bad.length) { lbBad[cat] = bad; console.log('  灯箱[' + cat + '] 残留:'); bad.forEach(b => console.log('    - ' + b.slice(0, 120))); }
    await pg.keyboard.press('Escape');
    await pg.waitForTimeout(300);
  }

  console.log('\n网格页残留: ' + n1 + ' | 灯箱页残留: ' + n2 + ' | 分类卡片问题: ' + Object.keys(catCount).filter(k => catCount[k].length).length + ' | 灯箱分类问题: ' + Object.keys(lbBad).length);
  await browser.close();
  process.exit((n1 + n2) || Object.keys(lbBad).length ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });
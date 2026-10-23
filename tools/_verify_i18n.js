/* i18n 全链路验证：默认语言 / 切换 / 持久化 / 灯箱 / 搜索 / 无遗漏 key */
const pw = require('playwright-core');
const EXE = 'C:/Users/Administrator/AppData/Local/ms-playwright/chromium-1234/chrome-win64/chrome.exe';
const BASE = process.env.SF_URL || 'http://127.0.0.1:8788';

(async () => {
  const browser = await pw.chromium.launch({ executablePath: EXE, args: ['--mute-audio'] });

  let pass = 0, fail = 0;
  const check = (name, ok, extra) => {
    console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (extra ? ' | ' + extra : ''));
    ok ? pass++ : fail++;
  };
  const T = (pg, sel, prop) => pg.evaluate(([s, p]) => {
    const el = document.querySelector(s);
    return el ? el[p] : null;
  }, [sel, prop || 'textContent']);
  const BGM_TITLES = {
    en: ['Music playing, click to turn off', 'Music off, click to turn on', 'Autoplay blocked by browser, click to play'],
    zh: ['背景音乐播放中，点击关闭', '背景音乐已关闭，点击开启', '浏览器拦了自动播放，点一下即响']
  };

  // ---------- A. 英文环境、无存储 → 默认英文 ----------
  const pg = await browser.newPage({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
  const errors = [];
  pg.on('pageerror', e => errors.push('pageerror: ' + e.message));
  pg.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await pg.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
  await pg.waitForTimeout(1200);
  check('A1 默认英文标题', (await T(pg, 'title')) === 'smallfigure · Little Figure Gallery', await T(pg, 'title'));
  check('A2 html lang=en', (await T(pg, 'html', 'lang')) === 'en', await T(pg, 'html', 'lang'));
  check('A3 副标题英文', (await T(pg, '.subtitle')) === 'Everyone has a story, just like every little figure in smallfigure', await T(pg, '.subtitle'));
  check('A4 搜索占位符英文', (await T(pg, '#search', 'placeholder')).indexOf('Search figures') === 0, await T(pg, '#search', 'placeholder'));
  check('A5 筛选标签英文', (await T(pg, '.sel span')) === 'Size', await T(pg, '.sel span'));
  check('A6 全部尺寸英文', (await T(pg, '#sizeFilter option')) === 'All sizes', await T(pg, '#sizeFilter option'));
  const a7 = await T(pg, '.site-footer .dim:last-child');
  check('A7 页脚英文已去掉托管声明', a7.indexOf('Hosted on Cloudflare Pages') === -1 && a7.indexOf('© 2026 smallfigure.com') > -1, a7);
  check('A8 音乐按钮英文 title', BGM_TITLES.en.indexOf(await T(pg, '#bgmBtn', 'title')) > -1, await T(pg, '#bgmBtn', 'title'));

  // ---------- B. 切到中文 ----------
  await pg.click('.lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(600);
  check('B1 中文标题', (await T(pg, 'title')) === 'smallfigure · 原创小人图鉴', await T(pg, 'title'));
  check('B2 html lang=zh-CN', (await T(pg, 'html', 'lang')) === 'zh-CN', await T(pg, 'html', 'lang'));
  check('B3 副标题中文', (await T(pg, '.subtitle')) === '每个人都有自己的故事，就像 smallfigure 里的每个小人', await T(pg, '.subtitle'));
  check('B4 搜索占位符中文', (await T(pg, '#search', 'placeholder')).indexOf('搜小人') === 0, await T(pg, '#search', 'placeholder'));
  check('B5 尺寸标签中文', (await T(pg, '.sel span')) === '尺寸', await T(pg, '.sel span'));
  check('B6 音乐按钮中文 title', BGM_TITLES.zh.indexOf(await T(pg, '#bgmBtn', 'title')) > -1, await T(pg, '#bgmBtn', 'title'));

  // ---------- C. 动态渲染跟随语言 ----------
  check('C1 chips 全部中文', (await T(pg, '.chip')) === '全部8', await T(pg, '.chip'));
  check('C2 分类 chip 中文', (await T(pg, '.chip:nth-child(2)')).indexOf('人物立绘') === 0, await T(pg, '.chip:nth-child(2)'));
  check('C3 计数行中文', (await T(pg, '#countLine')).indexOf('共') === 0, await T(pg, '#countLine'));
  check('C4 卡片名中文', (await T(pg, '.card-meta h3')) === '老张 · 立绘', await T(pg, '.card-meta h3'));
  check('C5 卡片分类中文', (await T(pg, '.card-meta .cat')) === '人物立绘', await T(pg, '.card-meta .cat'));
  check('C6 透明徽章中文', (await T(pg, '.badge')) === '透明 PNG', await T(pg, '.badge'));

  // ---------- D. 英文搜索（haystack 含英文名） ----------
  await pg.click('.lang-btn[data-lang="en"]');
  await pg.waitForTimeout(500);
  await pg.fill('#search', 'engineer');
  await pg.waitForTimeout(400);
  const enCards = await pg.$$('.card-meta h3');
  check('D1 英文搜索 engineer 命中 1 张', enCards.length === 1, 'cards=' + enCards.length);
  check('D2 英文卡片名', (await T(pg, '.card-meta h3')) === 'Lady Engineer · Character Art', await T(pg, '.card-meta h3'));
  await pg.fill('#search', '');
  await pg.waitForTimeout(300);

  // ---------- E. 灯箱双语 ----------
  await pg.click('.card');
  await pg.waitForTimeout(600);
  check('E1 灯箱英文名', (await T(pg, '#lbName')) === 'Laozhang · Character Art', await T(pg, '#lbName'));
  check('E2 灯箱英文分类行', (await T(pg, '#lbCat')) === 'Character Art · Transparent PNG', await T(pg, '#lbCat'));
  check('E3 灯箱英文下载钮', (await T(pg, '#lbDownload')) === 'Download full image', await T(pg, '#lbDownload'));
  check('E4 灯箱英文 meta 标签', (await T(pg, '#lbMeta dt')) === 'Original size', await T(pg, '#lbMeta dt'));
  check('E5 灯箱英文简介', (await T(pg, '#lbDesc')).indexOf('The mascot of this site') === 0, await T(pg, '#lbDesc'));
  await pg.click('.lb-actions .lang-btn[data-lang="zh"]');
  await pg.waitForTimeout(500);
  check('E6 灯箱内切中文名', (await T(pg, '#lbName')) === '老张 · 立绘', await T(pg, '#lbName'));
  check('E7 灯箱内切中文 meta', (await T(pg, '#lbMeta dt')) === '原始尺寸', await T(pg, '#lbMeta dt'));
  check('E8 灯箱内切换后顶栏同步', (await pg.getAttribute('.site-header .lang-btn[data-lang="zh"]', 'class')).indexOf('active') > -1);
  await pg.keyboard.press('Escape');
  await pg.waitForTimeout(300);

  // ---------- F. 持久化 + 刷新保持 ----------
  const stored = await pg.evaluate(() => localStorage.getItem('sf_lang'));
  check('F1 localStorage 记住 zh', stored === 'zh', 'stored=' + stored);
  await pg.reload({ waitUntil: 'networkidle' });
  await pg.waitForTimeout(1000);
  check('F2 刷新后仍是中文', (await T(pg, 'title')) === 'smallfigure · 原创小人图鉴', await T(pg, 'title'));
  check('F3 刷新后切换按钮状态', (await pg.getAttribute('.lang-btn[data-lang="zh"]', 'class')).indexOf('active') > -1);

  // ---------- G. 无遗漏 key / 无模板残留 ----------
  const leftovers = await pg.evaluate(() => {
    const bad = [];
    document.querySelectorAll('body *').forEach(el => {
      const txt = (el.textContent || '').trim();
      if (/^(site|meta|hero|search|toolbar|filter|size|sort|chips|count|empty|footer|lb|bgm|badge|dl|type|cat|error|lang)\.(title|desc|subtitle|placeholder|cats|size|sort|all|s|m|l|xl|default|size-desc|bytes-desc|name|line|searching|reset|contact|hosted|close|download|pause|play|prev|next|on|off|waiting|anim|transparent|badge|srcSize|siteSize|bytes|type|downloads|times|sheet|load|label)$/.test(txt)) bad.push(el.tagName + ':' + txt);
      if (txt.indexOf('{total}') > -1 || txt.indexOf('{n}') > -1) bad.push('tpl:' + txt);
    });
    return bad;
  });
  check('G1 无未解析字典 key / 模板残留', leftovers.length === 0, leftovers.slice(0, 3).join(' | '));

  console.log('JS 错误:', errors.length ? errors.join(' | ') : '无');
  console.log(`\n结果: ${pass} PASS / ${fail} FAIL`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('RUN FAIL:', e.message); process.exit(1); });

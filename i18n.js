/* smallfigure · 中英文切换（须在 app.js 之前加载） */
(function () {
  'use strict';

  var LANGS = ['zh', 'en'];
  var STORE_KEY = 'sf_lang';

  /* ---------- 字典 ---------- */
  var DICT = {
    zh: {
      'site.title': 'smallfigure · 原创小人素材图鉴｜透明 PNG 素材免费下载',
      'meta.desc': 'smallfigure 原创小人素材图鉴：透明 PNG 立绘、武器装备、徽章、动物、异星生物等原创素材，每件都有自己的故事由来。支持分类与尺寸筛选，注册后免费下载大图。',
      'hero.subtitle': '万物皆有自己的故事，smallfigure 收集这些故事',
      'hero.kicker': '原创素材图鉴',
      'hero.title': '万物皆有自己的故事',
      'hero.sub': 'smallfigure 收集这些故事：327 件原创小人、小徽章和奇异物件，按分类浏览，大图免费下载',
      'hero.pill.count': '327 件素材',
      'hero.pill.cats': '62 个分类',
      'hero.pill.free': '大图免费下载',
      'hero.cta': '开始浏览',
      'hero.bg.alt': '老张、果克星人和站内原创小人们漂浮在夜空中的宣传画',
      'search.placeholder': '搜素材 / 标签：角色、武器、弹药、动物、食物、载具、异星生物、异星植物、石器、液体、法典、法器、城堡、家具、科技、猎食、星球、透明、徽章、动图、乐器、稻草人、尖牙、石头、货币、符号、飞船、空间武器、飞行靴、盾牌、能量块、变形兽、望远镜、刺绣、瓷器、编绳、木刻、玻璃、骑兽、武士、道士、萨满、枪械、喇叭铳、灯笼铳、外卖、咖啡师、健身、白领、滑板、司机、仙童、奇食瓶罐、长毛皮鞋、古怪虫豸、怪诞星座、无厘头、复古、古今混搭、异形兵刃、怪异巨人、怪异骷髅、怪兽玩具、古怪走兽、深海怪鱼、怪鸟、钥匙、挂锁、门环、扳手、铰链、立体公仔、宇航员、机器人、小恐龙、蛋糕娃、童话人物、红斗篷、锡兵、长靴猫、拇指姑娘、雪之女王、提灯木偶、盛装外星人、维多利亚、和服、礼服裙、军礼服、旗袍、帝王袍…',
      'toolbar.cats': '分类筛选',
      'filter.size': '尺寸',
      'size.all': '全部尺寸',
      'size.s': '≤ 400 px',
      'size.m': '401 – 800 px',
      'size.l': '801 – 1600 px',
      'size.xl': '> 1600 px',
      'filter.sort': '排序',
      'sort.newest': '最新优先',
      'sort.default': '原始顺序',
      'sort.size-desc': '尺寸从大到小',
      'sort.bytes-desc': '体积从大到小',
      'sort.name': '名称',
      'chips.all': '全部',
      'chips.more': '更多',
      'chips.less': '收起',
      'count.line': '共 <b>{total}</b> 张素材，当前显示 <b>{n}</b> 张',
      'count.searching': '（搜索：“{q}”）',
      'count.page': ' · 第 {p} / {t} 页',
      'pager.prev': '‹ 上一页',
      'pager.next': '下一页 ›',
      'empty.title': '没有匹配的图片',
      'empty.reset': '清空筛选条件',
      'footer.coop.title': '合作与支持',
      'footer.coop.site': '网站合作',
      'footer.coop.invest': '投资',
      'footer.coop.ads': '广告接入',
      'footer.coop.donate': '捐赠',
      'footer.coop.desc': '以上任意一项，邮件直接聊：',
      'footer.ai': '关于 AI 与虚构的说明：本站所有素材图片均由 AI 生成并处理为透明 PNG；各处「故事由来」均为 AI 辅助创作的虚构设定，非事实陈述，素材规格以灯箱参数区为准。相关声明统一在此披露，不逐图重复。',
      'auth.login': '登录',
      'auth.logout': '退出',
      'auth.title': '登录后下载',
      'auth.tab.login': '登录',
      'auth.tab.register': '注册',
      'auth.email': '邮箱',
      'auth.password': '密码',
      'auth.submit.login': '登录',
      'auth.submit.register': '注册',
      'auth.hint': '下载需要注册登录；密码至少 8 位，仅用于本站账号。',
      'lb.download.login': '登录后下载',
      'auth.err.bad-email': '邮箱格式不太对',
      'auth.err.bad-password': '密码至少 8 位',
      'auth.err.bad-json': '请求没发对，刷新页面试试',
      'auth.err.email-taken': '这个邮箱已经注册过了，直接登录吧',
      'auth.err.wrong-credentials': '邮箱或密码不对',
      'auth.err.rate-limited': '操作太频繁了，歇一会再试',
      'auth.err.no-db': '服务暂时不可用，稍后再试',
      'auth.err.no-session': '登录已过期，请重新登录',
      'auth.err.server-error': '服务器打了个盹，稍后再试',
      'auth.err.network': '网络不稳，检查一下连接',
      'footer.contact': '联系：',
      'footer.hosted': '© 2026 smallfigure.com',
      'lb.close': '关闭',
      'lb.download': '下载大图',
      'lb.story': '故事由来',
      'cat.intro': '分类解说',
      'meta.generation': '生成方式',
      'meta.generation.ai': 'AI 生成',
      'lb.prev': '‹ 上一张',
      'lb.next': '下一张 ›',
      'bgm.title': '背景音乐',
      'bgm.aria': '背景音乐开关',
      'bgm.on': '背景音乐播放中，点击关闭',
      'bgm.off': '背景音乐已关闭，点击开启',
      'bgm.waiting': '浏览器拦了自动播放，点一下即响',
      'badge.anim': '动画',
      'badge.transparent': '透明 PNG',
      'dl.badge': '已被下载 {n} 次',
      'meta.srcSize': '原始尺寸',
      'meta.siteSize': '站内尺寸',
      'meta.bytes': '文件体积',
      'meta.type': '类型',
      'meta.downloads': '下载次数',
      'meta.times': '次',
      'type.sheet': '逐帧动画精灵图 × {n} 帧',
      'type.anim': 'WebP 循环动图',
      'type.still': 'PNG 静图',
      'cat.transparent': ' · 透明 PNG',
      'error.load': '素材数据加载失败：{msg}',
      'lang.label': '语言'
    },
    en: {
      'site.title': 'smallfigure · Original Figure Asset Gallery | Transparent PNG Assets',
      'meta.desc': 'smallfigure is an original figure asset gallery: transparent PNGs of character art, weapons, badges, creatures and more — each with its own backstory. Filter by category and size; free full-size downloads after sign-up.',
      'hero.subtitle': 'Everything has its own story — smallfigure collects them',
      'hero.kicker': 'Original Asset Gallery',
      'hero.title': 'Every little figure has a story',
      'hero.sub': 'smallfigure collects them all — 327 original figures, badges and oddities. Browse by category, download full images for free.',
      'hero.pill.count': '327 assets',
      'hero.pill.cats': '62 categories',
      'hero.pill.free': 'Free full-size downloads',
      'hero.cta': 'Start browsing',
      'hero.bg.alt': 'Laozhang, the Guck aliens and other original smallfigures floating in a starry night',
      'search.placeholder': 'Search art / tags: character, weapon, ammo, animal, food, vehicle, alien, flora, stone age, potion, grimoire, wand, castle, furniture, device, predation, planet, transparent, badge, animation, instrument, scarecrow, fangs, stone, currency, symbol, spaceship, space weapon, flying boot, shield, energy block, morph monster, telescope, embroidery, porcelain, macrame, woodblock, stained glass, rider, warrior, taoist, shaman, firearm, blunderbuss, courier, barista, fitness, commuter, skater, driver, odd elder, imp, flying beast, odd plant, jewel, fairy kid, odd food jar, furry boot, weird bug, odd constellation, nonsense, retro, fusion, odd blades, bizarre giants, bizarre skulls, odd weapons, monster toys, odd beasts, odd fish, odd birds, keys, locks, padlock, knocker, wrench, hinge, toy figures, astronaut, robot, dino, cake figure, fairytale, red cloak, tin soldier, booted cat, thumbelina, snow queen, lantern puppet, dressed aliens, victorian, kimono, ball gown, military, qipao, royal robe…',
      'toolbar.cats': 'Category filter',
      'filter.size': 'Size',
      'size.all': 'All sizes',
      'size.s': '≤ 400 px',
      'size.m': '401 – 800 px',
      'size.l': '801 – 1600 px',
      'size.xl': '> 1600 px',
      'filter.sort': 'Sort',
      'sort.newest': 'Newest first',
      'sort.default': 'Original order',
      'sort.size-desc': 'Size, largest first',
      'sort.bytes-desc': 'File size, largest first',
      'sort.name': 'Name',
      'chips.all': 'All',
      'chips.more': 'More',
      'chips.less': 'Less',
      'count.line': '{total} figures in total, showing <b>{n}</b>',
      'count.searching': ' (search: "{q}")',
      'count.page': ' · page {p} / {t}',
      'pager.prev': '‹ Prev',
      'pager.next': 'Next ›',
      'empty.title': 'No matching images',
      'empty.reset': 'Reset filters',
      'footer.coop.title': 'Partnership & Support',
      'footer.coop.site': 'Site partnerships',
      'footer.coop.invest': 'Investment',
      'footer.coop.ads': 'Advertising',
      'footer.coop.donate': 'Donations',
      'footer.coop.desc': 'For any of the above, just send an email: ',
      'footer.ai': 'About AI and fiction: every asset on this site is AI-generated and processed into a transparent PNG; every "Backstory" is AI-assisted fictional lore, not a statement of fact, and specs are as shown in each lightbox. These disclosures are unified here rather than repeated on every image.',
      'auth.login': 'Log in',
      'auth.logout': 'Log out',
      'auth.title': 'Log in to download',
      'auth.tab.login': 'Log in',
      'auth.tab.register': 'Sign up',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.submit.login': 'Log in',
      'auth.submit.register': 'Sign up',
      'auth.hint': 'Downloads require an account. Password: at least 8 characters, used only for this site.',
      'lb.download.login': 'Log in to download',
      'auth.err.bad-email': 'That email doesn\u2019t look right',
      'auth.err.bad-password': 'Password needs at least 8 characters',
      'auth.err.bad-json': 'Malformed request, try refreshing the page',
      'auth.err.email-taken': 'That email is already registered \u2014 try logging in',
      'auth.err.wrong-credentials': 'Wrong email or password',
      'auth.err.rate-limited': 'Too many attempts, try again in a bit',
      'auth.err.no-db': 'Service temporarily unavailable',
      'auth.err.no-session': 'Session expired, please log in again',
      'auth.err.server-error': 'Server hiccup, try again later',
      'auth.err.network': 'Network issue, check your connection',
      'footer.contact': 'Contact: ',
      'footer.hosted': '© 2026 smallfigure.com',
      'lb.close': 'Close',
      'lb.download': 'Download full image',
      'lb.story': 'Backstory',
      'cat.intro': 'About this category',
      'meta.generation': 'Created',
      'meta.generation.ai': 'AI-generated',
      'lb.prev': '‹ Previous',
      'lb.next': 'Next ›',
      'bgm.title': 'Background music',
      'bgm.aria': 'Background music toggle',
      'bgm.on': 'Music playing, click to turn off',
      'bgm.off': 'Music off, click to turn on',
      'bgm.waiting': 'Autoplay blocked by browser, click to play',
      'badge.anim': 'Animated',
      'badge.transparent': 'Transparent PNG',
      'dl.badge': 'Downloaded {n} times',
      'meta.srcSize': 'Original size',
      'meta.siteSize': 'Size on site',
      'meta.bytes': 'File size',
      'meta.type': 'Type',
      'meta.downloads': 'Downloads',
      'meta.times': '',
      'type.sheet': 'Frame-by-frame sprite sheet × {n} frames',
      'type.anim': 'WebP loop animation',
      'type.still': 'PNG still image',
      'cat.transparent': ' · Transparent PNG',
      'error.load': 'Failed to load gallery data: {msg}',
      'lang.label': 'Language'
    }
  };

  var current = 'zh';
  var listeners = [];

  function detect() {
    try {
      var saved = localStorage.getItem(STORE_KEY);
      if (saved && LANGS.indexOf(saved) !== -1) return saved;
    } catch (e) { /* 隐私模式 */ }
    var nav = (navigator.language || 'zh').toLowerCase();
    return nav.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function fill(tpl, vars) {
    if (!vars) return tpl;
    return tpl.replace(/\{(\w+)\}/g, function (m, k) {
      return Object.prototype.hasOwnProperty.call(vars, k) ? String(vars[k]) : m;
    });
  }

  function t(key, vars) {
    var d = DICT[current] || DICT.zh;
    var s = Object.prototype.hasOwnProperty.call(d, key) ? d[key] : (DICT.zh[key] || key);
    return fill(s, vars);
  }

  /* ---------- 静态文案绑定 ---------- */
  function applyStatic() {
    document.documentElement.lang = current === 'zh' ? 'zh-CN' : 'en';
    var nodes = document.querySelectorAll('[data-i18n],[data-i18n-ph],[data-i18n-title],[data-i18n-aria],[data-i18n-content]');
    Array.prototype.forEach.call(nodes, function (el) {
      var k;
      if ((k = el.getAttribute('data-i18n'))) el.textContent = t(k);
      if ((k = el.getAttribute('data-i18n-html'))) el.innerHTML = t(k);
      if ((k = el.getAttribute('data-i18n-ph'))) el.setAttribute('placeholder', t(k));
      if ((k = el.getAttribute('data-i18n-title'))) el.setAttribute('title', t(k));
      if ((k = el.getAttribute('data-i18n-aria'))) el.setAttribute('aria-label', t(k));
      if ((k = el.getAttribute('data-i18n-content'))) el.setAttribute('content', t(k));
    });
  }

  function notify() {
    listeners.forEach(function (fn) { try { fn(current); } catch (e) { /* 单个监听出错不影响其他 */ } });
  }

  function setLang(l) {
    if (LANGS.indexOf(l) === -1 || l === current) return;
    current = l;
    try { localStorage.setItem(STORE_KEY, l); } catch (e) { /* 存不了就用当前会话 */ }
    applyStatic();
    syncToggle();
    notify();
  }

  /* ---------- 切换按钮 ---------- */
  function syncToggle() {
    var btns = document.querySelectorAll('.lang-btn');
    Array.prototype.forEach.call(btns, function (b) {
      var on = b.dataset.lang === current;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function initToggle() {
    var boxes = document.querySelectorAll('.lang-toggle');
    Array.prototype.forEach.call(boxes, function (box) {
      box.addEventListener('click', function (e) {
        var btn = e.target.closest('.lang-btn');
        if (btn) setLang(btn.dataset.lang);
      });
    });
    syncToggle();
  }

  /* ---------- 导出 ---------- */
  window.SF = {
    t: t,
    lang: function () { return current; },
    setLang: setLang,
    onChange: function (fn) { listeners.push(fn); },
    locale: function () { return current === 'zh' ? 'zh-CN' : 'en-US'; }
  };

  current = detect();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { applyStatic(); initToggle(); });
  } else {
    applyStatic(); initToggle();
  }
})();

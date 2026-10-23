/* smallfigure · 中英文切换（须在 app.js 之前加载） */
(function () {
  'use strict';

  var LANGS = ['zh', 'en'];
  var STORE_KEY = 'sf_lang';

  /* ---------- 字典 ---------- */
  var DICT = {
    zh: {
      'site.title': 'smallfigure · 原创素材图鉴',
      'meta.desc': 'smallfigure 原创素材图鉴：角色立绘、武器装备、弹药军械、徽章、动物、食物美食、载具机械……每件素材都有自己的故事，不限题材。支持分类、尺寸筛选与名称搜索。',
      'hero.subtitle': '万物皆有自己的故事，smallfigure 收集这些故事',
      'search.placeholder': '搜素材 / 标签：角色、武器、弹药、动物、食物、载具、透明、徽章…',
      'toolbar.cats': '分类筛选',
      'filter.size': '尺寸',
      'size.all': '全部尺寸',
      'size.s': '≤ 400 px',
      'size.m': '401 – 800 px',
      'size.l': '801 – 1600 px',
      'size.xl': '> 1600 px',
      'filter.sort': '排序',
      'sort.default': '默认',
      'sort.size-desc': '尺寸从大到小',
      'sort.bytes-desc': '体积从大到小',
      'sort.name': '名称',
      'chips.all': '全部',
      'count.line': '共 <b>{total}</b> 张素材，当前显示 <b>{n}</b> 张',
      'count.searching': '（搜索：“{q}”）',
      'empty.title': '没有匹配的图片',
      'empty.reset': '清空筛选条件',
      'footer.contact': '联系：',
      'footer.hosted': '© 2026 smallfigure.com',
      'lb.close': '关闭',
      'lb.download': '下载大图',
      'lb.pause': '暂停',
      'lb.play': '播放',
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
      'type.anim': '动画帧（CSS 动效）',
      'type.still': 'PNG 静图',
      'cat.transparent': ' · 透明 PNG',
      'error.load': '素材数据加载失败：{msg}',
      'lang.label': '语言'
    },
    en: {
      'site.title': 'smallfigure · Original Asset Gallery',
      'meta.desc': 'smallfigure is an original asset gallery: character art, weapons and gear, ammunition, badges, creatures, food and drink, vehicles and machines — every piece has its own story, no subject limits. Filter by category and size, search by name.',
      'hero.subtitle': 'Everything has its own story — smallfigure collects them',
      'search.placeholder': 'Search art / tags: character, weapon, ammo, animal, food, vehicle, transparent, badge…',
      'toolbar.cats': 'Category filter',
      'filter.size': 'Size',
      'size.all': 'All sizes',
      'size.s': '≤ 400 px',
      'size.m': '401 – 800 px',
      'size.l': '801 – 1600 px',
      'size.xl': '> 1600 px',
      'filter.sort': 'Sort',
      'sort.default': 'Default',
      'sort.size-desc': 'Size, largest first',
      'sort.bytes-desc': 'File size, largest first',
      'sort.name': 'Name',
      'chips.all': 'All',
      'count.line': '{total} figures in total, showing <b>{n}</b>',
      'count.searching': ' (search: "{q}")',
      'empty.title': 'No matching images',
      'empty.reset': 'Reset filters',
      'footer.contact': 'Contact: ',
      'footer.hosted': '© 2026 smallfigure.com',
      'lb.close': 'Close',
      'lb.download': 'Download full image',
      'lb.pause': 'Pause',
      'lb.play': 'Play',
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
      'type.anim': 'Animated frames (CSS)',
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

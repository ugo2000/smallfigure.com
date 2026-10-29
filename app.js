/* smallfigure · 原创小人图鉴 */
(function () {
  'use strict';

  var DATA_URL = 'data/images.json';
  var COUNTS_URL = 'api/counts';       // 下载计数接口（Pages Functions + D1）
  var DL_URL = 'api/download/';        // 下载上报接口
  var DL_THRESHOLD = 100;              // 下载满 100 次才开始亮出计数
  var DL_POST_TIMEOUT = 2000;          // 上报最多等 2 秒，不堵下载
  var SHEET_MS = 3000; /* 精灵图循环周期，跟游戏 3 秒入场对齐 */
  var state = { q: '', cat: 'all', size: 'all', sort: 'newest', page: 0 };
  var PAGE_SIZE = 100;   // 每页最多显示 100 张，超出则翻页
  var all = [];       // 全量
  var view = [];      // 当前筛选结果
  var counts = {};    // id -> 下载次数（未达标不展示）
  var stories = { items: {}, cats: {} };  // 故事解说数据（data/stories.json，与 images.json 分离）
  var lbViewIndex = 0; // 灯箱当前在「当前筛选结果 view」中的位置
  var lbIm = null;     // 灯箱当前展示的素材对象
  var lbPlayer = null; // 灯箱里的精灵图播放器

  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid'), empty = $('empty'), countLine = $('countLine'), pagerEl = $('pager');
  var chipsEl = $('chips'), searchEl = $('search');
  var chipsMoreEl = $('chipsMore'), chipsMoreLabelEl = $('chipsMoreLabel');
  var chipsExpanded = false;   // 分类是否展开：默认只显示一行，点右侧箭头展开
  var sizeEl = $('sizeFilter'), sortEl = $('sortBy');
  var metaRef = null;   // 最近一次加载的元数据（语言切换时重建用）

  /* ---------- 工具 ---------- */
  function fmtBytes(b) {
    if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
    return Math.max(1, Math.round(b / 1024)) + ' KB';
  }
  /* 当前语言下的文案（数据带英文字段就用，没有就回退中文） */
  function locName(im) { return (SF.lang() === 'en' && im.nameEn) ? im.nameEn : im.name; }
  function locDesc(im) { return (SF.lang() === 'en' && im.descEn) ? im.descEn : im.desc; }
  function locCat(im) { return (SF.lang() === 'en' && im.categoryLabelEn) ? im.categoryLabelEn : im.categoryLabel; }

  /* 图片 URL 带内容版本号：图片内容变了 URL 就变，
     避免 CDN / 浏览器缓存继续发旧图（/assets/* 缓存 24 小时） */
  function assetUrl(im, key) {
    var u = im[key] || '';
    return im.ver ? u + '?v=' + im.ver : u;
  }
  function locTags(im) { return (SF.lang() === 'en' && im.tagsEn) ? im.tagsEn : im.tags; }
  function sizeBucket(w, h) {
    var m = Math.max(w, h);
    if (m <= 400) return 's';
    if (m <= 800) return 'm';
    if (m <= 1600) return 'l';
    return 'xl';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- 下载计数 ---------- */
  function fmtCount(n) { return n.toLocaleString(SF.locale()); }
  function countOf(id) { return counts[id] || 0; }

  /* ---------- 故事解说 ---------- */
  /* 故事数据单独一个文件：远端素材管线重建 images.json 时不会冲掉这里的内容 */
  function loadStories() {
    return fetch('data/stories.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.items) stories = d; })
      .catch(function () { /* 没有故事数据就静默降级：只显示 desc */ });
  }
  function itemStory(im) {
    var s = stories.items[im.id];
    if (!s) return null;
    return (SF.lang() === 'en' && s.en) ? s.en : s.zh;
  }
  function catStory(catKey) {
    var s = stories.cats[catKey];
    if (!s) return null;
    return (SF.lang() === 'en' && s.en) ? s.en : s.zh;
  }

  /* 卡片右上角的下载徽章：只有满 100 次才出现 */
  function dlBadgeHtml(id) {
    var n = countOf(id);
    if (n < DL_THRESHOLD) return '';
    return '<span class="badge dl" title="' + SF.t('dl.badge', { n: fmtCount(n) }) + '">↓ ' + fmtCount(n) + '</span>';
  }

  function applyCardCount(card, id) {
    var stage = card.querySelector('.stage');
    if (!stage) return;
    var old = stage.querySelector('.badge.dl');
    var html = dlBadgeHtml(id);
    if (!html) { if (old) old.remove(); return; }
    if (old) old.outerHTML = html;
    else stage.insertAdjacentHTML('beforeend', html);
  }

  /* 计数刷新：网格 + 灯箱（灯箱开着就同步 meta） */
  function refreshCounts() {
    Array.prototype.forEach.call(grid.querySelectorAll('.card'), function (card) {
      applyCardCount(card, card.dataset.id);
    });
    var lb = $('lightbox');
    if (lb && !lb.hidden && lbIm) {
      $('lbMeta').innerHTML = lbMetaHtml(lbIm);
    }
  }

  function loadCounts() {
    fetch(COUNTS_URL, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { if (d && d.ok) counts = d.counts || {}; refreshCounts(); })
      .catch(function () { /* 接口不可用就静默不展示，不打扰浏览 */ });
  }

  /* ---------- 背景音乐 ---------- */
  var BGM_VOLUME = 0.35; /* 背景音量，别盖过浏览 */
  var bgm = $('bgm'), bgmBtn = $('bgmBtn');
  var bgmWanted = true;  /* 期望状态：默认开，访客手动关过就记住 */
  try { bgmWanted = localStorage.getItem('sf_bgm') !== 'off'; } catch (e) { /* 隐私模式等 */ }

  var ICON_ON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
    '<path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/>' +
    '<path d="M16 8.5a5 5 0 0 1 0 7M18.6 6a8.6 8.6 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
    '<path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"/>' +
    '<path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

  function bgmIcon(on, waiting) {
    bgmBtn.innerHTML = on ? ICON_ON : ICON_OFF;
    bgmBtn.classList.toggle('off', !on);
    bgmBtn.classList.toggle('waiting', !!waiting);
    bgmBtn.title = on ? SF.t('bgm.on')
      : (waiting ? SF.t('bgm.waiting') : SF.t('bgm.off'));
  }

  function bgmSave() {
    try { localStorage.setItem('sf_bgm', bgmWanted ? 'on' : 'off'); } catch (e) { /* 存不了就算了 */ }
  }

  /* 渐入：不硬邦邦地砸出来 */
  function bgmFadeIn() {
    var v = 0;
    bgm.volume = 0;
    var t = setInterval(function () {
      v = Math.min(BGM_VOLUME, v + 0.05);
      bgm.volume = v;
      if (v >= BGM_VOLUME) clearInterval(t);
    }, 120);
  }

  function bgmTryPlay() {
    if (!bgmWanted || !bgm.paused) return;
    var p = bgm.play();
    if (!p || !p.then) return;
    p.then(function () {
      bgmFadeIn();
      bgmIcon(true, false);
      document.removeEventListener('pointerdown', bgmGesture);
      document.removeEventListener('keydown', bgmGesture);
    }).catch(function () {
      bgmIcon(false, true); /* 等首次交互再试 */
    });
  }

  function bgmGesture() { bgmTryPlay(); }

  function initBgm() {
    bgmIcon(bgmWanted && !bgm.paused, false);
    if (bgmWanted) {
      bgmTryPlay();
      /* 自动播放被拦：等访客第一次点页面/按键，顺势响起 */
      document.addEventListener('pointerdown', bgmGesture);
      document.addEventListener('keydown', bgmGesture);
    }
    bgmBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (bgm.paused) {
        bgmWanted = true; bgmSave(); bgmTryPlay();
      } else {
        bgm.pause();
        bgmWanted = false; bgmSave();
        bgmIcon(false, false);
      }
    });
  }

  /* ---------- 回到顶部（侧边悬停按钮） ---------- */
  function initToTop() {
    var btn = $('toTopBtn');
    if (!btn) return;
    var THRESHOLD = 320;   /* 滚过这一段才让按钮露脸 */
    var ticking = false;

    function sync() {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      btn.hidden = y < THRESHOLD;
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;          /* 一帧最多算一次，别绑死滚动 */
      ticking = true;
      window.requestAnimationFrame(sync);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      /* 回到顶部后焦点还给页面，别让焦点悬在已经看不见的按钮上 */
      btn.blur();
    });
    sync();
  }

  /* ---------- 精灵图播放器（rAF 驱动，不依赖 CSS 变量） ---------- */
  function makeSheetPlayer(el, frames, framePx) {
    var elapsed = 0, last = null, raf = null;
    function frame(now) {
      if (last === null) last = now;
      elapsed = (elapsed + (now - last)) % SHEET_MS;
      last = now;
      var i = Math.floor(elapsed / SHEET_MS * frames) % frames;
      el.style.backgroundPosition = '0px ' + (-i * framePx) + 'px';
      raf = requestAnimationFrame(frame);
    }
    return {
      play: function () { if (!raf) { last = null; raf = requestAnimationFrame(frame); } },
      pause: function () { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    };
  }

  /* ---------- 分类 chips ---------- */
  function buildChips(meta) {
    var catCounts = { all: all.length };
    all.forEach(function (im) { catCounts[im.category] = (catCounts[im.category] || 0) + 1; });
    var html = '<button class="chip active" data-cat="all" role="tab" aria-selected="true">' +
      SF.t('chips.all') + '<span class="n">' + catCounts.all + '</span></button>';
    meta.categories.forEach(function (c) {
      var label = (SF.lang() === 'en' && c.labelEn) ? c.labelEn : c.label;
      html += '<button class="chip" data-cat="' + c.key + '" role="tab" aria-selected="false">' +
        esc(label) + '<span class="n">' + (catCounts[c.key] || 0) + '</span></button>';
    });
    chipsEl.innerHTML = html;
    applyChipsClamp();
  }

  /* 分类行折叠控制：默认只显示第一行，放不下才出现「更多」箭头；
     展开态在语言切换重建后保持（选中项不能因收起而看不见） */
  function applyChipsClamp() {
    var chips = chipsEl.querySelectorAll('.chip');
    if (chips.length < 2) {
      chipsMoreEl.hidden = true;
      chipsExpanded = false;
      chipsEl.classList.remove('clamped', 'expanded');
      chipsEl.style.maxHeight = '';
      return;
    }
    var rowH = chips[0].offsetHeight;            /* 一行的高度（chips 均为单行） */
    var need = chipsEl.scrollHeight > rowH + 2;  /* 内容超出一行才需要折叠 */
    chipsMoreEl.hidden = !need;
    if (!need) chipsExpanded = false;
    if (chipsExpanded) {
      chipsEl.classList.remove('clamped');
      chipsEl.classList.add('expanded');
      chipsEl.style.maxHeight = '';
    } else if (need) {
      chipsEl.classList.add('clamped');
      chipsEl.classList.remove('expanded');
      chipsEl.style.maxHeight = rowH + 'px';
    } else {
      chipsEl.classList.remove('clamped', 'expanded');
      chipsEl.style.maxHeight = '';
    }
    chipsMoreEl.classList.toggle('open', chipsExpanded);
    chipsMoreEl.setAttribute('aria-expanded', chipsExpanded ? 'true' : 'false');
    chipsMoreLabelEl.textContent = SF.t(chipsExpanded ? 'chips.less' : 'chips.more');
  }

  chipsMoreEl.addEventListener('click', function () {
    chipsExpanded = !chipsExpanded;
    applyChipsClamp();
  });

  /* 窗口尺寸变化后重新判断一行放不放得下 */
  var chipsRzTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(chipsRzTimer);
    chipsRzTimer = setTimeout(applyChipsClamp, 150);
  });

  /* chips 点击委托：只绑一次，语言切换重建 HTML 不会重复绑 */
  chipsEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.chip');
    if (!btn) return;
    state.cat = btn.dataset.cat;
    state.page = 0;
    chipsEl.querySelectorAll('.chip').forEach(function (c) {
      var on = c === btn;
      c.classList.toggle('active', on);
      c.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    render();
  });

  /* ---------- 筛选 / 排序 ---------- */
  function applyFilters() {
    var q = state.q.trim().toLowerCase();
    view = all.filter(function (im) {
      if (state.cat !== 'all' && im.category !== state.cat) return false;
      if (state.size !== 'all' && sizeBucket(im.width, im.height) !== state.size) return false;
      if (q) {
        /* 中英文名/简介/标签/分类名/专属故事全部进 haystack：两种语言、故事关键词都能搜到 */
        var st = stories.items[im.id];
        var story = st ? ((st.zh || '') + ' ' + (st.en || '')) : '';
        var hay = (im.name + ' ' + (im.nameEn || '') + ' ' +
          im.desc + ' ' + (im.descEn || '') + ' ' +
          im.tags.join(' ') + ' ' + (im.tagsEn || []).join(' ') + ' ' +
          im.categoryLabel + ' ' + (im.categoryLabelEn || '') + ' ' + story).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    /* 搜索命中排序：名称 > 标签/分类 > 简介/故事。仅在默认「最新优先」时启用，不改用户显式选择的排序 */
    function scoreOf(im) {
      var nm = (im.name + ' ' + (im.nameEn || '')).toLowerCase();
      var tg = ((im.tags || []).join(' ') + ' ' + ((im.tagsEn || []).join(' ')) + ' ' +
        im.categoryLabel + ' ' + (im.categoryLabelEn || '')).toLowerCase();
      if (nm.indexOf(q) !== -1) return 3;
      if (tg.indexOf(q) !== -1) return 2;
      return 1;
    }
    if (state.sort === 'newest') {
      /* 最新入库的排在最前面；搜索时名称/标签命中优先；added 缺失的沉到末尾 */
      view.sort(function (a, b) {
        if (q) { var d = scoreOf(b) - scoreOf(a); if (d) return d; }
        var ta = a.added || '', tb = b.added || '';
        if (ta === tb) return String(a.id).localeCompare(String(b.id));
        if (!ta) return 1;
        if (!tb) return -1;
        return ta < tb ? 1 : -1;
      });
    } else if (state.sort === 'size-desc') {
      view.sort(function (a, b) { return b.width * b.height - a.width * a.height; });
    } else if (state.sort === 'bytes-desc') {
      view.sort(function (a, b) { return b.bytes - a.bytes; });
    } else if (state.sort === 'name') {
      view.sort(function (a, b) { return locName(a).localeCompare(locName(b), SF.lang() === 'zh' ? 'zh' : 'en'); });
    }
  }

  /* ---------- 卡片 ---------- */
  function stageInner(im, stageH) {
    if (im.effect === 'sheet') {
      var scale = Math.min(1, stageH / im.frameHeight);
      var w = Math.round(im.frameWidth * scale);
      var h = Math.round(im.frameHeight * scale);
      var framePx = Math.round(im.frameHeight * scale);
      return '<div class="fx-sheet" data-sheet="' + im.frames + '" data-framepx="' + framePx + '"' +
        ' style="width:' + w + 'px;height:' + h + 'px;' +
        'background-image:url(' + assetUrl(im, 'file') + ');background-size:' + w + 'px ' + (framePx * im.frames) + 'px;"></div>';
    }
    var fx = im.effect ? ' class="fx-' + im.effect + '"' : '';
    return '<img' + fx + ' loading="lazy" src="' + assetUrl(im, 'thumb') + '" alt="' + esc(locName(im)) + '" width="' + im.width + '" height="' + im.height + '">';
  }

  function cardEl(im) {
    var el = document.createElement('article');
    el.className = 'card';
    el.dataset.id = im.id;
    var badge = im.animated
      ? '<span class="badge anim">' + SF.t('badge.anim') + '</span>'
      : (im.transparent ? '<span class="badge">' + SF.t('badge.transparent') + '</span>' : '');
    el.innerHTML =
      '<div class="stage' + (im.transparent ? ' checker' : '') + '">' + stageInner(im, 190) + badge + dlBadgeHtml(im.id) + '</div>' +
      '<div class="card-meta">' +
      '<h3>' + esc(locName(im)) + '</h3>' +
      '<p class="dims">' + im.width + ' × ' + im.height + ' · ' + fmtBytes(im.bytes) + '</p>' +
      '<p class="cat">' + esc(locCat(im)) + '</p>' +
      /* 每张素材一个可独立收录的落地页（构建期生成的静态页），爬虫靠这个 <a> 找到详情 */
      '<a class="card-detail" href="/i/' + encodeURIComponent(im.id) + '/">' + SF.t('card.detail') + '</a>' +
      '</div>';
    el.addEventListener('click', function () { openLightbox(im); });
    /* 点详情链接时别顺带弹灯箱 */
    var detail = el.querySelector('.card-detail');
    if (detail) {
      detail.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    return el;
  }

  function startSheets(root) {
    root.querySelectorAll('[data-sheet]').forEach(function (el) {
      if (el._player) { el._player.play(); return; }
      el._player = makeSheetPlayer(el, +el.dataset.sheet, +el.dataset.framepx);
      el._player.play();
    });
  }

  function render() {
    applyFilters();
    var totalPages = Math.max(1, Math.ceil(view.length / PAGE_SIZE));
    if (state.page > totalPages - 1) state.page = totalPages - 1;
    if (state.page < 0) state.page = 0;
    var start = state.page * PAGE_SIZE;
    var pageItems = view.slice(start, start + PAGE_SIZE);

    grid.innerHTML = '';
    var frag = document.createDocumentFragment();
    pageItems.forEach(function (im) { frag.appendChild(cardEl(im)); });
    grid.appendChild(frag);
    startSheets(grid);

    var hasResults = view.length > 0;
    empty.hidden = hasResults;
    countLine.innerHTML = SF.t('count.line', { total: all.length, n: view.length }) +
      (state.q ? SF.t('count.searching', { q: esc(state.q) }) : '') +
      (totalPages > 1 ? SF.t('count.page', { p: state.page + 1, t: totalPages }) : '');
    /* 分类解说面板：选中具体分类且有故事时出现在计数行上方 */
    var catIntro = $('catIntro');
    var intro = state.cat !== 'all' ? catStory(state.cat) : null;
    if (intro) { $('catIntroText').textContent = intro; catIntro.hidden = false; }
    else catIntro.hidden = true;
    renderPager(totalPages);
  }

  /* 翻页器：每页最多 PAGE_SIZE 张，超出才出现 */
  function renderPager(totalPages) {
    if (!pagerEl) return;
    if (totalPages <= 1 || view.length === 0) { pagerEl.innerHTML = ''; pagerEl.hidden = true; return; }
    pagerEl.hidden = false;
    var cur = state.page;
    var html = '<button class="pg-btn" data-pg="prev" ' + (cur === 0 ? 'disabled' : '') + '>' + SF.t('pager.prev') + '</button>';
    var pages = [];
    var maxShow = 7;
    if (totalPages <= maxShow) {
      for (var i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      var s = Math.max(1, cur - 2), e = Math.min(totalPages - 2, cur + 2);
      if (s > 1) pages.push('…');
      for (var j = s; j <= e; j++) pages.push(j);
      if (e < totalPages - 2) pages.push('…');
      pages.push(totalPages - 1);
    }
    pages.forEach(function (p) {
      if (p === '…') { html += '<span class="pg-ellipsis">…</span>'; return; }
      html += '<button class="pg-btn' + (p === cur ? ' active' : '') + '" data-pg="' + p + '">' + (p + 1) + '</button>';
    });
    html += '<button class="pg-btn" data-pg="next" ' + (cur === totalPages - 1 ? 'disabled' : '') + '>' + SF.t('pager.next') + '</button>';
    pagerEl.innerHTML = html;
  }

  /* 灯箱元数据（下载次数满 100 才露出） */
  function lbMetaHtml(im) {
    var html =
      '<dt>' + SF.t('meta.srcSize') + '</dt><dd>' + im.srcWidth + ' × ' + im.srcHeight + ' px</dd>' +
      '<dt>' + SF.t('meta.siteSize') + '</dt><dd>' + im.width + ' × ' + im.height + ' px</dd>' +
      '<dt>' + SF.t('meta.bytes') + '</dt><dd>' + fmtBytes(im.bytes) + '</dd>' +
      '<dt>' + SF.t('meta.type') + '</dt><dd>' + (im.effect === 'sheet' ? SF.t('type.sheet', { n: im.frames })
        : (im.animated ? SF.t('type.anim') : SF.t('type.still'))) + '</dd>' +
      '<dt>' + SF.t('meta.generation') + '</dt><dd>' + SF.t('meta.generation.ai') + '</dd>';
    var n = countOf(im.id);
    if (n >= DL_THRESHOLD) {
      html += '<dt>' + SF.t('meta.downloads') + '</dt><dd>' + fmtCount(n) + SF.t('meta.times') + '</dd>';
    }
    return html;
  }

  /* ---------- 灯箱 ---------- */
  function openLightbox(im) {
    lbIm = im;
    lbViewIndex = view.indexOf(im);
    var lb = $('lightbox');
    var stage = $('lbStage');

    if (lbPlayer) { lbPlayer.pause(); lbPlayer = null; }
    stage.innerHTML = '';
    stage.classList.toggle('checker', !!im.transparent);

    if (im.effect === 'sheet') {
      var scale = Math.min(1.15, (window.innerHeight - 200) / im.frameHeight);
      var w = Math.round(im.frameWidth * scale);
      var h = Math.round(im.frameHeight * scale);
      var framePx = Math.round(im.frameHeight * scale);
      var div = document.createElement('div');
      div.className = 'fx-sheet';
      div.style.width = w + 'px';
      div.style.height = h + 'px';
      div.style.backgroundImage = 'url(' + assetUrl(im, 'file') + ')';
      div.style.backgroundSize = w + 'px ' + (framePx * im.frames) + 'px';
      stage.appendChild(div);
      lbPlayer = makeSheetPlayer(div, im.frames, framePx);
      lbPlayer.play();
    } else {
      var img = document.createElement('img');
      img.src = assetUrl(im, 'file');
      img.alt = locName(im);
      if (im.effect) img.className = 'fx-' + im.effect;
      stage.appendChild(img);
    }

    $('lbCat').textContent = locCat(im) + (im.transparent ? SF.t('cat.transparent') : '');
    $('lbName').textContent = locName(im);
    $('lbDesc').textContent = locDesc(im);
    /* 故事由来：只放每张图专属的素材故事（分类解说在主页 catIntro 面板，不进灯箱） */
    var is = itemStory(im);
    if (is) {
      $('lbStoryText').textContent = is;
      $('lbStory').hidden = false;
    } else {
      $('lbStory').hidden = true;
    }
    $('lbTags').innerHTML = locTags(im).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    var dl = $('lbDownload');
    dl.href = assetUrl(im, 'file');
    dl.setAttribute('download', im.id + '.png');
    /* 未登录时按钮改成引导登录的文案，点了照样弹登录框 */
    dl.textContent = currentUser ? SF.t('lb.download') : SF.t('lb.download.login');
    $('lbMeta').innerHTML = lbMetaHtml(im);
    $('lbPos').textContent = ((lbViewIndex >= 0 ? lbViewIndex : 0) + 1) + ' / ' + view.length;

    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (lbPlayer) { lbPlayer.pause(); lbPlayer = null; }
    $('lightbox').hidden = true;
    document.body.style.overflow = '';
  }

  function stepLightbox(d) {
    var n = view.length;
    if (n === 0) return;
    var ni = (lbViewIndex + d + n) % n;
    openLightbox(view[ni]);
  }

  /* ---------- 事件 ---------- */
  var searchTimer = null;
  searchEl.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { state.q = searchEl.value; state.page = 0; render(); }, 120);
  });
  sizeEl.addEventListener('change', function () { state.size = sizeEl.value; state.page = 0; render(); });
  sortEl.addEventListener('change', function () { state.sort = sortEl.value; state.page = 0; render(); });
  /* 翻页：改变 view 的筛选操作已经把 state.page 归零，这里只负责切页 */
  pagerEl.addEventListener('click', function (e) {
    var btn = e.target.closest('.pg-btn');
    if (!btn || btn.disabled) return;
    var a = btn.dataset.pg;
    if (a === 'prev') state.page = Math.max(0, state.page - 1);
    else if (a === 'next') state.page = Math.min(Math.max(1, Math.ceil(view.length / PAGE_SIZE)) - 1, state.page + 1);
    else state.page = parseInt(a, 10);
    render();
    var g = $('grid');
    if (g) g.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('resetBtn').addEventListener('click', function () {
    state = { q: '', cat: 'all', size: 'all', sort: 'newest', page: 0 };
    searchEl.value = ''; sizeEl.value = 'all'; sortEl.value = 'newest';
    chipsEl.querySelectorAll('.chip').forEach(function (c, i) {
      c.classList.toggle('active', i === 0);
      c.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    });
    render();
  });

  $('lightbox').addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closeLightbox(); });
  $('lbPrev').addEventListener('click', function () { stepLightbox(-1); });
  $('lbNext').addEventListener('click', function () { stepLightbox(1); });

  /* ---------- 下载：先上报计数（最多等 2 秒），再触发文件下载 ---------- */
  function triggerDownload(im) {
    var a = document.createElement('a');
    a.href = assetUrl(im, 'file');
    a.setAttribute('download', im.id + '.png');
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function downloadWithCount(im) {
    /* 下载门控：未登录先弹登录/注册，登录成功后自动补下载 */
    if (!currentUser) {
      pendingDownload = im;
      openAuthModal('login');
      return;
    }
    var posted = fetch(DL_URL + encodeURIComponent(im.id), { method: 'POST' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok && typeof d.count === 'number') {
          counts[im.id] = d.count;
          refreshCounts(); /* 万一这次下载跨过 100，徽章立刻亮 */
          return true;
        }
        if (d && d.error === 'no-session') {
          /* 会话中途过期：退回未登录态，弹登录框，登录后补下载 */
          currentUser = null;
          renderAuthBox();
          pendingDownload = im;
          openAuthModal('login');
        }
        return false;
      })
      .catch(function () { return true; }); /* 上报失败也不堵下载 */
    var cap = new Promise(function (res) { setTimeout(res, DL_POST_TIMEOUT); });
    Promise.race([posted, cap]).then(function (ok) { if (ok !== false) triggerDownload(im); });
  }

  $('lbDownload').addEventListener('click', function (e) {
    var im = lbIm;
    if (!im) return;
    e.preventDefault();
    downloadWithCount(im);
  });

  /* ---------- 登录 / 注册 / 注销 ---------- */
  var AUTH_ME_URL = 'api/auth/me';
  var currentUser = null;      /* { id, email } | null */
  var pendingDownload = null;  /* 未登录时点的下载，登录成功后补上 */
  var authTab = 'login';
  var authModal = $('authModal');

  function renderAuthBox() {
    var box = $('authBox');
    if (!box) return;
    box.innerHTML = currentUser
      ? '<span class="auth-user" title="' + esc(currentUser.email) + '">' +
        esc(currentUser.email.split('@')[0]) + '</span>' +
        '<button class="auth-btn ghost" type="button" id="logoutBtn">' + SF.t('auth.logout') + '</button>'
      : '<button class="auth-btn" type="button" id="loginBtn">' + SF.t('auth.login') + '</button>';
    var login = $('loginBtn'), logout = $('logoutBtn');
    if (login) login.addEventListener('click', function () { openAuthModal('login'); });
    if (logout) logout.addEventListener('click', doLogout);
  }

  function loadMe() {
    fetch(AUTH_ME_URL, { cache: 'no-store' })
      .then(function (r) {
        if (r.status === 401) return null;
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) { if (d && d.ok) currentUser = d.user; })
      .catch(function () { /* 接口不可用就当未登录，不打扰浏览 */ })
      .then(function () { renderAuthBox(); });
  }

  function openAuthModal(tab) {
    setAuthTab(tab || 'login');
    var err = $('authError');
    err.hidden = true;
    err.textContent = '';
    authModal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(function () { $('authEmail').focus(); }, 30);
  }

  function closeAuthModal() {
    authModal.hidden = true;
    if ($('lightbox').hidden) document.body.style.overflow = '';
    $('authPass').value = '';
    pendingDownload = null;
  }

  function setAuthTab(tab) {
    authTab = tab;
    authModal.querySelectorAll('.auth-tab').forEach(function (b) {
      var on = b.dataset.tab === tab;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    $('authSubmit').textContent = SF.t(tab === 'login' ? 'auth.submit.login' : 'auth.submit.register');
    $('authPass').setAttribute('autocomplete', tab === 'login' ? 'current-password' : 'new-password');
  }

  function showAuthError(code) {
    var err = $('authError');
    err.textContent = SF.t('auth.err.' + code);
    err.hidden = false;
  }

  function doLogout() {
    fetch('api/auth/logout', { method: 'POST' })
      .catch(function () { /* 失败也照样本地退出 */ })
      .then(function () {
        currentUser = null;
        renderAuthBox();
        if (!$('lightbox').hidden) openLightbox(lbIm); /* 灯箱开着就刷新下载按钮文案 */
      });
  }

  /* 弹窗交互：tab 切换 / 遮罩关闭 / 表单提交 */
  authModal.querySelectorAll('.auth-tab').forEach(function (b) {
    b.addEventListener('click', function () { setAuthTab(b.dataset.tab); });
  });
  authModal.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closeAuthModal(); });

  $('authForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('authEmail').value.trim();
    var password = $('authPass').value;
    var btn = $('authSubmit');
    btn.disabled = true;
    fetch('api/auth/' + authTab, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(function (r) {
        return r.json().then(function (d) { return { status: r.status, body: d }; })
          .catch(function () { return { status: r.status, body: null }; });
      })
      .then(function (res) {
        btn.disabled = false;
        if (res.body && res.body.ok && res.body.user) {
          currentUser = res.body.user;
          renderAuthBox();
          /* 先取待下载再关弹窗：closeAuthModal 会清 pendingDownload */
          var pend = pendingDownload;
          pendingDownload = null;
          closeAuthModal();
          if (pend) downloadWithCount(pend); /* 登录成功，补上刚才点的下载 */
        } else {
          showAuthError((res.body && res.body.error) || 'server-error');
        }
      })
      .catch(function () { btn.disabled = false; showAuthError('network'); });
  });

  /* ---------- 防右键另存 / 拖拽保存（只挡顺手操作，浏览体验不变） ---------- */
  document.addEventListener('contextmenu', function (e) {
    if (e.target && e.target.closest && e.target.closest('img, .stage, .lb-stage, .fx-sheet')) {
      e.preventDefault();
    }
  });
  document.addEventListener('dragstart', function (e) {
    if (e.target && e.target.closest && e.target.closest('img, .fx-sheet')) {
      e.preventDefault();
    }
  });

  document.addEventListener('keydown', function (e) {
    if ($('lightbox').hidden) {
      if (e.key === '/' && document.activeElement !== searchEl) { e.preventDefault(); searchEl.focus(); }
      return;
    }
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') stepLightbox(-1);
    else if (e.key === 'ArrowRight') stepLightbox(1);
  });

  /* ---------- 启动 ---------- */
  fetch(DATA_URL)
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (meta) {
      metaRef = meta;
      all = meta.images;
      document.title = SF.t('site.title');
      buildChips(meta);
      render();
      /* 故事数据后到：到了补一次渲染（分类解说面板），灯箱开着就补上故事块 */
      loadStories().then(function () {
        render();
        var lb = $('lightbox');
        if (lb && !lb.hidden && lbIm) openLightbox(lbIm);
      });
      loadCounts(); /* 计数后到，拉到了再补徽章 */
      loadMe();     /* 登录态：恢复会话或保持匿名 */
      initBgm();    /* 背景音乐：默认开，被浏览器拦了就等首次交互 */
      initToTop();  /* 回到顶部：滚过一段才出现 */
      /* 语言切换：标题 / chips / 网格 / 灯箱 / 音乐提示 / 登录入口 全部重绘 */
      SF.onChange(function () {
        document.title = SF.t('site.title');
        if (metaRef) buildChips(metaRef);
        render();
        renderAuthBox();
        var lb = $('lightbox');
        if (lb && !lb.hidden) openLightbox(lbIm);
        bgmIcon(bgmWanted && !bgm.paused, bgmBtn.classList.contains('waiting'));
      });
    })
    .catch(function (err) {
      grid.innerHTML = '<p style="color:var(--muted);padding:40px 0">' +
        SF.t('error.load', { msg: esc(err.message) }) + '</p>';
    });
})();

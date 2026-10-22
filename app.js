/* smallfigure · 原创小人图鉴 */
(function () {
  'use strict';

  var DATA_URL = 'data/images.json';
  var COUNTS_URL = 'api/counts';       // 下载计数接口（Pages Functions + D1）
  var DL_URL = 'api/download/';        // 下载上报接口
  var DL_THRESHOLD = 100;              // 下载满 100 次才开始亮出计数
  var DL_POST_TIMEOUT = 2000;          // 上报最多等 2 秒，不堵下载
  var SHEET_MS = 3000; /* 精灵图循环周期，跟游戏 3 秒入场对齐 */
  var state = { q: '', cat: 'all', size: 'all', sort: 'default' };
  var all = [];       // 全量
  var view = [];      // 当前筛选结果
  var counts = {};    // id -> 下载次数（未达标不展示）
  var lbIndex = 0;    // 灯箱当前位置
  var lbPlayer = null; // 灯箱里的精灵图播放器
  var lbFxEl = null;   // 灯箱里的 CSS 动效元素

  var $ = function (id) { return document.getElementById(id); };
  var grid = $('grid'), empty = $('empty'), countLine = $('countLine');
  var chipsEl = $('chips'), searchEl = $('search');
  var sizeEl = $('sizeFilter'), sortEl = $('sortBy');

  /* ---------- 工具 ---------- */
  function fmtBytes(b) {
    if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
    return Math.max(1, Math.round(b / 1024)) + ' KB';
  }
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
  function fmtCount(n) { return n.toLocaleString('zh-CN'); }
  function countOf(id) { return counts[id] || 0; }

  /* 卡片右上角的下载徽章：只有满 100 次才出现 */
  function dlBadgeHtml(id) {
    var n = countOf(id);
    if (n < DL_THRESHOLD) return '';
    return '<span class="badge dl" title="已被下载 ' + fmtCount(n) + ' 次">↓ ' + fmtCount(n) + '</span>';
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
    if (lb && !lb.hidden) {
      var im = all[lbIndex];
      if (im) $('lbMeta').innerHTML = lbMetaHtml(im);
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
    bgmBtn.title = on ? '背景音乐播放中，点击关闭'
      : (waiting ? '浏览器拦了自动播放，点一下即响' : '背景音乐已关闭，点击开启');
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
    var html = '<button class="chip active" data-cat="all" role="tab" aria-selected="true">全部<span class="n">' + catCounts.all + '</span></button>';
    meta.categories.forEach(function (c) {
      html += '<button class="chip" data-cat="' + c.key + '" role="tab" aria-selected="false">' +
        esc(c.label) + '<span class="n">' + (catCounts[c.key] || 0) + '</span></button>';
    });
    chipsEl.innerHTML = html;
    chipsEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      state.cat = btn.dataset.cat;
      chipsEl.querySelectorAll('.chip').forEach(function (c) {
        var on = c === btn;
        c.classList.toggle('active', on);
        c.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      render();
    });
  }

  /* ---------- 筛选 / 排序 ---------- */
  function applyFilters() {
    var q = state.q.trim().toLowerCase();
    view = all.filter(function (im) {
      if (state.cat !== 'all' && im.category !== state.cat) return false;
      if (state.size !== 'all' && sizeBucket(im.width, im.height) !== state.size) return false;
      if (q) {
        var hay = (im.name + ' ' + im.desc + ' ' + im.tags.join(' ') + ' ' + im.categoryLabel).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
    if (state.sort === 'size-desc') {
      view.sort(function (a, b) { return b.width * b.height - a.width * a.height; });
    } else if (state.sort === 'bytes-desc') {
      view.sort(function (a, b) { return b.bytes - a.bytes; });
    } else if (state.sort === 'name') {
      view.sort(function (a, b) { return a.name.localeCompare(b.name, 'zh'); });
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
        'background-image:url(' + im.file + ');background-size:' + w + 'px ' + (framePx * im.frames) + 'px;"></div>';
    }
    var fx = im.effect ? ' class="fx-' + im.effect + '"' : '';
    return '<img' + fx + ' loading="lazy" src="' + im.thumb + '" alt="' + esc(im.name) + '" width="' + im.width + '" height="' + im.height + '">';
  }

  function cardEl(im) {
    var el = document.createElement('article');
    el.className = 'card';
    el.dataset.id = im.id;
    var badge = im.animated
      ? '<span class="badge anim">动画</span>'
      : (im.transparent ? '<span class="badge">透明 PNG</span>' : '');
    el.innerHTML =
      '<div class="stage' + (im.transparent ? ' checker' : '') + '">' + stageInner(im, 190) + badge + dlBadgeHtml(im.id) + '</div>' +
      '<div class="card-meta">' +
      '<h3>' + esc(im.name) + '</h3>' +
      '<p class="dims">' + im.width + ' × ' + im.height + ' · ' + fmtBytes(im.bytes) + '</p>' +
      '<p class="cat">' + esc(im.categoryLabel) + '</p>' +
      '</div>';
    el.addEventListener('click', function () { openLightbox(all.indexOf(im)); });
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
    grid.innerHTML = '';
    var frag = document.createDocumentFragment();
    view.forEach(function (im) { frag.appendChild(cardEl(im)); });
    grid.appendChild(frag);
    empty.hidden = view.length > 0;
    countLine.innerHTML = '共 <b>' + all.length + '</b> 张素材，当前显示 <b>' + view.length + '</b> 张' +
      (state.q ? '（搜索：“' + esc(state.q) + '”）' : '');
    startSheets(grid);
  }

  /* 灯箱元数据（下载次数满 100 才露出） */
  function lbMetaHtml(im) {
    var html =
      '<dt>原始尺寸</dt><dd>' + im.srcWidth + ' × ' + im.srcHeight + ' px</dd>' +
      '<dt>站内尺寸</dt><dd>' + im.width + ' × ' + im.height + ' px</dd>' +
      '<dt>文件体积</dt><dd>' + fmtBytes(im.bytes) + '</dd>' +
      '<dt>类型</dt><dd>' + (im.effect === 'sheet' ? '逐帧动画精灵图 × ' + im.frames + ' 帧'
        : (im.animated ? '动画帧（CSS 动效）' : 'PNG 静图')) + '</dd>';
    var n = countOf(im.id);
    if (n >= DL_THRESHOLD) {
      html += '<dt>下载次数</dt><dd>' + fmtCount(n) + ' 次</dd>';
    }
    return html;
  }

  /* ---------- 灯箱 ---------- */
  function openLightbox(idx) {
    lbIndex = idx;
    var im = all[idx];
    var lb = $('lightbox');
    var stage = $('lbStage');

    if (lbPlayer) { lbPlayer.pause(); lbPlayer = null; }
    lbFxEl = null;
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
      div.style.backgroundImage = 'url(' + im.file + ')';
      div.style.backgroundSize = w + 'px ' + (framePx * im.frames) + 'px';
      stage.appendChild(div);
      lbPlayer = makeSheetPlayer(div, im.frames, framePx);
      lbPlayer.play();
      $('lbPlay').hidden = false;
      $('lbPlay').textContent = '暂停';
    } else {
      var img = document.createElement('img');
      img.src = im.file;
      img.alt = im.name;
      if (im.effect) {
        img.className = 'fx-' + im.effect;
        lbFxEl = img;
      }
      stage.appendChild(img);
      $('lbPlay').hidden = true;
    }

    $('lbCat').textContent = im.categoryLabel + (im.transparent ? ' · 透明 PNG' : '');
    $('lbName').textContent = im.name;
    $('lbDesc').textContent = im.desc;
    $('lbTags').innerHTML = im.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    var dl = $('lbDownload');
    dl.href = im.file;
    dl.setAttribute('download', im.id + '.png');
    $('lbMeta').innerHTML = lbMetaHtml(im);
    var pos = view.indexOf(im);
    $('lbPos').textContent = ((pos >= 0 ? pos : lbIndex) + 1) + ' / ' + all.length;

    lb.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (lbPlayer) { lbPlayer.pause(); lbPlayer = null; }
    $('lightbox').hidden = true;
    document.body.style.overflow = '';
  }

  function stepLightbox(d) {
    var n = all.length;
    openLightbox((lbIndex + d + n) % n);
  }

  /* ---------- 事件 ---------- */
  var searchTimer = null;
  searchEl.addEventListener('input', function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { state.q = searchEl.value; render(); }, 120);
  });
  sizeEl.addEventListener('change', function () { state.size = sizeEl.value; render(); });
  sortEl.addEventListener('change', function () { state.sort = sortEl.value; render(); });
  $('resetBtn').addEventListener('click', function () {
    state = { q: '', cat: 'all', size: 'all', sort: 'default' };
    searchEl.value = ''; sizeEl.value = 'all'; sortEl.value = 'default';
    chipsEl.querySelectorAll('.chip').forEach(function (c, i) {
      c.classList.toggle('active', i === 0);
      c.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    });
    render();
  });

  $('lightbox').addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) closeLightbox(); });
  $('lbPrev').addEventListener('click', function () { stepLightbox(-1); });
  $('lbNext').addEventListener('click', function () { stepLightbox(1); });
  $('lbPlay').addEventListener('click', function () {
    var playing;
    if (lbPlayer) {
      /* 用 aria 记不住状态，靠 DOM 判断：直接切 */
      playing = $('lbPlay').textContent === '播放'; /* 当前文案是「播放」= 已暂停 */
      if (playing) lbPlayer.play(); else lbPlayer.pause();
      $('lbPlay').textContent = playing ? '暂停' : '播放';
    } else if (lbFxEl) {
      playing = lbFxEl.style.animationPlayState !== 'paused';
      lbFxEl.style.animationPlayState = playing ? 'paused' : 'running';
      $('lbPlay').textContent = playing ? '播放' : '暂停';
    }
  });

  /* ---------- 下载：先上报计数（最多等 2 秒），再触发文件下载 ---------- */
  function triggerDownload(im) {
    var a = document.createElement('a');
    a.href = im.file;
    a.setAttribute('download', im.id + '.png');
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function downloadWithCount(im) {
    var posted = fetch(DL_URL + encodeURIComponent(im.id), { method: 'POST' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok && typeof d.count === 'number') {
          counts[im.id] = d.count;
          refreshCounts(); /* 万一这次下载跨过 100，徽章立刻亮 */
        }
      })
      .catch(function () { /* 上报失败也不堵下载 */ });
    var cap = new Promise(function (res) { setTimeout(res, DL_POST_TIMEOUT); });
    Promise.race([posted, cap]).then(function () { triggerDownload(im); });
  }

  $('lbDownload').addEventListener('click', function (e) {
    var im = all[lbIndex];
    if (!im) return;
    e.preventDefault();
    downloadWithCount(im);
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
      all = meta.images;
      document.title = meta.site + ' · ' + (meta.subtitle || '游戏美术素材库');
      buildChips(meta);
      render();
      loadCounts(); /* 计数后到，拉到了再补徽章 */
      initBgm();    /* 背景音乐：默认开，被浏览器拦了就等首次交互 */
    })
    .catch(function (err) {
      grid.innerHTML = '<p style="color:var(--muted);padding:40px 0">素材数据加载失败：' + esc(err.message) + '</p>';
    });
})();

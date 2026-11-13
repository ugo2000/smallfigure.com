/* Smallfigure: Merge Museum
 * A self-contained HTML5 merge game built from smallfigure.com original character art.
 * YouTube Playables (游戏大本营) SDK integration is in the `S` adapter below.
 * No external assets, no analytics, no network calls: only the official SDK script in index.html.
 */
(function () {
  'use strict';

  var YT = (typeof ytgame !== 'undefined') && ytgame.IN_PLAYABLES_ENV === true;
  var W = 420, H = 720;
  var WALL = 16, FLOOR = 700, TOP = 96, DANGER = 142;
  var GRAV = 1180, STEP = 1 / 60;

  // 11-step merge chain. All sprites are local, transparent, trimmed to the subject.
  var CHAIN = [
    { k: 'l1',  r: 18, c: '#d6f0f4', e: '#4c9bad', en: 'Crystal Bell',     zh: '徽章 · 晶铃',       note: "A bell that only rings when something has been lost.",               noteZh: '只有在丢了东西的时候，它才会响。' },
    { k: 'l2',  r: 22, c: '#f0ddd4', e: '#a3553f', en: 'Flame Imp',        zh: '火苗小鬼',           note: 'Keeps a candle flame as a pet. Never asks for anything back.',    noteZh: '养了一簇火苗当宠物，从不求回报。' },
    { k: 'l3',  r: 26, c: '#f7e6c8', e: '#c08a3e', en: 'Tonkotsu Ramen',   zh: '豚骨拉面',           note: 'Twelve hours of broth, one soft egg, no regrets.',               noteZh: '熬了十二小时的汤，一颗溏心蛋，不后悔。' },
    { k: 'l4',  r: 30, c: '#e5e9f6', e: '#6a74ac', en: 'Feather Sprite',   zh: '羽衣仙童',           note: 'Fell out of a storybook and decided to stay.',                    noteZh: '从故事书里掉出来，就赖着不走了。' },
    { k: 'l5',  r: 35, c: '#f4ded2', e: '#b96a48', en: 'Delivery Rider',   zh: '外卖骑手',           note: 'Knows every shortcut in a city that keeps changing.',             noteZh: '这座城天天在变，他记得每一条近路。' },
    { k: 'l6',  r: 40, c: '#f6d9dd', e: '#b6536a', en: 'Red Cloak',        zh: '红斗篷女孩',         note: 'Takes the long way through the woods on purpose.',                noteZh: '穿过树林时，她故意挑远的那条路。' },
    { k: 'l7',  r: 46, c: '#e6e0f2', e: '#7561a3', en: 'Alien Gentleman',  zh: '维多利亚绅士',       note: 'Dressed for a dinner party on a planet that no longer exists.',   noteZh: '为一场早已不存在的星球晚宴，盛装出席。' },
    { k: 'l8',  r: 52, c: '#dfe9d7', e: '#5c8455', en: 'Twist-horn Giant', zh: '弯角杂货巨人',       note: 'Carries a whole shop on his back, including the shopkeeper.',     noteZh: '背上驮着一整间杂货铺，连老板一起。' },
    { k: 'l9',  r: 58, c: '#d9e9ee', e: '#3f778a', en: 'The Engineer',     zh: '女工程师',           note: 'Fixes things nobody else admits are broken.',                      noteZh: '别人不肯承认坏了的东西，她来修。' },
    { k: 'l10', r: 65, c: '#e9f0d2', e: '#7a9540', en: 'Gucck Alien',      zh: '果克星人',           note: 'Came for the weather. Stayed for the noodles.',                   noteZh: '本来是来看天气的，为了这碗面留下了。' },
    { k: 'l11', r: 72, c: '#f2dfc2', e: '#b07a35', en: 'Old Zhang',        zh: '老张',               note: 'Points at something interesting just off the edge of the picture.', noteZh: '他总指着画面外头，说那儿有意思。' }
  ];

  var T = {
    en: {
      score: 'SCORE', best: 'BEST', subtitle: 'MERGE MUSEUM', collection: 'COLLECTION',
      loading: 'Waking up the tiny folks…',
      menuDesc: 'Drop a tiny folk. Two of a kind merge into something stranger. Fill the whole encyclopedia — if the pile stays below the line.',
      start: 'START PLAYING', howTo: 'MOVE to aim · TAP / CLICK to drop · ← → + SPACE on keyboard',
      collected: 'collected', bestShort: 'best', pileTop: 'THE PILE TOPPED OUT',
      again: 'PLAY AGAIN', revive: 'WATCH AD · CLEAR THE TOP', paused: 'PAUSED', resume: 'RESUME',
      collFoot: 'Every character is an original illustration from smallfigure.com',
      now: 'NOW', next: 'NEXT', hint: 'Two of a kind merge. Keep the pile low.',
      brandTag: 'ORIGINAL TINY FOLKS · MERGE & COLLECT', privacy: 'PRIVACY',
      itchLink: 'PLAY ON ITCH.IO',
      unlocked: 'NEW IN THE MUSEUM', complete: 'MUSEUM COMPLETE!', tooHigh: 'TOO HIGH!',
      adFail: 'No ad right now — try again later.', revived: 'Top cleared. Keep going!',
      newBest: 'NEW!'
    },
    zh: {
      score: '得分', best: '最高', subtitle: '合成图鉴', collection: '图鉴',
      loading: '正在叫醒这些小人…',
      menuDesc: '放下一个小人，两个一样的会合成一个更奇怪的。把整本图鉴收齐——前提是别让这堆东西越过红线。',
      start: '开始玩', howTo: '移动瞄准 · 点击投放 · 键盘 ← → 加空格',
      collected: '已收集', bestShort: '最高', pileTop: '堆到线上了',
      again: '再来一局', revive: '看广告 · 清掉顶层', paused: '已暂停', resume: '继续',
      collFoot: '每个小人都是 smallfigure.com 的原创插画',
      now: '当前', next: '下一个', hint: '两个相同的会合成，别堆太高。',
      brandTag: '原创小人 · 合成与收集', privacy: '隐私',
      itchLink: '去 itch.io 玩',
      unlocked: '图鉴新增', complete: '图鉴收齐了！', tooHigh: '太高了！',
      adFail: '暂时没有广告，稍后再试。', revived: '顶层清掉了，继续！',
      newBest: '新纪录'
    }
  };
  // Product rule: English is the default everywhere, Chinese is an explicit player choice.
  // The choice lives in localStorage only — never in the Playables cloud save, because the
  // official SDK requires getLanguage() to stay the single source of locale information.
  var LANG_KEY = 'sfmm-lang';
  var lang = 'en';
  var systemLang = '';   // ytgame.system.getLanguage() result, reference only
  var detailIndex = -1;

  function t(key) { return (T[lang] && T[lang][key]) || T.en[key] || key; }
  function readLangPref() {
    try { return localStorage.getItem(LANG_KEY) === 'zh' ? 'zh' : 'en'; } catch (e) { return 'en'; }
  }
  function updateLangControls() {
    var chip = $('btnLang');
    chip.textContent = lang === 'zh' ? '中' : 'EN';
    chip.title = lang === 'zh' ? 'Switch to English' : '切换为中文';
    chip.setAttribute('aria-label', chip.title + (systemLang ? ' · system: ' + systemLang : ''));
    $('btnMenuLang').textContent = lang === 'zh' ? 'Switch to English' : '切换为中文';
  }
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    var nodes = document.querySelectorAll('[data-t]');
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = t(nodes[i].getAttribute('data-t'));
    var titled = document.querySelectorAll('[data-t-title]');
    for (var j = 0; j < titled.length; j++) titled[j].title = t(titled[j].getAttribute('data-t-title'));
    updateLangControls();
    // refresh screens whose text was generated at runtime
    if (!$('collection').hidden) renderCollection();
    if (!$('detail').hidden && detailIndex >= 0) {
      var c = CHAIN[detailIndex];
      $('detailName').textContent = lang === 'zh' ? c.zh : c.en;
      $('detailNote').textContent = lang === 'zh' ? c.noteZh : c.note;
    }
    elToast.hidden = true;
  }
  function setLang(next) {
    lang = next === 'zh' ? 'zh' : 'en';
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    applyLang();
  }

  // ---- Platform adapter -------------------------------------------------
  // One gameplay codebase, several packages. Whichever SDK the host page injected wins;
  // with none of them (itch.io / local preview) ads are simply absent.
  function poki() { return (typeof window.PokiSDK !== 'undefined') ? window.PokiSDK : null; }
  function crazy() {
    try {
      if (window.CrazyGames && window.CrazyGames.SDK) return window.CrazyGames.SDK;
      if (window.CrazyGames && window.CrazyGames.CrazySDK) return window.CrazyGames.CrazySDK.getInstance();
    } catch (e) {}
    return null;
  }
  function crazyGame() { var c = crazy(); return (c && c.game) ? c.game : c; }
  function callIf(obj, name) { try { if (obj && typeof obj[name] === 'function') obj[name](); } catch (e) {} }

  var S = {
    firstFrame: function () { try { if (YT) ytgame.game.firstFrameReady(); } catch (e) {} },
    ready: function () { try { if (YT) ytgame.game.gameReady(); } catch (e) {} },
    _sdkReady: true, _assetsReady: false, _loadingSent: false,
    init: function () {
      if (YT) return;
      if (poki()) {
        S._sdkReady = false;
        try {
          Promise.resolve(poki().init()).catch(function () {}).then(function () {
            S._sdkReady = true; S.tryLoadingFinished();
          });
        } catch (e) { S._sdkReady = true; }
      }
      if (crazy()) { try { Promise.resolve(crazy().init()).catch(function () {}); } catch (e) {} }
    },
    tryLoadingFinished: function () {
      if (YT || S._loadingSent || !S._sdkReady || !S._assetsReady) return;
      S._loadingSent = true;
      callIf(poki(), 'gameLoadingFinished');
      callIf(crazyGame(), 'loadingStop');
    },
    loadingFinished: function () { S._assetsReady = true; S.tryLoadingFinished(); },
    gameplay: function (on) {
      if (YT) return;
      callIf(poki(), on ? 'gameplayStart' : 'gameplayStop');
      callIf(crazyGame(), on ? 'gameplayStart' : 'gameplayStop');
    },
    hasAds: function () { return YT || !!poki() || !!crazy(); },
    load: async function () {
      if (!YT) { try { return localStorage.getItem('sfmm-save') || ''; } catch (e) { return ''; } }
      try { return await ytgame.game.loadData() || ''; } catch (e) { return ''; }
    },
    save: async function (str) {
      if (!YT) { try { localStorage.setItem('sfmm-save', str); } catch (e) {} return; }
      try { await ytgame.game.saveData(str); } catch (e) {}
    },
    score: function (v) {
      try { if (YT) ytgame.engagement.sendScore({ value: Math.floor(v) }); } catch (e) {}
    },
    audio: function () { try { return YT ? !!ytgame.system.isAudioEnabled() : true; } catch (e) { return true; } },
    onAudio: function (cb) { try { if (YT) ytgame.system.onAudioEnabledChange(cb); } catch (e) {} },
    onPause: function (cb) { try { if (YT) ytgame.system.onPause(cb); } catch (e) {} },
    onResume: function (cb) { try { if (YT) ytgame.system.onResume(cb); } catch (e) {} },
    language: async function () {
      // Official API only, reference-only: it never overrides the English default or a
      // language the player picked. No navigator.language fallback in production.
      if (!YT) return '';
      try { var v = await ytgame.system.getLanguage(); return typeof v === 'string' ? v : ''; } catch (e) { return ''; }
    },
    interstitial: function () {
      // Natural break only. Fire-and-forget: never block the game loop waiting for an ad.
      if (YT) { try { Promise.resolve(ytgame.ads.requestInterstitialAd()).catch(function () {}); } catch (e) {} return; }
      if (poki()) { try { Promise.resolve(poki().commercialBreak()).catch(function () {}); } catch (e) {} return; }
      var c = crazy();
      if (c) {
        try {
          var noop = function () {};
          if (c.ad && typeof c.ad.requestAd === 'function') c.ad.requestAd('midgame', { adStarted: noop, adFinished: noop, adError: noop });
          else if (typeof c.requestAd === 'function') c.requestAd('midgame');
        } catch (e) {}
      }
    },
    rewarded: async function (id) {
      if (YT) { try { return await ytgame.ads.requestRewardedAd(id) === true; } catch (e) { return false; } }
      if (poki()) { try { return await poki().rewardedBreak() === true; } catch (e) { return false; } }
      var c = crazy();
      if (c) {
        try {
          return await new Promise(function (res) {
            var settled = false;
            var fin = function (v) { if (!settled) { settled = true; res(v); } };
            var opts = { adStarted: function () {}, adFinished: function () { fin(true); }, adError: function () { fin(false); } };
            if (c.ad && typeof c.ad.requestAd === 'function') c.ad.requestAd('rewarded', opts);
            else if (typeof c.requestAd === 'function') c.requestAd('rewarded', opts);
            else { fin(false); return; }
            setTimeout(function () { fin(false); }, 25000);
          });
        } catch (e) { return false; }
      }
      return false; // no ad platform: the revive button is hidden
    }
  };

  // ---- DOM ----
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('board'), ctx = canvas.getContext('2d');
  var elScore = $('scoreVal'), elBest = $('bestVal'), elToast = $('toast');
  var elLoading = $('loading'), elMenu = $('menu'), elOver = $('over'), elPaused = $('paused');
  var elCollection = $('collection'), elDetail = $('detail');

  var dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  var imgs = CHAIN.map(function (c) { var im = new Image(); im.src = 'sprites/' + c.k + '.webp'; return im; });
  function imagesReady() {
    return Promise.all(imgs.map(function (im) {
      if (im.complete && im.naturalWidth > 0) return Promise.resolve();
      return new Promise(function (res) {
        var done = false;
        var fin = function () { if (!done) { done = true; res(); } };
        im.addEventListener('load', fin);
        im.addEventListener('error', fin);
        setTimeout(fin, 3000); // never let a missing sprite stall the boot sequence
      });
    }));
  }

  // ---- state ----
  var state = 'menu'; // menu | playing | paused | over
  var balls = [], parts = [], floats = [];
  var score = 0, best = 0, combo = 0, comboT = 0, dangerT = 0, cooldown = 0;
  var aimX = W / 2, cur = 0, nxt = 1, dropCount = 0;
  var raf = 0, lastTs = 0, acc = 0;
  var save = { best: 0, unlocked: [0, 1, 2], plays: 0 }, saveLoaded = false;
  var audioOn = true, actx = null;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function pickLvl() { var r = Math.random(); return r < 0.52 ? 0 : (r < 0.86 ? 1 : 2); }

  // ---- progress (cloud save in Playables, localStorage locally) ----
  async function initSave() {
    var raw = '';
    try { raw = await S.load(); } catch (e) {}
    if (raw) {
      try {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object') {
          save.best = Math.max(0, Math.floor(o.best) || 0);
          save.plays = Math.max(0, Math.floor(o.plays) || 0);
          if (Array.isArray(o.unlocked)) save.unlocked = o.unlocked.filter(function (n) {
            return Number.isInteger(n) && n >= 0 && n < CHAIN.length;
          });
        }
      } catch (e) {}
    }
    for (var i = 0; i < 3; i++) if (save.unlocked.indexOf(i) < 0) save.unlocked.push(i);
    best = save.best;
    // loadData has resolved: saveData is now allowed.
    saveLoaded = true;
    syncHud();
  }
  function persist() {
    if (!saveLoaded) return;
    save.best = Math.max(save.best, best);
    var str = JSON.stringify(save);
    S.save(str);
    if (save.best > 0) S.score(save.best); // keep sendScore identical to the stored best
  }
  function unlock(i) {
    if (i < 0 || i >= CHAIN.length || save.unlocked.indexOf(i) >= 0) return;
    save.unlocked.push(i);
    persist();
    toast(t('unlocked') + ' · ' + (lang === 'zh' ? CHAIN[i].zh : CHAIN[i].en));
    sfx.unlock();
  }

  // ---- audio: synthesised in code, no audio files, no external requests ----
  function tone(freq, dur, type, vol) {
    if (!audioOn || state === 'paused') return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, actx.currentTime);
      g.gain.exponentialRampToValueAtTime(vol || 0.07, actx.currentTime + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + dur + 0.02);
    } catch (e) {}
  }
  var sfx = {
    drop: function () { tone(200, 0.09, 'sine', 0.045); },
    merge: function (l) { tone(300 + l * 52, 0.15, 'triangle', 0.075); },
    unlock: function () { tone(680, 0.2, 'sine', 0.055); },
    over: function () { tone(150, 0.36, 'sawtooth', 0.04); }
  };

  // ---- game objects ----
  function makeBall(lvl, x, y) {
    return {
      lvl: lvl, x: x, y: y, vx: 0, vy: 0, r: CHAIN[lvl].r,
      age: 0, pop: 0, dead: false, rot: (Math.random() - 0.5) * 0.18
    };
  }
  function burst(x, y, color) {
    for (var i = 0; i < 9; i++) {
      var a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 150;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.55 + Math.random() * 0.3, c: color });
    }
  }
  function doMerge(m) {
    var lvl = m.lvl;
    combo = comboT > 0 ? combo + 1 : 1;
    comboT = 1.15;
    var mul = Math.min(5, 1 + (combo - 1) * 0.5);
    var gain = Math.round((lvl + 1) * (lvl + 1) * 5 * mul);
    score += gain;
    floats.push({ x: m.x, y: m.y - 10, text: '+' + gain + (combo > 1 ? '  x' + combo : ''), life: 1 });
    burst(m.x, m.y, CHAIN[Math.min(lvl, CHAIN.length - 1)].e);
    sfx.merge(Math.min(lvl, 10));
    if (lvl >= CHAIN.length) {
      // two top-tier folks: huge bonus, encyclopedia complete
      score += 2000;
      floats.push({ x: W / 2, y: 300, text: t('complete'), life: 1.6 });
      for (var u = 0; u < CHAIN.length; u++) unlock(u);
      syncHud();
      return;
    }
    unlock(lvl);
    var b = makeBall(lvl, clamp(m.x, WALL + CHAIN[lvl].r, W - WALL - CHAIN[lvl].r), clamp(m.y, TOP, FLOOR - CHAIN[lvl].r));
    b.vy = -70; b.pop = 0.26;
    balls.push(b);
    if (score > best) best = score;
    syncHud();
  }

  // ---- physics ----
  function physics(dt) {
    var i, j, b;
    for (i = 0; i < balls.length; i++) {
      b = balls[i];
      b.age += dt;
      if (b.pop > 0) b.pop = Math.max(0, b.pop - dt);
      b.vy += GRAV * dt;
      b.vx *= 0.992;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < WALL + b.r) { b.x = WALL + b.r; b.vx = Math.abs(b.vx) * 0.34; }
      if (b.x > W - WALL - b.r) { b.x = W - WALL - b.r; b.vx = -Math.abs(b.vx) * 0.34; }
      if (b.y > FLOOR - b.r) {
        b.y = FLOOR - b.r;
        b.vy = -Math.abs(b.vy) * 0.2;
        if (Math.abs(b.vy) < 26) b.vy = 0;
        b.vx *= 0.86;
      }
    }
    var merges = [];
    for (var it = 0; it < 3; it++) {
      for (i = 0; i < balls.length; i++) {
        var a = balls[i];
        if (a.dead) continue;
        for (j = i + 1; j < balls.length; j++) {
          b = balls[j];
          if (b.dead) continue;
          var dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r;
          var d2 = dx * dx + dy * dy;
          if (d2 >= min * min) continue;
          var d = Math.sqrt(d2) || 0.001;
          if (it === 0 && a.lvl === b.lvl && a.age > 0.12 && b.age > 0.12 && a.pop <= 0 && b.pop <= 0) {
            a.dead = b.dead = true;
            merges.push({ lvl: a.lvl + 1, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
            continue;
          }
          var nx = dx / d, ny = dy / d, push = (min - d) * 0.5;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
          var rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) {
            var imp = -rel * 0.18;
            a.vx -= nx * imp; a.vy -= ny * imp;
            b.vx += nx * imp; b.vy += ny * imp;
          }
        }
      }
    }
    if (merges.length) {
      balls = balls.filter(function (o) { return !o.dead; });
      for (i = 0; i < merges.length; i++) doMerge(merges[i]);
    }
    for (i = 0; i < balls.length; i++) {
      b = balls[i];
      var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (sp > 900) { b.vx *= 900 / sp; b.vy *= 900 / sp; }
    }
  }
  function checkDanger(dt) {
    var over = false;
    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      if (b.age > 0.9 && b.y - b.r < DANGER && Math.abs(b.vy) < 90) { over = true; break; }
    }
    dangerT = over ? dangerT + dt : Math.max(0, dangerT - dt * 1.8);
    if (dangerT > 1.8) gameOver();
  }
  function updateFx(dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 320 * dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    for (var j = floats.length - 1; j >= 0; j--) {
      var f = floats[j];
      f.life -= dt * 1.1; f.y -= 32 * dt;
      if (f.life <= 0) floats.splice(j, 1);
    }
  }

  // ---- drawing ----
  function drawBall(b, alpha) {
    var c = CHAIN[b.lvl], r = b.r;
    var s = b.pop > 0 ? 0.55 + 0.45 * (1 - b.pop / 0.26) : 1;
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot);
    ctx.scale(s, s);
    var g = ctx.createRadialGradient(-r * 0.32, -r * 0.42, r * 0.08, 0, 0, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, c.c);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2.2; ctx.strokeStyle = c.e; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.stroke();
    var im = imgs[b.lvl], sz = r * 1.72;
    if (im && im.complete && im.naturalWidth) ctx.drawImage(im, -sz / 2, -sz / 2, sz, sz);
    else { ctx.fillStyle = c.e; ctx.font = 'bold ' + Math.round(r) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 0, 0); }
    ctx.restore();
  }
  function draw() {
    ctx.fillStyle = '#f6efdf';
    ctx.fillRect(0, 0, W, H);
    // faint paper dots
    ctx.fillStyle = 'rgba(150,130,95,.10)';
    for (var y = 18; y < H; y += 36) for (var x = 18; x < W; x += 36) ctx.fillRect(x, y, 2, 2);
    // walls + floor
    ctx.fillStyle = '#e7dcc4';
    ctx.fillRect(0, 0, WALL, H); ctx.fillRect(W - WALL, 0, WALL, H); ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.strokeStyle = '#cbb99a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(WALL, 0); ctx.lineTo(WALL, FLOOR); ctx.lineTo(W - WALL, FLOOR); ctx.lineTo(W - WALL, 0); ctx.stroke();
    // danger line
    var hot = clamp(dangerT / 1.8, 0, 1);
    ctx.save();
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = hot > 0 ? 'rgba(196,72,52,' + (0.45 + hot * 0.5) + ')' : 'rgba(180,120,90,.45)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(WALL + 4, DANGER); ctx.lineTo(W - WALL - 4, DANGER); ctx.stroke();
    ctx.restore();
    if (hot > 0.15) {
      ctx.fillStyle = 'rgba(196,72,52,' + (0.35 + hot * 0.5) + ')';
      ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(t('tooHigh'), W / 2, DANGER - 10);
    }
    // aim guide + ghost ball
    if (state === 'playing') {
      ctx.save();
      ctx.setLineDash([4, 9]);
      ctx.strokeStyle = 'rgba(90,80,60,.28)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(aimX, TOP + 6); ctx.lineTo(aimX, FLOOR); ctx.stroke();
      ctx.restore();
      drawBall({ lvl: cur, x: aimX, y: TOP, r: CHAIN[cur].r, rot: 0, pop: 0 }, 0.72);
    }
    for (var i = 0; i < balls.length; i++) drawBall(balls[i]);
    for (var p = 0; p < parts.length; p++) {
      var q = parts[p];
      ctx.globalAlpha = clamp(q.life, 0, 1);
      ctx.fillStyle = q.c;
      ctx.beginPath(); ctx.arc(q.x, q.y, 3.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (var f = 0; f < floats.length; f++) {
      var o = floats[f];
      ctx.globalAlpha = clamp(o.life, 0, 1);
      ctx.fillStyle = '#b6533c'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(o.text, o.x, o.y);
    }
    ctx.globalAlpha = 1;
  }
  function loop(ts) {
    var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0);
    lastTs = ts;
    if (state === 'playing') {
      acc += dt;
      while (acc >= STEP) {
        physics(STEP);
        checkDanger(STEP);
        updateFx(STEP);
        acc -= STEP;
        if (state !== 'playing') break;
      }
      cooldown = Math.max(0, cooldown - dt);
      comboT = Math.max(0, comboT - dt);
      if (comboT <= 0) combo = 0;
    }
    draw();
    raf = requestAnimationFrame(loop);
  }
  function startLoop() { if (raf) return; lastTs = performance.now(); acc = 0; raf = requestAnimationFrame(loop); }
  function stopLoop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  // ---- HUD / screens ----
  function syncHud() {
    elScore.textContent = String(score);
    elBest.textContent = String(Math.max(best, save.best));
    $('menuBest').textContent = String(Math.max(best, save.best));
    $('menuProgress').textContent = save.unlocked.length + ' / ' + CHAIN.length;
  }
  function show(id, on) { $(id).hidden = !on; }
  function toast(msg) {
    elToast.textContent = msg;
    elToast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { elToast.hidden = true; }, 1800);
  }
  function updateNext() {
    $('curImg').src = 'sprites/' + CHAIN[cur].k + '.webp';
    $('nxtImg').src = 'sprites/' + CHAIN[nxt].k + '.webp';
  }
  function startGame() {
    balls = []; parts = []; floats = [];
    score = 0; combo = 0; comboT = 0; dangerT = 0; cooldown = 0; dropCount = 0;
    cur = pickLvl(); nxt = pickLvl();
    updateNext(); syncHud();
    show('menu', false); show('over', false); show('paused', false);
    show('collection', false); show('detail', false);
    state = 'playing';
    S.gameplay(true);
    startLoop();
  }
  function gameOver() {
    if (state !== 'playing') return;
    state = 'over';
    S.gameplay(false);
    sfx.over();
    save.plays += 1;
    var isBest = score > save.best;
    save.best = Math.max(save.best, score);
    best = Math.max(best, score);
    persist();
    $('overScore').textContent = String(score);
    $('overBest').textContent = String(save.best);
    $('newBest').hidden = !isBest;
    show('over', true);
    syncHud();
    // Interstitial at a natural break, at most every other run. Never awaited.
    if (save.plays % 2 === 0) S.interstitial();
  }
  var resumeTo = 'playing';
  function pauseGame() {
    if (state === 'paused') return;
    resumeTo = state;
    state = 'paused';
    S.gameplay(false);
    stopLoop(); // SDK requirement: stop the loop, rendering and audio entirely
    persist();
    show('paused', true);
  }
  function resumeGame() {
    if (state !== 'paused') return;
    show('paused', false);
    state = resumeTo;
    if (state === 'playing') S.gameplay(true);
    startLoop();
  }
  function renderCollection() {
    var grid = $('collGrid');
    grid.innerHTML = '';
    CHAIN.forEach(function (c, i) {
      var unlocked = save.unlocked.indexOf(i) >= 0;
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'coll-card' + (unlocked ? '' : ' locked');
      el.setAttribute('data-lv', String(i));
      if (unlocked) {
        el.innerHTML = '<span class="cc-lv">LV ' + (i + 1) + '</span><img src="sprites/' + c.k + '.webp" alt=""><span class="cc-name">' + (lang === 'zh' ? c.zh : c.en) + '</span>';
        el.addEventListener('click', function () { showDetail(i); });
      } else {
        el.innerHTML = '<span class="cc-lv">LV ' + (i + 1) + '</span><span class="cc-q">?</span><span class="cc-name">???</span>';
      }
      grid.appendChild(el);
    });
    $('collProgress').textContent = save.unlocked.length + ' / ' + CHAIN.length;
  }
  function showDetail(i) {
    detailIndex = i;
    var c = CHAIN[i];
    $('detailName').textContent = lang === 'zh' ? c.zh : c.en;
    $('detailLv').textContent = 'LV ' + (i + 1);
    $('detailImg').src = 'sprites/' + c.k + '.webp';
    $('detailNote').textContent = lang === 'zh' ? c.noteZh : c.note;
    show('collection', false);
    show('detail', true);
  }

  // ---- input ----
  function logicalX(e) {
    var r = canvas.getBoundingClientRect();
    return (e.clientX - r.left) / r.width * W;
  }
  canvas.addEventListener('pointermove', function (e) { aimX = clamp(logicalX(e), WALL + 20, W - WALL - 20); });
  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    aimX = clamp(logicalX(e), WALL + 20, W - WALL - 20);
    drop(aimX);
  });
  canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  function drop(x) {
    if (state !== 'playing' || cooldown > 0) return;
    var lvl = cur;
    var b = makeBall(lvl, clamp(x, WALL + CHAIN[lvl].r, W - WALL - CHAIN[lvl].r), TOP);
    b.vy = 40;
    balls.push(b);
    cur = nxt; nxt = pickLvl();
    dropCount += 1; cooldown = 0.40;
    updateNext(); sfx.drop();
  }
  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { aimX = clamp(aimX - 16, WALL + 20, W - WALL - 20); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { aimX = clamp(aimX + 16, WALL + 20, W - WALL - 20); e.preventDefault(); }
    else if (e.key === ' ' || e.key === 'Enter') { drop(aimX); e.preventDefault(); }
  });

  // ---- buttons ----
  $('btnLang').addEventListener('click', function () { setLang(lang === 'zh' ? 'en' : 'zh'); });
  $('btnMenuLang').addEventListener('click', function () { setLang(lang === 'zh' ? 'en' : 'zh'); });
  $('btnStart').addEventListener('click', startGame);
  $('btnAgain').addEventListener('click', startGame);
  $('btnResume').addEventListener('click', resumeGame);
  $('btnCollection').addEventListener('click', function () { renderCollection(); show('collection', true); });
  $('btnOverCollection').addEventListener('click', function () { renderCollection(); show('over', false); show('collection', true); });
  $('btnCollClose').addEventListener('click', function () { show('collection', false); });
  $('btnDetailClose').addEventListener('click', function () { show('detail', false); renderCollection(); show('collection', true); });
  $('btnPause').addEventListener('click', function () { state === 'paused' ? resumeGame() : pauseGame(); });
  $('btnSound').addEventListener('click', function () {
    audioOn = !audioOn;
    $('btnSound').classList.toggle('off', !audioOn);
  });
  $('btnRevive').addEventListener('click', async function () {
    var ok = await S.rewarded('sfmm-revive-top-row');
    if (!ok) { toast(t('adFail')); return; }
    balls.sort(function (a, b) { return a.y - b.y; });
    balls.splice(0, Math.min(4, balls.length));
    dangerT = 0;
    show('over', false);
    state = 'playing';
    startLoop();
    toast(t('revived'));
  });

  // ---- Playables lifecycle ----
  S.onPause(pauseGame);
  S.onResume(resumeGame);
  S.onAudio(function (enabled) { audioOn = !!enabled; });
  audioOn = S.audio();
  if (YT) {
    // YouTube supplies the system mute control; the game must not show its own global one.
    var locals = document.querySelectorAll('.local-only');
    for (var i = 0; i < locals.length; i++) locals[i].remove();
  }

  function resize() {
    // 880 = frame height (868) + a little breathing room so no viewport clips the border
    var s = Math.min(window.innerWidth / 420, window.innerHeight / 880, 1.25);
    $('app').style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  }
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  // ---- boot: firstFrameReady while the loading screen is visible,
  //           gameReady only once the menu is interactive. ----
  S.firstFrame();
  S.init();
  Promise.all([imagesReady(), initSave(), S.language()]).then(function (res) {
    systemLang = res[2] || '';
    lang = readLangPref(); // English unless this player explicitly chose Chinese before
    applyLang();
    syncHud();
    show('loading', false);
    show('menu', true);
    $('btnRevive').hidden = !S.hasAds(); // never show a "watch an ad" button that does nothing
    S.ready();
    S.loadingFinished();
    draw();
    startLoop(); // renders the empty board behind the menu; physics only runs in `playing`
  });
})();

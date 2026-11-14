/* Smallfigure: Echo Museum
 * A grid puzzle about waiting for yourself. Pure JS, zero network calls.
 * Platform SDKs (YouTube Playables / Poki / CrazyGames) are optional and injected at build time.
 */
(function () {
  'use strict';

  var C = window.EchoCore;
  var YT = (typeof window.ytgame !== 'undefined') && window.ytgame.IN_PLAYABLES_ENV === true;
  var $ = function (id) { return document.getElementById(id); };
  var W = 420, H = 560, CELL = 48, OX = 18, OY = 40, COLS = 8, ROWS = 10;

  var T = {
    en: {
      subtitle: 'ECHO MUSEUM', level: 'LEVEL', step: 'STEP', echo: 'ECHOES', shard: 'SHARDS',
      tagline: 'A PUZZLE ABOUT WAITING FOR YOURSELF',
      menuDesc: 'Every step you take is remembered. Freeze a walk and it becomes an echo that replays beside you — and then stands still. Leave an echo on a plate to hold a door open, and walk past everyone you used to be.',
      start: 'START PLAYING', howTo: 'ARROWS / SWIPE to move · WAIT to let echoes catch up · FREEZE to leave one behind',
      cleared: 'rooms opened', wait: 'WAIT', freeze: 'FREEZE', freezeSub: 'leave an echo',
      undo: 'UNDO', reset: 'RESET', hint: 'HINT', next: 'NEXT ROOM', replay: 'REPLAY THIS ROOM',
      roomOpen: 'A ROOM OPENS', again: 'PLAY FROM THE START', levels: 'ROOMS', howTitle: 'HOW TO PLAY',
      otherGame: 'ALSO: MERGE MUSEUM', brandTag: 'ORIGINAL TINY FOLKS · ECHOES & ROOMS',
      privacy: 'PRIVACY', itchLink: 'PLAY ON ITCH.IO',
      collFoot: 'Every character is an original illustration from smallfigure.com',
      allClear: 'THE MUSEUM IS AWAKE', allClearTitle: 'All eleven are here.',
      allClearDesc: 'Old Zhang points at something just off the edge of the picture. You have been everyone in this room.',
      levelWord: 'ROOM', stepsUsed: 'steps', echoesLeft: 'echoes', shardsWord: 'shards',
      perfect: 'PERFECT — every shard found', clearSimple: 'Room cleared.',
      noEcho: 'Walk a few steps first, then FREEZE.',
      blocked: 'That way is closed.', doorShut: 'The door needs every plate held down.',
      doorOpenLabel: 'DOOR OPEN', doorShutLabel: 'DOOR CLOSED',
      frozen: 'An echo stays behind. You start again from the doorway.',
      undoNone: 'Nothing to undo.', resetDone: 'Room reset.',
      hintTitle: 'HINT', locked: 'LOCKED', clearedMark: 'OPEN',
      helpHTML: '<p><b>The idea.</b> Each step you take is recorded. Press <span class="k">FREEZE</span> and that whole walk becomes an <b>echo</b>: it replays your steps from the start of the room, then stands still at the place you stopped.</p>' +
        '<p><b>The trick.</b> A door opens only while <b>every plate</b> has someone standing on it. You cannot stand on a plate and walk through the door at the same time. But an echo can stay behind and hold it for you.</p>' +
        '<p><b>Waiting matters.</b> Echoes move when you move — one step for one step. Press <span class="k">WAIT</span> to stand still while your echoes keep walking. Sometimes the whole puzzle is just letting your past catch up.</p>' +
        '<p><b>Controls.</b> <span class="k">↑ ↓ ← →</span> or swipe to move · <span class="k">SPACE</span> / <span class="k">WAIT</span> to wait · <span class="k">F</span> / <span class="k">FREEZE</span> to leave an echo · <span class="k">Z</span> undo · <span class="k">R</span> reset · <span class="k">H</span> hint.</p>' +
        '<p><b>Shards.</b> Small diamonds are optional. Collect them all in a room for a perfect clear.</p>' +
        '<p>Every character here is an original illustration from smallfigure.com. No installs, no accounts, no timers.</p>',
      done: 'DONE', frozenMark: 'HELD', stepNow: 'NOW'
    },
    zh: {
      subtitle: '回声博物馆', level: '第几间', step: '步数', echo: '回声', shard: '碎片',
      tagline: '一个关于等自己的谜题',
      menuDesc: '你走过的每一步都会被记住。按「定格」，这一趟路就变成一个回声：它会从头重走一遍，然后停在你停下的地方。把回声留在机关上替你踩着门，再从每一个过去的自己身边走过去。',
      start: '开始玩', howTo: '方向键 / 滑动移动 · 「等一等」让回声赶上来 · 「定格」留下一个自己',
      cleared: '间屋子已打开', wait: '等一等', freeze: '定格', freezeSub: '留下一个回声',
      undo: '撤销', reset: '重来', hint: '提示', next: '下一间', replay: '再走一次',
      roomOpen: '又开了一间', again: '从头再玩', levels: '房间', howTitle: '怎么玩',
      otherGame: '另一个游戏：合成图鉴', brandTag: '原创小人 · 回声与房间',
      privacy: '隐私', itchLink: '去 itch.io 玩',
      collFoot: '每个小人都是 smallfigure.com 的原创插画',
      allClear: '整座博物馆醒了', allClearTitle: '十一个小人，都在这儿了。',
      allClearDesc: '老张还指着画面外头，说那儿有意思。这间屋子里的每一个人，你都当过。',
      levelWord: '第', stepsUsed: '步', echoesLeft: '个回声', shardsWord: '片碎片',
      perfect: '完美 — 碎片全找到了', clearSimple: '这间走通了。',
      noEcho: '先走几步，再按「定格」。',
      blocked: '那边走不通。', doorShut: '门要所有机关都被踩住才开。',
      doorOpenLabel: '门开了', doorShutLabel: '门关着',
      frozen: '留下了一个回声。你从门口重新出发。',
      undoNone: '没有可以撤销的了。', resetDone: '这间重置了。',
      hintTitle: '提示', locked: '未解锁', clearedMark: '已打开',
      helpHTML: '<p><b>核心。</b>你走的每一步都会被记下来。按 <span class="k">定格</span>，这一整趟路就变成一个<b>回声</b>：它会从房间起点重走一遍，然后停在你停下的那一格。</p>' +
        '<p><b>关键。</b>只有<b>每块机关</b>都有人站着，门才开。你不可能一边踩着机关一边穿门，但回声可以替你留在那儿。</p>' +
        '<p><b>「等」是有用的。</b>你走一步，回声也走一步。按 <span class="k">等一等</span>，你不动、回声继续走。有些关卡的全部解法，就是让过去的自己先赶上来。</p>' +
        '<p><b>操作。</b><span class="k">↑ ↓ ← →</span> 或滑动移动 · <span class="k">空格</span> / <span class="k">等一等</span> 原地等 · <span class="k">F</span> / <span class="k">定格</span> 留下回声 · <span class="k">Z</span> 撤销 · <span class="k">R</span> 重来 · <span class="k">H</span> 提示。</p>' +
        '<p><b>碎片。</b>小菱形是可选的。一间屋子里全捡到，算完美通关。</p>' +
        '<p>每个小人都是 smallfigure.com 的原创插画。不用装、不用登录、没有倒计时。</p>',
      done: '完成', frozenMark: '停驻', stepNow: '此刻'
    }
  };

  // ---------- state ----------
  var lang = 'en', level = 0, g = null, st = null, history = [], mode = 'menu';
  var unlocked = 1, cleared = {}, best = {}, soundOn = true, toastTimer = null;
  var imgs = {}, imgsReady = false, actx = null, raf = null, flash = 0, shake = 0, winGlow = 0;
  var SAVE_KEY = 'sfem-save-v1';

  function t(k) { return (T[lang] && T[lang][k]) || T.en[k] || k; }

  function loadSave() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      var o = JSON.parse(raw);
      unlocked = Math.max(1, Math.min(C.LEVELS.length, o.unlocked || 1));
      cleared = o.cleared || {}; best = o.best || {};
      if (o.lang === 'zh' || o.lang === 'en') lang = o.lang;
      if (typeof o.sound === 'boolean') soundOn = o.sound;
    } catch (e) {}
  }
  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ unlocked: unlocked, cleared: cleared, best: best, lang: lang, sound: soundOn }));
    } catch (e) {}
    try { if (YT && window.ytgame.game && window.ytgame.game.saveData) window.ytgame.game.saveData(JSON.stringify({ unlocked: unlocked, cleared: cleared, best: best })); } catch (e) {}
  }

  // ---------- audio (synthesised, no files) ----------
  function tone(freq, dur, type, vol, delay) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var o = actx.createOscillator(), gn = actx.createGain(), now = actx.currentTime + (delay || 0);
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, now);
      gn.gain.setValueAtTime(0.0001, now);
      gn.gain.exponentialRampToValueAtTime(vol || 0.05, now + 0.012);
      gn.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(gn); gn.connect(actx.destination); o.start(now); o.stop(now + dur + 0.02);
    } catch (e) {}
  }
  var SFX = {
    move: function () { tone(320, 0.07, 'triangle', 0.028); },
    wait: function () { tone(190, 0.11, 'sine', 0.03); },
    freeze: function () { tone(392, 0.18, 'sine', 0.05); tone(523, 0.22, 'sine', 0.04, 0.08); tone(659, 0.28, 'sine', 0.035, 0.16); },
    plate: function () { tone(880, 0.16, 'sine', 0.045); tone(1174, 0.2, 'sine', 0.03, 0.06); },
    shard: function () { tone(1046, 0.12, 'triangle', 0.05); tone(1568, 0.16, 'sine', 0.035, 0.07); },
    blocked: function () { tone(140, 0.09, 'square', 0.018); },
    win: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.3, 'sine', 0.05, i * 0.11); }); },
    click: function () { tone(440, 0.05, 'sine', 0.02); }
  };

  // ---------- i18n ----------
  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    var nodes = document.querySelectorAll('[data-t]');
    for (var i = 0; i < nodes.length; i++) {
      var k = nodes[i].getAttribute('data-t');
      if (T[lang][k] !== undefined) nodes[i].textContent = T[lang][k];
    }
    $('btnLang').textContent = lang === 'zh' ? '中' : 'EN';
    $('btnLang').title = lang === 'zh' ? 'Switch to English' : '切换为中文';
    $('btnSound').classList.toggle('off', !soundOn);
    $('helpBody').innerHTML = t('helpHTML');
    updateHUD(); updateTimeline(); renderLevelGrid();
  }

  // ---------- sprites ----------
  function loadSprites(done) {
    var left = C.FOLKS.length, loaded = 0;
    C.FOLKS.forEach(function (f) {
      var im = new Image();
      im.onload = im.onerror = function () { loaded++; if (loaded === left) { imgsReady = true; done(); } };
      im.src = 'sprites/' + f.k + '.webp';
      imgs[f.k] = im;
    });
  }
  function folkImg(i) { return imgs[C.FOLKS[i] ? C.FOLKS[i].k : 'l1']; }

  // ---------- helpers ----------
  function cellCenter(p) { return { x: OX + p.x * CELL + CELL / 2, y: OY + p.y * CELL + CELL / 2 }; }
  function pushHistory() { history.push(JSON.parse(JSON.stringify(st))); if (history.length > 200) history.shift(); }
  function toast(msg, ms) {
    var el = $('toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, ms || 2600);
  }
  function overlay(id, show) {
    $(id).hidden = !show;
    var ctrls = document.querySelector('.controls');
    if (ctrls) {
      var busy = ['menu', 'clear', 'allclear', 'help', 'levels'].some(function (k) { return !$(k).hidden; });
      ctrls.classList.toggle('idle', busy);
    }
  }

  // ---------- HUD / timeline ----------
  function updateHUD() {
    if (!st || !g) return;
    $('mLevel').textContent = String(level + 1).padStart(2, '0');
    $('mStep').textContent = String(st.t).padStart(2, '0');
    $('mEcho').textContent = st.echoes.length;
    $('mEcho').classList.toggle('hot', st.echoes.length > 0);
    $('mShard').textContent = C.shardCount(g, st) + '/' + C.shardTotal(g);
    $('mShard').classList.toggle('hot', C.shardTotal(g) > 0 && C.shardCount(g, st) === C.shardTotal(g));
    $('menuProgress').textContent = Object.keys(cleared).length + ' / ' + C.LEVELS.length;
  }
  function updateTimeline() {
    var box = $('timeline');
    if (!st || !g || mode !== 'play') { box.innerHTML = '<span class="tl-label">' + t('step') + '</span><span class="tl-empty">—</span>'; return; }
    var maxLen = Math.max(12, st.t + 1);
    st.echoes.forEach(function (e) { maxLen = Math.max(maxLen, e.length); });
    var html = '<span class="tl-label">' + t('step') + ' ' + String(st.t).padStart(2, '0') + '</span><div class="tl-track">';
    var total = Math.min(maxLen, 34);
    for (var i = 0; i < total; i++) {
      var cls = 'tl-cell';
      if (i < st.t) cls += ' done';
      else if (i === st.t) cls += ' now';
      html += '<span class="' + cls + '"></span>';
    }
    html += '</div>';
    if (st.echoes.length) {
      var held = 0;
      st.echoes.forEach(function (e) { if (st.t >= e.length - 1) held++; });
      html += '<span class="tl-echo">◍ ' + st.echoes.length + (held ? ' · ' + held + ' ' + t('frozenMark') : '') + '</span>';
    } else html += '<span class="tl-empty">◌</span>';
    box.innerHTML = html;
  }

  // ---------- rendering ----------
  var canvas = $('board'), ctx = canvas.getContext('2d');
  function setupCanvas() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f7f1e4'; ctx.fillRect(0, 0, W, H);

    if (!g) return;
    var pressed = C.platesPressed(g, st);
    var open = C.doorOpen(g, st);

    // room title strip
    ctx.fillStyle = '#7b7263'; ctx.font = '700 9px "Trebuchet MS",sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(String(level + 1).padStart(2, '0') + '  ' + C.LEVELS[level].name[lang].toUpperCase(), OX, 20);
    ctx.textAlign = 'right';
    ctx.fillStyle = open ? '#3f7f83' : '#c2603f';
    ctx.fillText(open ? '◇ ' + t('doorOpenLabel') : '◆ ' + t('doorShutLabel'), W - OX, 20);

    // board backing
    ctx.fillStyle = '#efe6d3';
    roundRect(OX - 7, OY - 7, COLS * CELL + 14, ROWS * CELL + 14, 10); ctx.fill();
    ctx.strokeStyle = '#d9cdb6'; ctx.lineWidth = 1; ctx.stroke();

    // floor cells
    for (var y = 0; y < ROWS; y++) {
      for (var x = 0; x < COLS; x++) {
        var ch = g.cells[y][x];
        var px = OX + x * CELL, py = OY + y * CELL;
        if (ch === '#') {
          ctx.fillStyle = '#4a443c';
          roundRect(px + 1, py + 1, CELL - 2, CELL - 2, 4); ctx.fill();
          ctx.strokeStyle = 'rgba(255,250,240,.09)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px + 7, py + 7); ctx.lineTo(px + CELL - 7, py + 7); ctx.stroke();
        } else {
          ctx.fillStyle = ((x + y) % 2 === 0) ? '#f8f2e5' : '#f3ebd9';
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          ctx.strokeStyle = 'rgba(190,175,148,.35)'; ctx.lineWidth = 1;
          ctx.strokeRect(px + .5, py + .5, CELL - 1, CELL - 1);
        }
      }
    }

    // echo trails (dotted, faint)
    st.echoes.forEach(function (e, idx) {
      ctx.strokeStyle = 'rgba(95,127,158,.22)'; ctx.lineWidth = 2;
      ctx.setLineDash([3, 5]); ctx.beginPath();
      e.forEach(function (p, i2) {
        var c = cellCenter(p);
        if (i2 === 0) ctx.moveTo(c.x, c.y); else ctx.lineTo(c.x, c.y);
      });
      ctx.stroke(); ctx.setLineDash([]);
    });

    // shards
    g.shards.forEach(function (p) {
      if (st.collected[C.key(p)]) return;
      var c = cellCenter(p), t0 = performance.now() / 600;
      ctx.save(); ctx.translate(c.x, c.y + Math.sin(t0) * 2);
      ctx.fillStyle = '#c79a3c'; ctx.strokeStyle = '#8a6520'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(3, -2); ctx.lineTo(0, 2); ctx.lineTo(-3, -2); ctx.closePath(); ctx.fill();
      ctx.restore();
    });

    // plates
    g.plates.forEach(function (p) {
      var c = cellCenter(p);
      var occ = pressed && isOccupied(p);
      ctx.strokeStyle = occ ? '#3f7f83' : '#a99a7e'; ctx.lineWidth = occ ? 3 : 2;
      ctx.fillStyle = occ ? 'rgba(63,127,131,.18)' : 'rgba(169,154,126,.08)';
      ctx.beginPath(); ctx.arc(c.x, c.y, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(c.x, c.y, 9, 0, Math.PI * 2); ctx.stroke();
      if (occ) {
        ctx.fillStyle = 'rgba(63,127,131,.12)';
        ctx.beginPath(); ctx.arc(c.x, c.y, 21 + Math.sin(performance.now() / 240) * 2, 0, Math.PI * 2); ctx.fill();
      }
    });

    // doors
    g.doors.forEach(function (p) {
      var px = OX + p.x * CELL, py = OY + p.y * CELL, c = cellCenter(p);
      if (open) {
        ctx.strokeStyle = 'rgba(63,127,131,.55)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
        roundRect(px + 4, py + 4, CELL - 8, CELL - 8, 5); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(63,127,131,.09)'; ctx.fill();
      } else {
        ctx.fillStyle = '#8d6047';
        roundRect(px + 3, py + 3, CELL - 6, CELL - 6, 4); ctx.fill();
        ctx.strokeStyle = '#e8d9bf'; ctx.lineWidth = 2;
        for (var k = 0; k < 4; k++) {
          var bx = px + 9 + k * 9;
          ctx.beginPath(); ctx.moveTo(bx, py + 8); ctx.lineTo(bx, py + CELL - 8); ctx.stroke();
        }
        ctx.fillStyle = '#c2603f'; ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    });

    // exit
    if (g.exit) {
      var ec = cellCenter(g.exit);
      ctx.fillStyle = open ? 'rgba(199,154,60,.2)' : 'rgba(150,138,116,.12)';
      ctx.beginPath(); ctx.arc(ec.x, ec.y, 20 + Math.sin(performance.now() / 400) * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = open ? '#c79a3c' : '#a99a7e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ec.x, ec.y, 15, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = open ? '#a8802c' : '#8a806e';
      ctx.font = '700 15px "Trebuchet MS",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('◇', ec.x, ec.y + 1);
    }

    // echoes (behind player). Overlapping echoes are fanned out so the player can
    // always SEE how many versions of themselves are on the board.
    var overlapCount = {};
    var playerKey = C.key(C.playerAt(st));
    st.echoes.forEach(function (e, idx) {
      var p = C.echoAt(e, st.t), c = cellCenter(p);
      var held = st.t >= e.length - 1;
      var k = C.key(p);
      var n = overlapCount[k] || 0;
      overlapCount[k] = n + 1;
      var dx = 0, dy = 0;
      if (n > 0 || k === playerKey) {
        // fan out: first offset down-left, then progressively further
        dx = -(15 + (n % 3) * 8); dy = (13 + Math.floor(n / 3) * 9);
      }
      c = { x: c.x + dx, y: c.y + dy };
      ctx.save();
      ctx.globalAlpha = held ? 0.62 : 0.44;
      ctx.fillStyle = 'rgba(95,127,158,.28)';
      ctx.beginPath(); ctx.ellipse(c.x, c.y + 15, 17, 5, 0, 0, Math.PI * 2); ctx.fill();
      var im = folkImg(level);
      if (im && im.complete && im.naturalWidth) ctx.drawImage(im, c.x - 20, c.y - 22, 40, 40);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = held ? 'rgba(63,127,131,.9)' : 'rgba(95,127,158,.55)';
      ctx.lineWidth = held ? 2 : 1;
      if (held) { ctx.setLineDash([3, 3]); }
      ctx.beginPath(); ctx.arc(c.x, c.y, 20, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = held ? '#3f7f83' : '#5f7f9e';
      ctx.font = '700 8px "Trebuchet MS",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(held ? '◍' : String(idx + 1), c.x, c.y - 26);
      ctx.restore();
    });

    // explicit "N echoes here" badge when everything is stacked on the start tile
    if (st.echoes.length && st.echoes.every(function (e) { return C.key(C.echoAt(e, st.t)) === playerKey; })) {
      var sc2 = cellCenter(C.playerAt(st));
      ctx.fillStyle = 'rgba(63,127,131,.92)';
      roundRect(sc2.x + 12, sc2.y + 14, 34, 15, 7); ctx.fill();
      ctx.fillStyle = '#fffaf0'; ctx.font = '700 9px "Trebuchet MS",sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('◍ ' + st.echoes.length, sc2.x + 29, sc2.y + 22);
    }

    // player
    var pc = C.playerAt(st), pcc = cellCenter(pc);
    ctx.fillStyle = 'rgba(60,48,30,.2)';
    ctx.beginPath(); ctx.ellipse(pcc.x, pcc.y + 16, 17, 5, 0, 0, Math.PI * 2); ctx.fill();
    if (winGlow > 0) {
      ctx.fillStyle = 'rgba(199,154,60,' + (winGlow * 0.3) + ')';
      ctx.beginPath(); ctx.arc(pcc.x, pcc.y, 26 + (1 - winGlow) * 16, 0, Math.PI * 2); ctx.fill();
    }
    var pim = folkImg(level);
    if (pim && pim.complete && pim.naturalWidth) ctx.drawImage(pim, pcc.x - 22, pcc.y - 24, 44, 44);
    ctx.strokeStyle = '#c2603f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pcc.x, pcc.y, 21, 0, Math.PI * 2); ctx.stroke();

    // start marker
    if (g.start) {
      var sc = cellCenter(g.start);
      ctx.strokeStyle = 'rgba(45,42,38,.18)'; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
      roundRect(OX + g.start.x * CELL + 5, OY + g.start.y * CELL + 5, CELL - 10, CELL - 10, 4); ctx.stroke(); ctx.setLineDash([]);
    }

    if (flash > 0) { ctx.fillStyle = 'rgba(255,250,235,' + (flash * 0.5) + ')'; ctx.fillRect(0, 0, W, H); }
  }

  function isOccupied(p) {
    var k = C.key(p);
    if (C.key(C.playerAt(st)) === k) return true;
    for (var i = 0; i < st.echoes.length; i++) if (C.key(C.echoAt(st.echoes[i], st.t)) === k) return true;
    return false;
  }

  function loop() {
    if (flash > 0) flash = Math.max(0, flash - 0.045);
    if (winGlow > 0) winGlow = Math.max(0, winGlow - 0.018);
    draw();
    raf = requestAnimationFrame(loop);
  }

  // ---------- game flow ----------
  function startLevel(idx) {
    level = Math.max(0, Math.min(C.LEVELS.length - 1, idx));
    g = C.parse(C.LEVELS[level].map);
    st = C.newState(g); history = []; mode = 'play'; flash = 0.7; winGlow = 0;
    overlay('menu', false); overlay('clear', false); overlay('allclear', false);
    overlay('help', false); overlay('levels', false);
    updateHUD(); updateTimeline();
    try { if (window.PokiSDK) window.PokiSDK.gameplayStart(); } catch (e) {}
  }

  function doAction(a) {
    if (mode !== 'play') return;
    var before = C.doorOpen(g, st);
    var r = C.act(g, st, a);
    if (!r.ok) {
      SFX.blocked();
      var d0 = C.DELTA[a] || { x: 0, y: 0 };
      var tx = C.playerAt(st).x + d0.x, ty = C.playerAt(st).y + d0.y;
      var row = g.cells[ty];
      var targetIsDoor = row && row[tx] === 'D';
      toast(targetIsDoor && !C.doorOpen(g, st) ? t('doorShut') : t('blocked'), 1400);
      return;
    }
    pushHistory();
    st = r.state;
    if (a === 'W') SFX.wait(); else SFX.move();
    if (r.shard) { SFX.shard(); flash = 0.35; }
    var after = C.doorOpen(g, st);
    if (!before && after) SFX.plate();
    updateHUD(); updateTimeline();
    if (r.win) { win(); }
  }

  function doFreeze() {
    if (mode !== 'play') return;
    var r = C.freeze(g, st);
    if (!r.ok) { SFX.blocked(); toast(t('noEcho'), 1800); return; }
    pushHistory();
    st = r.state; SFX.freeze(); flash = 0.55;
    toast(t('frozen'), 2200);
    updateHUD(); updateTimeline();
  }

  function doUndo() {
    if (mode !== 'play') return;
    if (!history.length) { toast(t('undoNone'), 1400); return; }
    st = history.pop(); SFX.click(); updateHUD(); updateTimeline();
  }

  function doReset() {
    if (mode !== 'play') return;
    history = []; st = C.reset(g); SFX.click(); toast(t('resetDone'), 1400);
    updateHUD(); updateTimeline();
  }

  function win() {
    mode = 'clear'; SFX.win(); winGlow = 1;
    var sh = C.shardCount(g, st), total = C.shardTotal(g);
    var prev = best[level];
    if (!prev || st.t < prev) best[level] = st.t;
    cleared[level] = { steps: st.t, shards: sh, total: total, perfect: sh === total };
    unlocked = Math.max(unlocked, Math.min(C.LEVELS.length, level + 2));
    save();
    try { if (window.PokiSDK) window.PokiSDK.gameplayStop(); } catch (e) {}
    try { if (YT && window.ytgame.engagement) window.ytgame.engagement.sendScore({ value: (level + 1) * 100 + Math.max(0, 50 - st.t) }); } catch (e) {}
    var folkIdx = Math.min(C.FOLKS.length - 1, level);
    var f = C.FOLKS[folkIdx];
    setTimeout(function () {
      if (level === C.LEVELS.length - 1) { showAllClear(); return; }
      $('clearImg').src = 'sprites/' + f.k + '.webp';
      $('clearName').textContent = f[lang];
      $('clearNote').textContent = f[lang === 'zh' ? 'noteZh' : 'note'];
      $('clearStats').textContent = (sh === total && total > 0 ? t('perfect') : t('clearSimple')) + ' · ' + st.t + ' ' + t('stepsUsed') + ' · ' + st.echoes.length + ' ' + t('echoesLeft') + (total ? ' · ' + sh + '/' + total + ' ' + t('shardsWord') : '');
      $('btnNext').textContent = t('next');
      overlay('clear', true);
    }, 620);
  }

  function showAllClear() {
    var perfectRooms = 0, totalSteps = 0;
    Object.keys(cleared).forEach(function (k) { if (cleared[k].perfect) perfectRooms++; totalSteps += cleared[k].steps; });
    $('allStats').textContent = C.LEVELS.length + ' / ' + C.LEVELS.length + ' · ' + perfectRooms + ' ' + (lang === 'zh' ? '间完美' : 'perfect') + ' · ' + totalSteps + ' ' + t('stepsUsed');
    overlay('allclear', true);
  }

  function renderLevelGrid() {
    var box = $('levelGrid');
    if (!box) return;
    var html = '';
    C.LEVELS.forEach(function (L, i) {
      var locked = (i + 1) > unlocked;
      var done = !!cleared[i];
      html += '<button type="button" class="level-cell' + (done ? ' cleared' : '') + '" data-level="' + i + '"' + (locked ? ' disabled' : '') + '>' +
        '<span class="lc-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="lc-name">' + (locked ? '· · ·' : L.name[lang]) + '</span>' +
        '<span class="lc-star">' + (done ? (cleared[i].perfect ? '✦' : '✓') : (locked ? t('locked') : '')) + '</span></button>';
    });
    box.innerHTML = html;
    $('levelsSub').textContent = Object.keys(cleared).length + ' / ' + C.LEVELS.length + ' ' + t('cleared');
    var cells = box.querySelectorAll('.level-cell');
    for (var i = 0; i < cells.length; i++) {
      cells[i].addEventListener('click', function () {
        var n = parseInt(this.getAttribute('data-level'), 10);
        SFX.click(); startLevel(n);
      });
    }
  }

  // ---------- input ----------
  function bind() {
    $('btnStart').addEventListener('click', function () { SFX.click(); startLevel(Math.min(unlocked - 1, C.LEVELS.length - 1)); });
    $('btnNext').addEventListener('click', function () { SFX.click(); startLevel(level + 1); });
    $('btnReplay').addEventListener('click', function () { SFX.click(); startLevel(level); });
    $('btnAgain').addEventListener('click', function () { SFX.click(); startLevel(0); });
    $('btnAllLevels').addEventListener('click', function () { SFX.click(); overlay('allclear', false); renderLevelGrid(); overlay('levels', true); });
    $('btnLevels').addEventListener('click', function () { SFX.click(); renderLevelGrid(); overlay('levels', true); });
    $('btnLevelsClose').addEventListener('click', function () { SFX.click(); overlay('levels', false); });
    $('btnHelp').addEventListener('click', function () { SFX.click(); $('helpBody').innerHTML = t('helpHTML'); overlay('help', true); });
    $('btnHelpClose').addEventListener('click', function () { SFX.click(); overlay('help', false); });
    $('btnSound').addEventListener('click', function () { soundOn = !soundOn; $('btnSound').classList.toggle('off', !soundOn); save(); if (soundOn) SFX.click(); });
    $('btnLang').addEventListener('click', function () { lang = lang === 'en' ? 'zh' : 'en'; applyLang(); save(); SFX.click(); });
    $('btnFreeze').addEventListener('click', doFreeze);
    $('btnUndo').addEventListener('click', doUndo);
    $('btnReset').addEventListener('click', doReset);
    $('btnHint').addEventListener('click', showHint);
    var dbtns = document.querySelectorAll('.dbtn');
    for (var i = 0; i < dbtns.length; i++) dbtns[i].addEventListener('click', function () { doAction(this.getAttribute('data-act')); });

    document.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      var map = { arrowup: 'U', arrowdown: 'D', arrowleft: 'L', arrowright: 'R', w: 'U', s: 'D', a: 'L', d: 'R' };
      if (map[k]) { e.preventDefault(); doAction(map[k]); }
      else if (k === ' ' || k === 'spacebar') { e.preventDefault(); doAction('W'); }
      else if (k === 'f') { e.preventDefault(); doFreeze(); }
      else if (k === 'z') { e.preventDefault(); doUndo(); }
      else if (k === 'r') { e.preventDefault(); doReset(); }
      else if (k === 'h') { e.preventDefault(); showHint(); }
      else if (k === 'enter' && mode === 'menu') { e.preventDefault(); startLevel(Math.min(unlocked - 1, C.LEVELS.length - 1)); }
    });

    // swipe on canvas
    var sx = 0, sy = 0, tracking = false;
    canvas.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; tracking = true; });
    canvas.addEventListener('pointerup', function (e) {
      if (!tracking) return; tracking = false;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) doAction(dx > 0 ? 'R' : 'L');
      else doAction(dy > 0 ? 'D' : 'U');
    });
    canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });

    window.addEventListener('resize', fit);
  }

  function showHint() {
    var L = C.LEVELS[level];
    toast(t('hintTitle') + ' · ' + L.hint[lang], 5200);
  }

  function fit() {
    var app = $('app');
    var scale = Math.min(1, (window.innerWidth - 8) / 420, (window.innerHeight - 8) / 866);
    app.style.transform = 'translate(-50%,-50%) scale(' + scale.toFixed(3) + ')';
  }

  // ---------- boot ----------
  function boot() {
    loadSave(); setupCanvas();
    g = C.parse(C.LEVELS[0].map); st = C.newState(g);
    bind(); applyLang(); fit(); updateTimeline();
    loadSprites(function () {
      try { if (YT && window.ytgame.game) { window.ytgame.game.firstFrameReady(); window.ytgame.game.gameReady(); } } catch (e) {}
      try { if (window.PokiSDK) window.PokiSDK.gameLoadingFinished(); } catch (e) {}
      overlay('menu', true); mode = 'menu';
    });
    if (!raf) loop();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

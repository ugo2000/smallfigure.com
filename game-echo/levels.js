/* ECHO MUSEUM - level data + pure game logic.
 * Shared by echo.js (browser) and tools/verify_echo_levels.js (node).
 * No DOM, no rendering. Nothing here touches the network.
 *
 * Map legend: # wall | . floor | S start | E exit | P plate | D door | * memory shard
 * All maps are 8 cols x 10 rows.
 */
(function (root) {
  'use strict';

  // 11 original tiny folks from smallfigure.com. One wakes up per cleared level.
  var FOLKS = [
    { k: 'l1',  en: 'Crystal Bell',      zh: '徽章 · 晶铃',     note: "A bell that only rings when something has been lost.",            noteZh: '只有在丢了东西的时候，它才会响。' },
    { k: 'l2',  en: 'Flame Imp',         zh: '火苗小鬼',         note: 'Keeps a candle flame as a pet. Never asks for anything back.',   noteZh: '养了一簇火苗当宠物，从不求回报。' },
    { k: 'l3',  en: 'Tonkotsu Ramen',    zh: '豚骨拉面',         note: 'Twelve hours of broth, one soft egg, no regrets.',              noteZh: '熬了十二小时的汤，一颗溏心蛋，不后悔。' },
    { k: 'l4',  en: 'Feather Sprite',    zh: '羽衣仙童',         note: 'Fell out of a storybook and decided to stay.',                  noteZh: '从故事书里掉出来，就赖着不走了。' },
    { k: 'l5',  en: 'Delivery Rider',    zh: '外卖骑手',         note: 'Knows every shortcut in a city that keeps changing.',           noteZh: '这座城天天在变，他记得每一条近路。' },
    { k: 'l6',  en: 'Red Cloak',         zh: '红斗篷女孩',       note: 'Takes the long way through the woods on purpose.',              noteZh: '穿过树林时，她故意挑远的那条路。' },
    { k: 'l7',  en: 'Alien Gentleman',   zh: '维多利亚绅士',     note: 'Dressed for a dinner party on a planet that no longer exists.', noteZh: '为一场早已不存在的星球晚宴，盛装出席。' },
    { k: 'l8',  en: 'Twist-horn Giant',  zh: '弯角杂货巨人',     note: 'Carries a whole shop on his back, including the shopkeeper.',   noteZh: '背上驮着一整间杂货铺，连老板一起。' },
    { k: 'l9',  en: 'The Engineer',      zh: '女工程师',         note: 'Fixes things nobody else admits are broken.',                    noteZh: '别人不肯承认坏了的东西，她来修。' },
    { k: 'l10', en: 'Gucck Alien',       zh: '果克星人',         note: 'Came for the weather. Stayed for the noodles.',                 noteZh: '本来是来看天气的，为了这碗面留下了。' },
    { k: 'l11', en: 'Old Zhang',         zh: '老张',             note: 'Points at something interesting just off the edge of the picture.', noteZh: '他总指着画面外头，说那儿有意思。' }
  ];

  // sol is the reference solution: an array of loops, each loop is an array of actions
  // ('U','D','L','R','W'), followed by an implicit FREEZE except for the last loop.
  // Verified by tools/verify_echo_levels.js against the exact runtime logic below.
  var LEVELS = [
    {
      name: { en: 'FIRST STEPS', zh: '第一步' },
      hint: { en: 'Walk to the glowing door. Nothing is watching you yet.', zh: '走到发光的门口。这时候还没人看着你。' },
      map: [
        '########',
        '#S....E#',
        '#......#',
        '#..##..#',
        '#..##..#',
        '#..##..#',
        '#......#',
        '#..*...#',
        '#......#',
        '########'
      ],
      sol: [['R','R','R','R','R']]
    },
    {
      name: { en: 'STAY', zh: '站住' },
      hint: { en: 'A plate only stays pressed while someone stands on it. You cannot be in two places — but an echo can.', zh: '机关要有人一直踩着才开。你没法同时待在两处，但回声可以。' },
      map: [
        '########',
        '#S.....#',
        '#......#',
        '#..P...#',
        '####D###',
        '#......#',
        '#......#',
        '#....E.#',
        '#......#',
        '########'
      ],
      sol: [
        ['R','R','D','D'],
        ['R','R','D','D','R','D','D','D','R','D']
      ]
    },
    {
      name: { en: 'WAIT FOR ME', zh: '等我一下' },
      hint: { en: 'The plate is far away. Your echo needs time to get there. Press WAIT and let your past catch up.', zh: '机关在很远处，回声得走一会儿才到。按「等一等」，让过去的自己赶上来。' },
      map: [
        '########',
        '#S..D..#',
        '#..#...#',
        '#..#...#',
        '#..#..E#',
        '#..#...#',
        '#P.#...#',
        '#..#...#',
        '#..#...#',
        '########'
      ],
      sol: [
        ['D','D','D','D','D'],
        ['R','W','W','W','W','R','R','D','D','D','R','R']
      ]
    },
    {
      name: { en: 'TWO OF YOU', zh: '两个自己' },
      hint: { en: 'Two plates, one door. Leave a version of yourself on each.', zh: '两块机关，一扇门。在每一块上留一个自己。' },
      map: [
        '########',
        '#S..D..#',
        '#..#...#',
        '#..#...#',
        '#P.#..E#',
        '#..#...#',
        '#..#...#',
        '#P.#...#',
        '#..#...#',
        '########'
      ],
      sol: [
        ['D','D','D'],
        ['D','D','D','D','D','D'],
        ['R','W','W','W','W','W','R','R','D','D','D','R','R']
      ]
    },
    {
      name: { en: 'THE LONG WAY', zh: '绕远路' },
      hint: { en: 'The plate is at the very bottom. Count the steps before you move.', zh: '机关在最底下。动之前，先数一数步数。' },
      map: [
        '########',
        '#S.D...#',
        '#..#...#',
        '#..#...#',
        '#..#...#',
        '#..#..E#',
        '#..#...#',
        '#..#...#',
        '#.P#...#',
        '########'
      ],
      sol: [
        ['R','D','D','D','D','D','D','D'],
        ['R','W','W','W','W','W','W','W','R','R','D','D','D','D','R','R']
      ]
    },
    {
      name: { en: 'SHARDS', zh: '碎片' },
      hint: { en: 'Collect the shards on your way. They remember what you skip.', zh: '顺路捡起碎片。你漏掉的东西，它们都记得。' },
      map: [
        '########',
        '#S..D..#',
        '#..#.*.#',
        '#..#...#',
        '#..#..E#',
        '#..#...#',
        '#P.#*..#',
        '#..#...#',
        '#..#...#',
        '########'
      ],
      sol: [
        ['D','D','D','D','D'],
        ['R','W','W','W','W','R','R','R','D','D','D','R']
      ]
    },
    {
      name: { en: 'THREE OF YOU', zh: '三个自己' },
      hint: { en: 'Three plates. Every echo you leave is a promise to your future self.', zh: '三块机关。每留一个回声，都是给未来的自己许的一个愿。' },
      map: [
        '########',
        '#S..D..#',
        '#..#...#',
        '#P.#...#',
        '#..#..E#',
        '#..#...#',
        '#P.#...#',
        '#..#...#',
        '#P.#...#',
        '########'
      ],
      sol: [
        ['D','D'],
        ['D','D','D','D','D'],
        ['D','D','D','D','D','D','D'],
        ['R','W','W','W','W','W','W','R','R','D','D','D','R','R']
      ]
    },
    {
      name: { en: 'A WALL IN THE WAY', zh: '挡路的墙' },
      hint: { en: 'The right room is not a straight line. Plan before you freeze.', zh: '右边那间屋不是直着走的。定格之前先想好。' },
      map: [
        '########',
        '#S..D..#',
        '#..#.#.#',
        '#..#.#.#',
        '#P.#..E#',
        '#..#.#.#',
        '#..#...#',
        '#P.#*..#',
        '#..#...#',
        '########'
      ],
      sol: [
        ['D','D','D'],
        ['D','D','D','D','D','D'],
        ['R','W','W','W','W','W','R','R','R','R','D','D','D']
      ]
    },
    {
      name: { en: 'ALMOST THERE', zh: '快到了' },
      hint: { en: 'Two plates, a long walk, and one shard you will have to want.', zh: '两块机关，一段长路，还有一片得特意去拿的碎片。' },
      map: [
        '########',
        '#S.D...#',
        '#..#.*.#',
        '#..#...#',
        '#..#...#',
        '#..#..E#',
        '#..#...#',
        '#P.#...#',
        '#..P...#',
        '########'
      ],
      sol: [
        ['D','D','D','D','D','D'],
        ['D','D','D','D','D','D','D','R','R'],
        ['R','W','W','W','W','W','W','W','W','R','R','R','D','D','D','D','R']
      ]
    },
    {
      name: { en: 'THE ELEVENTH', zh: '第十一个' },
      hint: { en: 'Everyone you have been is standing on a plate. Walk past them.', zh: '你曾经是过的每一个自己，都站在一块机关上。从他们身边走过去。' },
      map: [
        '########',
        '#S..D..#',
        '#..#.*.#',
        '#P.#...#',
        '#..#..E#',
        '#..#...#',
        '#P.#*..#',
        '#..#...#',
        '#P.#...#',
        '########'
      ],
      sol: [
        ['D','D'],
        ['D','D','D','D','D'],
        ['D','D','D','D','D','D','D'],
        ['R','W','W','W','W','W','W','R','R','R','R','D','D','D']
      ]
    }
  ];

  // ---------- pure logic ----------

  function parse(map) {
    var g = { cols: map[0].length, rows: map.length, cells: map.map(function (r) { return r.split(''); }),
              plates: [], doors: [], shards: [], start: null, exit: null };
    for (var y = 0; y < g.rows; y++) {
      for (var x = 0; x < g.cols; x++) {
        var c = g.cells[y][x];
        if (c === 'S') g.start = { x: x, y: y };
        else if (c === 'E') g.exit = { x: x, y: y };
        else if (c === 'P') g.plates.push({ x: x, y: y });
        else if (c === 'D') g.doors.push({ x: x, y: y });
        else if (c === '*') g.shards.push({ x: x, y: y });
      }
    }
    return g;
  }

  function key(p) { return p.x + ',' + p.y; }

  function echoAt(echo, t) { return echo[Math.min(t, echo.length - 1)]; }

  function playerAt(st) { return st.path[st.t]; }

  function platesPressed(g, st) {
    if (!g.plates.length) return true;
    var occ = {};
    occ[key(playerAt(st))] = true;
    for (var i = 0; i < st.echoes.length; i++) occ[key(echoAt(st.echoes[i], st.t))] = true;
    for (var j = 0; j < g.plates.length; j++) if (!occ[key(g.plates[j])]) return false;
    return true;
  }

  function doorOpen(g, st) { return platesPressed(g, st); }

  function walkable(g, st, p) {
    if (p.x < 0 || p.y < 0 || p.x >= g.cols || p.y >= g.rows) return false;
    var c = g.cells[p.y][p.x];
    if (c === '#') return false;
    if (c === 'D') return doorOpen(g, st);
    return true;
  }

  function newState(g) {
    return { echoes: [], path: [{ x: g.start.x, y: g.start.y }], t: 0,
             collected: {}, loops: 0, frozen: 0 };
  }

  var DELTA = { U: { x: 0, y: -1 }, D: { x: 0, y: 1 }, L: { x: -1, y: 0 }, R: { x: 1, y: 0 }, W: { x: 0, y: 0 } };

  // Apply one action. Returns { ok, win, moved, shard } — never mutates on failure.
  function act(g, st, a) {
    var d = DELTA[a];
    if (!d) return { ok: false };
    var from = playerAt(st);
    var to = { x: from.x + d.x, y: from.y + d.y };
    if (!walkable(g, st, to)) return { ok: false, blocked: true };

    var nt = st.t + 1;
    var npath = st.path.concat([to]);
    var nst = { echoes: st.echoes, path: npath, t: nt, collected: st.collected, loops: st.loops, frozen: st.frozen };

    var shard = false;
    if (g.cells[to.y][to.x] === '*') {
      var k = key(to);
      if (!nst.collected[k]) { nst.collected = Object.assign({}, nst.collected); nst.collected[k] = true; shard = true; }
    }

    var win = (g.cells[to.y][to.x] === 'E' && doorOpen(g, nst));
    return { ok: true, state: nst, win: win, moved: a !== 'W', shard: shard };
  }

  // Freeze the current walk into an echo, then restart the loop from S.
  function freeze(g, st) {
    if (st.t === 0) return { ok: false };
    return { ok: true, state: {
      echoes: st.echoes.concat([st.path.slice()]),
      path: [{ x: g.start.x, y: g.start.y }], t: 0,
      collected: st.collected, loops: st.loops + 1, frozen: st.frozen + 1
    } };
  }

  function undo(st) {
    if (st.t === 0) return { ok: false, state: st };
    return { ok: true, state: { echoes: st.echoes, path: st.path.slice(0, -1), t: st.t - 1,
                                collected: st.collected, loops: st.loops, frozen: st.frozen } };
  }

  function reset(g) { return newState(g); }

  function shardTotal(g) { return g.shards.length; }
  function shardCount(g, st) {
    var n = 0;
    for (var i = 0; i < g.shards.length; i++) if (st.collected[key(g.shards[i])]) n++;
    return n;
  }

  var API = {
    FOLKS: FOLKS, LEVELS: LEVELS,
    parse: parse, key: key, echoAt: echoAt, playerAt: playerAt,
    platesPressed: platesPressed, doorOpen: doorOpen, walkable: walkable,
    newState: newState, act: act, freeze: freeze, undo: undo, reset: reset,
    shardTotal: shardTotal, shardCount: shardCount, DELTA: DELTA
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.EchoCore = API;
})(typeof window !== 'undefined' ? window : globalThis);

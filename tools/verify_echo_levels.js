/* Verify every ECHO MUSEUM level: map integrity + reference solution actually wins. */
const C = require('../game-echo/levels.js');

let fail = 0;
const log = (...a) => console.log(...a);

C.LEVELS.forEach((L, idx) => {
  const n = idx + 1;
  const g = C.parse(L.map);
  const problems = [];

  // --- map integrity ---
  if (L.map.length !== 10) problems.push(`rows=${L.map.length} (want 10)`);
  L.map.forEach((r, y) => { if (r.length !== 8) problems.push(`row ${y} width=${r.length} (want 8)`); });
  if (!g.start) problems.push('no S');
  if (!g.exit) problems.push('no E');
  if (g.plates.length !== g.doors.length && g.doors.length > 0) {
    // allowed, but warn
  }

  // --- run reference solution ---
  let st = C.newState(g);
  let won = false, steps = 0, blockedAt = null;
  const loopDetail = [];
  L.sol.forEach((loop, li) => {
    if (won || blockedAt) return;
    let ls = 0;
    for (const a of loop) {
      const r = C.act(g, st, a);
      if (!r.ok) { blockedAt = `loop ${li + 1} action ${ls + 1} '${a}' at ${C.key(C.playerAt(st))} t=${st.t}`; break; }
      st = r.state; ls++; steps++;
      if (r.win) { won = true; break; }
    }
    loopDetail.push(`${ls} steps${won ? ' -> WIN' : ''}`);
    // freeze between loops (not after the last / winning one)
    if (!won && !blockedAt && li < L.sol.length - 1) {
      const f = C.freeze(g, st);
      if (!f.ok) blockedAt = `freeze failed at loop ${li + 1}`;
      else st = f.state;
    }
  });

  const shards = C.shardCount(g, st) + '/' + C.shardTotal(g);
  if (!won) problems.push(`NOT SOLVED: ${blockedAt || 'never reached exit'}`);
  if (problems.length) fail++;

  log(`L${String(n).padStart(2)} ${problems.length ? 'FAIL' : 'OK  '} | ${L.name.en.padEnd(17)} | plates=${g.plates.length} doors=${g.doors.length} shards=${shards} | loops=${loopDetail.join(' / ')}`);
  if (problems.length) problems.forEach(p => log(`      - ${p}`));
  if (blockedAt) log(`      - blocked: ${blockedAt}; player=${C.key(C.playerAt(st))}`);
});

log('\n' + (fail ? `${fail} LEVEL(S) FAILED` : `ALL ${C.LEVELS.length} LEVELS VERIFIED`));
process.exit(fail ? 1 : 0);

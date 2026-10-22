/**
 * POST /api/download/:id —— 记录一次下载并返回最新次数
 * 计数原子自增（D1 upsert），失败不堵前端下载。
 */
export async function onRequestPost(context) {
  var id = String((context.params && context.params.id) || '');
  if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id)) {
    return Response.json({ ok: false, error: 'bad-id' }, { status: 400 });
  }
  if (!context.env || !context.env.DB) {
    return Response.json({ ok: false, error: 'no-db' }, { status: 500 });
  }
  try {
    var results = await context.env.DB.batch([
      context.env.DB.prepare(
        "INSERT INTO downloads (id, count, updated_at) VALUES (?, 1, datetime('now')) " +
        'ON CONFLICT(id) DO UPDATE SET count = count + 1, updated_at = datetime(\'now\')'
      ).bind(id),
      context.env.DB.prepare('SELECT count AS c FROM downloads WHERE id = ?').bind(id),
    ]);
    var row = results[1] && results[1].results && results[1].results[0];
    var count = row && typeof row.c === 'number' ? row.c : 1;
    return Response.json({ ok: true, id: id, count: count });
  } catch (err) {
    return Response.json({ ok: false, error: String((err && err.message) || err) }, { status: 500 });
  }
}

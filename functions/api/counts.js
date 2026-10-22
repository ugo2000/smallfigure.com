/**
 * GET /api/counts —— 返回全部图片的下载次数 { id: count }
 * 前端按阈值（100 次）决定是否展示，未达标不显示。
 */
export async function onRequestGet(context) {
  if (!context.env || !context.env.DB) {
    return Response.json({ ok: false, error: 'no-db' }, { status: 500 });
  }
  try {
    var res = await context.env.DB.prepare('SELECT id, count FROM downloads').all();
    var counts = {};
    var rows = (res && res.results) || [];
    for (var i = 0; i < rows.length; i++) {
      counts[rows[i].id] = rows[i].count;
    }
    return Response.json(
      { ok: true, counts: counts },
      { headers: { 'Cache-Control': 'public, max-age=20' } }
    );
  } catch (err) {
    return Response.json({ ok: false, error: String((err && err.message) || err) }, { status: 500 });
  }
}

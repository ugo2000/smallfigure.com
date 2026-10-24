/**
 * POST /api/download/:id —— 记录一次下载并返回最新次数
 * 需要登录（会话 Cookie）；计数写入全局 downloads + 用户归属 user_downloads/users.download_count。
 * 计数原子自增（D1 upsert），失败不堵前端下载。
 */
import { json, getUser } from '../../_lib/auth.js';

export async function onRequestPost(context) {
  var id = String((context.params && context.params.id) || '');
  if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id)) {
    return json({ ok: false, error: 'bad-id' }, 400);
  }
  if (!context.env || !context.env.DB) {
    return json({ ok: false, error: 'no-db' }, 500);
  }
  /* 下载门控：未登录一律 401，前端据此拉起登录弹窗 */
  var user = await getUser(context);
  if (!user) {
    return json({ ok: false, error: 'no-session' }, 401);
  }
  try {
    var results = await context.env.DB.batch([
      context.env.DB.prepare(
        "INSERT INTO downloads (id, count, updated_at) VALUES (?, 1, datetime('now')) " +
        "ON CONFLICT(id) DO UPDATE SET count = count + 1, updated_at = datetime('now')"
      ).bind(id),
      context.env.DB.prepare(
        "INSERT INTO user_downloads (user_id, image_id, count, updated_at) VALUES (?, ?, 1, datetime('now')) " +
        'ON CONFLICT(user_id, image_id) DO UPDATE SET count = count + 1, updated_at = datetime(\'now\')'
      ).bind(user.id, id),
      context.env.DB.prepare(
        "UPDATE users SET download_count = download_count + 1 WHERE id = ?"
      ).bind(user.id),
      context.env.DB.prepare('SELECT count AS c FROM downloads WHERE id = ?').bind(id),
    ]);
    var row = results[3] && results[3].results && results[3].results[0];
    var count = row && typeof row.c === 'number' ? row.c : 1;
    return json({ ok: true, id: id, count: count });
  } catch (err) {
    return json({ ok: false, error: String((err && err.message) || err) }, 500);
  }
}

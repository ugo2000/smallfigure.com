/**
 * GET /api/auth/stats —— 注册用户统计（管理员）
 * 用法：curl -H "X-Admin-Token: <token>" https://smallfigure.com/api/auth/stats
 * 令牌：npx wrangler pages secret put ADMIN_TOKEN --project-name=smallfigure
 * 未配置 ADMIN_TOKEN 时接口关闭（503）。
 */
import { json, isAdmin } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  var env = context.env;
  if (!env || !env.DB) return json({ ok: false, error: 'no-db' }, 500);
  if (!isAdmin(context)) return json({ ok: false, error: 'forbidden' }, 403);

  try {
    var total = await env.DB.prepare('SELECT COUNT(*) AS n FROM users').first();
    var today = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM users WHERE created_at >= date('now')"
    ).first();
    var week = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM users WHERE created_at >= date('now', '-7 days')"
    ).first();
    var downloads = await env.DB.prepare(
      'SELECT COALESCE(SUM(download_count), 0) AS n FROM users'
    ).first();
    var active = await env.DB.prepare(
      'SELECT COUNT(*) AS n FROM users WHERE download_count > 0'
    ).first();
    var recent = await env.DB.prepare(
      'SELECT id, email, created_at, last_login_at, download_count FROM users ORDER BY id DESC LIMIT 20'
    ).all();
    return json({
      ok: true,
      stats: {
        totalUsers: (total && total.n) || 0,
        todayNew: (today && today.n) || 0,
        weekNew: (week && week.n) || 0,
        activeUsers: (active && active.n) || 0,
        userDownloads: (downloads && downloads.n) || 0,
        recentUsers: (recent && recent.results) || []
      }
    });
  } catch (err) {
    return json({ ok: false, error: 'server-error' }, 500);
  }
}

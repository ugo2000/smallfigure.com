/**
 * POST /api/auth/logout —— 注销当前会话并清 Cookie
 */
import { json, destroySession, sessionCookie, getUser } from '../../_lib/auth.js';

export async function onRequestPost(context) {
  var user = await getUser(context);
  if (user) {
    var cookie = context.request.headers.get('Cookie') || '';
    var m = /(?:^|;\s*)sf_session=([a-f0-9]{64})(?:;|$)/.exec(cookie);
    if (m) {
      try { await destroySession(context.env, m[1]); } catch (e) { /* 库挂了也照样让前端退出 */ }
    }
  }
  return json(
    { ok: true },
    200,
    { 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie(context.request, '', 0) }
  );
}

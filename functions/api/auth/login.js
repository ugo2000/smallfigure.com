/**
 * POST /api/auth/login —— 邮箱密码登录，种会话 Cookie
 * body: { email, password }
 */
import { json, isValidEmail, hashPassword, createSession, sessionCookie, rateLimit, clientIp } from '../../_lib/auth.js';

export async function onRequestPost(context) {
  var env = context.env;
  if (!env || !env.DB) return json({ ok: false, error: 'no-db' }, 500);
  if (!rateLimit(clientIp(context), 'login', 10, 60)) {
    return json({ ok: false, error: 'rate-limited' }, 429);
  }
  var body;
  try { body = await context.request.json(); } catch (e) { return json({ ok: false, error: 'bad-json' }, 400); }
  var email = String((body && body.email) || '').trim().toLowerCase();
  var password = String((body && body.password) || '');
  if (!isValidEmail(email) || !password) return json({ ok: false, error: 'wrong-credentials' }, 401);

  try {
    var user = await env.DB.prepare(
      'SELECT id, email, pass_hash, salt FROM users WHERE email = ?'
    ).bind(email).first();
    /* 用户不存在也走一遍哈希，省一次计时侧信道 */
    var salt = user ? user.salt : '0'.repeat(32);
    var passHash = user ? user.pass_hash : '0'.repeat(64);
    var candidate = await hashPassword(password, salt, env);
    if (!user || candidate !== passHash) {
      return json({ ok: false, error: 'wrong-credentials' }, 401);
    }
    await env.DB.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").bind(user.id).run();
    var token = await createSession(env, user.id);
    return json(
      { ok: true, user: { id: user.id, email: user.email } },
      200,
      { 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie(context.request, token, 30 * 86400) }
    );
  } catch (err) {
    return json({ ok: false, error: 'server-error' }, 500);
  }
}

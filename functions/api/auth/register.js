/**
 * POST /api/auth/register —— 邮箱注册，成功后自动登录（种会话 Cookie）
 * body: { email, password }
 */
import { json, randomHex, isValidEmail, hashPassword, createSession, sessionCookie, rateLimit, clientIp } from '../../_lib/auth.js';

export async function onRequestPost(context) {
  var env = context.env;
  if (!env || !env.DB) return json({ ok: false, error: 'no-db' }, 500);
  if (!rateLimit(clientIp(context), 'register', 5, 3600)) {
    return json({ ok: false, error: 'rate-limited' }, 429);
  }
  var body;
  try { body = await context.request.json(); } catch (e) { return json({ ok: false, error: 'bad-json' }, 400); }
  var email = String((body && body.email) || '').trim().toLowerCase();
  var password = String((body && body.password) || '');
  if (!isValidEmail(email)) return json({ ok: false, error: 'bad-email' }, 400);
  if (password.length < 8 || password.length > 72) return json({ ok: false, error: 'bad-password' }, 400);

  try {
    var exists = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (exists) return json({ ok: false, error: 'email-taken' }, 409);

    var salt = randomHex(16);
    var passHash = await hashPassword(password, salt, env);
    var ins = await env.DB.prepare(
      'INSERT INTO users (email, pass_hash, salt) VALUES (?, ?, ?)'
    ).bind(email, passHash, salt).run();
    var userId = ins && ins.meta && ins.meta.last_row_id;
    if (!userId) return json({ ok: false, error: 'server-error' }, 500);

    var token = await createSession(env, userId);
    return json(
      { ok: true, user: { id: userId, email: email } },
      200,
      { 'Cache-Control': 'no-store', 'Set-Cookie': sessionCookie(context.request, token, 30 * 86400) }
    );
  } catch (err) {
    return json({ ok: false, error: 'server-error' }, 500);
  }
}

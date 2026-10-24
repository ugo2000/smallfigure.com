/**
 * GET /api/auth/me —— 当前登录用户；未登录返回 401
 */
import { json, getUser } from '../../_lib/auth.js';

export async function onRequestGet(context) {
  var user = await getUser(context);
  if (!user) return json({ ok: false, error: 'no-session' }, 401);
  return json({ ok: true, user: user });
}

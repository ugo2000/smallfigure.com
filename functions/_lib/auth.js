/**
 * 认证共享库：密码哈希 / 会话令牌 / Cookie / 限流
 * 被 functions/api/auth/* 与 functions/api/download/[id].js 引用
 */
var ITER_DEFAULT = 5000;   /* PBKDF2 迭代数：Workers 免费档 CPU 10ms 内的保守值，
                              如需更高强度可 wrangler pages secret put PBKDF2_ITER 120000（付费档） */
var SESSION_DAYS = 30;
var COOKIE_NAME = 'sf_session';

/* ---------- 基础工具 ---------- */
function json(obj, status, headers) {
  return Response.json(obj, {
    status: status || 200,
    headers: headers || { 'Cache-Control': 'no-store' }
  });
}

function toHex(buf) {
  var b = new Uint8Array(buf), s = '';
  for (var i = 0; i < b.length; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
  return s;
}

function randomHex(bytes) {
  var a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return toHex(a.buffer);
}

async function sha256Hex(text) {
  var d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(d);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 120;
}

/* ---------- 密码：PBKDF2-SHA256 加盐哈希（可选全局 pepper） ---------- */
function iterOf(env) {
  var n = parseInt(env && env.PBKDF2_ITER, 10);
  return (n >= 1000 && n <= 500000) ? n : ITER_DEFAULT;
}

async function hashPassword(password, salt, env) {
  var pepper = (env && env.PEPPER) || '';
  var key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password + pepper),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  var bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: iterOf(env), hash: 'SHA-256' },
    key,
    256
  );
  return toHex(bits);
}

/* ---------- 会话 ---------- */
async function createSession(env, userId) {
  var token = randomHex(32);
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, datetime('now', '+" + SESSION_DAYS + " days'))"
  ).bind(await sha256Hex(token), userId).run();
  return token;
}

async function destroySession(env, token) {
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
}

/* 从请求 Cookie 解析会话，返回 user 行或 null（过期顺带清理） */
async function getUser(context) {
  var env = context.env;
  if (!env || !env.DB) return null;
  var cookie = context.request.headers.get('Cookie') || '';
  var m = /(?:^|;\s*)sf_session=([a-f0-9]{64})(?:;|$)/.exec(cookie);
  if (!m) return null;
  var tokenHash = await sha256Hex(m[1]);
  try {
    var res = await env.DB.prepare(
      "SELECT u.id, u.email, u.created_at, u.last_login_at, u.download_count " +
      'FROM sessions s JOIN users u ON u.id = s.user_id ' +
      'WHERE s.token_hash = ? AND s.expires_at > datetime(\'now\')'
    ).bind(tokenHash).first();
    if (!res) {
      await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
      return null;
    }
    return res;
  } catch (e) {
    return null;
  }
}

function sessionCookie(request, token, maxAgeSec) {
  /* Secure 只在 https 下才加：本地 http 开发时浏览器会直接丢弃带 Secure 的 Cookie */
  var secure = false;
  try { secure = new URL(request.url).protocol === 'https:'; } catch (e) { /* 取不到就当 http */ }
  return COOKIE_NAME + '=' + token +
    '; Path=/; HttpOnly; SameSite=Lax' +
    (secure ? '; Secure' : '') +
    (maxAgeSec ? '; Max-Age=' + maxAgeSec : '');
}

/* ---------- 限流（内存级， isolate 重建即重置，挡明批量爆破） ---------- */
var buckets = {};
function rateLimit(ip, key, max, windowSec) {
  var k = key + '|' + ip, now = Date.now() / 1000;
  var b = buckets[k];
  if (!b || now > b.reset) { buckets[k] = { n: 1, reset: now + windowSec }; return true; }
  b.n++;
  return b.n <= max;
}

function clientIp(context) {
  return (context.request.headers.get('CF-Connecting-IP') || 'unknown').slice(0, 64);
}

/* ---------- 管理员校验（stats 接口） ---------- */
function isAdmin(context) {
  var want = context.env && context.env.ADMIN_TOKEN;
  if (!want) return false;
  var got = context.request.headers.get('X-Admin-Token') || '';
  if (got.length !== want.length) return false;
  var diff = 0;
  for (var i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ want.charCodeAt(i);
  return diff === 0;
}

export {
  json, toHex, randomHex, sha256Hex, isValidEmail, iterOf,
  hashPassword, createSession, destroySession, getUser,
  sessionCookie, rateLimit, clientIp, isAdmin
};

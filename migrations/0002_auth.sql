CREATE TABLE IF NOT EXISTS downloads (
  id         TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);

-- 用户表：邮箱登录，PBKDF2-SHA256 加盐哈希（迭代数见 functions/_lib/auth.js）
CREATE TABLE IF NOT EXISTS users (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  email          TEXT NOT NULL UNIQUE,
  pass_hash      TEXT NOT NULL,
  salt           TEXT NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at  TEXT,
  download_count INTEGER NOT NULL DEFAULT 0
);

-- 会话表：Cookie 存原文令牌，库里只存 SHA-256 哈希；支持服务端注销/过期
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- 用户 × 素材 下载计数：归属统计用（全局次数仍看 downloads 表）
CREATE TABLE IF NOT EXISTS user_downloads (
  user_id    INTEGER NOT NULL,
  image_id   TEXT NOT NULL,
  count      INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, image_id)
);

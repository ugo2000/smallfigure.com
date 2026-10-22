CREATE TABLE IF NOT EXISTS downloads (
  id         TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);

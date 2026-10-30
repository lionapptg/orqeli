CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  wallet TEXT NOT NULL UNIQUE,
  x_username TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  rank INTEGER UNIQUE,
  tier TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip_hash TEXT,
  device_hash TEXT
);
CREATE INDEX IF NOT EXISTS idx_applications_status_rank ON applications(status, rank);
CREATE TABLE IF NOT EXISTS mint_allowlist (
  wallet TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  max_mints INTEGER NOT NULL DEFAULT 1
);

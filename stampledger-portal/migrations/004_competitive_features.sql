-- Migration 004: Competitive features (SealPact parity + insurance + API keys)

-- Supersession tracking on stamps
ALTER TABLE stamps ADD COLUMN superseded_by TEXT;
ALTER TABLE stamps ADD COLUMN superseded_at INTEGER;
ALTER TABLE stamps ADD COLUMN supersession_reason TEXT;

-- Scope/liability notes on stamps
ALTER TABLE stamps ADD COLUMN scope_notes TEXT;

-- Insurance snapshot at stamp time (JSON)
ALTER TABLE stamps ADD COLUMN insurance_snapshot TEXT;

-- Insurance fields on professional licenses
ALTER TABLE professional_licenses ADD COLUMN insurance_provider TEXT;
ALTER TABLE professional_licenses ADD COLUMN insurance_policy_number TEXT;
ALTER TABLE professional_licenses ADD COLUMN insurance_coverage_amount INTEGER;
ALTER TABLE professional_licenses ADD COLUMN insurance_expiration_date INTEGER;

-- Stamp stakeholders (recipients/notified parties)
CREATE TABLE IF NOT EXISTS stamp_stakeholders (
    id TEXT PRIMARY KEY NOT NULL,
    stamp_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT,
    notified_at INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_stakeholders_stamp ON stamp_stakeholders(stamp_id);

-- Enhanced verification scans (analytics)
CREATE TABLE IF NOT EXISTS verification_scans (
    id TEXT PRIMARY KEY NOT NULL,
    stamp_id TEXT NOT NULL,
    scanned_at INTEGER NOT NULL DEFAULT (unixepoch()),
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    scan_source TEXT
);
CREATE INDEX IF NOT EXISTS idx_vscans_stamp ON verification_scans(stamp_id);
CREATE INDEX IF NOT EXISTS idx_vscans_time ON verification_scans(scanned_at);

-- API keys for external integrations (insurance companies, etc.)
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT,
    org_id TEXT,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    name TEXT NOT NULL,
    scopes TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    last_used_at INTEGER,
    expires_at INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

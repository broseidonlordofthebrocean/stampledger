-- Add verification_logs table for tracking verification attempts
CREATE TABLE IF NOT EXISTS verification_logs (
  id TEXT PRIMARY KEY,
  stamp_id TEXT NOT NULL REFERENCES stamps(id),
  verified_at INTEGER NOT NULL,
  verifier_ip_hash TEXT,
  verification_method TEXT NOT NULL DEFAULT 'web',
  result TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_stamp ON verification_logs(stamp_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_time ON verification_logs(verified_at);

-- Add qr_code_data column to stamps table for versioned QR payload
ALTER TABLE stamps ADD COLUMN qr_code_data TEXT;

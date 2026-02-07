-- Migration 003: Multi-provider authentication
-- Adds oauth_accounts, webauthn_credentials, auth_challenges tables

-- OAuth linked accounts (Google, Microsoft, Apple)
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at INTEGER,
  id_token TEXT,
  provider_email TEXT,
  provider_name TEXT,
  provider_avatar_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_provider_account
  ON oauth_accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id);

-- WebAuthn credentials (CAC, YubiKey, platform authenticators)
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  credential_public_key TEXT NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  credential_device_type TEXT NOT NULL,
  credential_backed_up INTEGER NOT NULL DEFAULT 0,
  transports TEXT,
  device_name TEXT,
  last_used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wa_user ON webauthn_credentials(user_id);

-- Ephemeral auth challenges (OAuth state/PKCE, WebAuthn challenges)
CREATE TABLE IF NOT EXISTS auth_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  challenge_type TEXT NOT NULL,
  challenge_data TEXT NOT NULL,
  user_id TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

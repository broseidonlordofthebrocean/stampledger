-- Migration: Recreate all tables to match current Drizzle schema
-- Safe to run: database has 0 user data

-- Drop all tables (reverse dependency order)
DROP TABLE IF EXISTS spec_versions;
DROP TABLE IF EXISTS spec_projects;
DROP TABLE IF EXISTS batch_stamps;
DROP TABLE IF EXISTS stamps;
DROP TABLE IF EXISTS document_access_log;
DROP TABLE IF EXISTS document_revisions;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS change_notifications;
DROP TABLE IF EXISTS project_specifications;
DROP TABLE IF EXISTS spec_changes;
DROP TABLE IF EXISTS spec_revisions;
DROP TABLE IF EXISTS specifications;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS programs;
DROP TABLE IF EXISTS org_memberships;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS professional_licenses;
DROP TABLE IF EXISTS users;

-- =============================================================================
-- USERS & AUTH
-- =============================================================================

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  account_type TEXT NOT NULL DEFAULT 'individual',
  is_licensed_professional INTEGER NOT NULL DEFAULT 0,
  pe_license_number TEXT,
  pe_state TEXT,
  pe_public_key TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE TABLE professional_licenses (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_type TEXT NOT NULL,
  license_number TEXT NOT NULL,
  issuing_state TEXT NOT NULL,
  issuing_body TEXT,
  disciplines TEXT,
  status TEXT NOT NULL DEFAULT 'pending_verification',
  issued_date INTEGER,
  expiration_date INTEGER,
  last_verified_at INTEGER,
  verification_source TEXT,
  stamp_token_count INTEGER NOT NULL DEFAULT 0,
  on_chain_credential_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX unique_license ON professional_licenses(license_number, issuing_state);

-- =============================================================================
-- ORGANIZATIONS & MEMBERSHIPS
-- =============================================================================

CREATE TABLE organizations (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  org_type TEXT NOT NULL,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  billing_email TEXT,
  stripe_customer_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  storage_used_bytes INTEGER NOT NULL DEFAULT 0,
  storage_limit_bytes INTEGER NOT NULL DEFAULT 1073741824,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE org_memberships (
  id TEXT PRIMARY KEY NOT NULL,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '{}',
  invited_by TEXT REFERENCES users(id),
  invited_at INTEGER,
  accepted_at INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX unique_membership ON org_memberships(org_id, user_id);

-- =============================================================================
-- PROGRAMS & PROJECTS
-- =============================================================================

CREATE TABLE programs (
  id TEXT PRIMARY KEY NOT NULL,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  project_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY NOT NULL,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  project_number TEXT,
  description TEXT,
  location_address TEXT,
  location_lat REAL,
  location_lng REAL,
  status TEXT NOT NULL DEFAULT 'active',
  program_id TEXT REFERENCES programs(id),
  client_org_id TEXT REFERENCES organizations(id),
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- =============================================================================
-- SPECIFICATIONS & CHANGE TRACKING
-- =============================================================================

CREATE TABLE specifications (
  id TEXT PRIMARY KEY NOT NULL,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  spec_number TEXT NOT NULL,
  discipline TEXT,
  description TEXT,
  current_revision TEXT NOT NULL DEFAULT '0',
  status TEXT NOT NULL DEFAULT 'active',
  owner_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX unique_spec ON specifications(org_id, spec_number);

CREATE TABLE spec_revisions (
  id TEXT PRIMARY KEY NOT NULL,
  spec_id TEXT NOT NULL REFERENCES specifications(id),
  revision_number TEXT NOT NULL,
  revision_label TEXT,
  file_key TEXT,
  file_hash_sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at INTEGER,
  published_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX unique_revision ON spec_revisions(spec_id, revision_number);

CREATE TABLE spec_changes (
  id TEXT PRIMARY KEY NOT NULL,
  spec_revision_id TEXT NOT NULL REFERENCES spec_revisions(id),
  change_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  section_reference TEXT,
  change_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  affects_cost INTEGER NOT NULL DEFAULT 0,
  affects_schedule INTEGER NOT NULL DEFAULT 0,
  estimated_cost_impact TEXT,
  initiated_by TEXT,
  created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX unique_change ON spec_changes(spec_revision_id, change_number);

CREATE TABLE project_specifications (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  spec_id TEXT NOT NULL REFERENCES specifications(id),
  current_applied_revision TEXT NOT NULL,
  latest_available_revision TEXT,
  updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX unique_project_spec ON project_specifications(project_id, spec_id);
CREATE INDEX idx_behind ON project_specifications(spec_id);

CREATE TABLE change_notifications (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL REFERENCES projects(id),
  spec_id TEXT NOT NULL REFERENCES specifications(id),
  spec_revision_id TEXT NOT NULL REFERENCES spec_revisions(id),
  from_revision TEXT,
  to_revision TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT REFERENCES users(id),
  acknowledged_at INTEGER,
  resolved_at INTEGER,
  resolution_notes TEXT,
  created_at INTEGER NOT NULL
);

-- =============================================================================
-- DOCUMENTS & REVISIONS
-- =============================================================================

CREATE TABLE documents (
  id TEXT PRIMARY KEY NOT NULL,
  org_id TEXT REFERENCES organizations(id),
  project_id TEXT REFERENCES projects(id),
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT,
  discipline TEXT,
  current_revision_id TEXT,
  revision_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  parent_spec_id TEXT REFERENCES specifications(id),
  tags TEXT,
  filename TEXT,
  mime_type TEXT,
  size INTEGER,
  r2_key TEXT,
  ipfs_hash TEXT,
  sha256_hash TEXT,
  stamp_id TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  user_id TEXT REFERENCES users(id)
);
CREATE INDEX idx_docs_project ON documents(project_id);
CREATE INDEX idx_docs_org ON documents(org_id);
CREATE INDEX idx_docs_spec ON documents(parent_spec_id);

CREATE TABLE document_revisions (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id),
  revision_number TEXT NOT NULL,
  revision_label TEXT,
  file_key TEXT NOT NULL,
  stamped_file_key TEXT,
  thumbnail_key TEXT,
  file_size_bytes INTEGER NOT NULL,
  file_hash_sha256 TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  page_count INTEGER,
  is_stamped INTEGER NOT NULL DEFAULT 0,
  stamped_by TEXT REFERENCES users(id),
  stamped_at INTEGER,
  stamp_token_id TEXT,
  blockchain_tx_hash TEXT,
  change_summary TEXT,
  change_type TEXT,
  spec_change_ids TEXT,
  uploaded_by TEXT REFERENCES users(id),
  reviewed_by TEXT REFERENCES users(id),
  review_status TEXT NOT NULL DEFAULT 'pending',
  review_comments TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_revisions_doc ON document_revisions(document_id);
CREATE INDEX idx_revisions_stamp ON document_revisions(is_stamped);

CREATE TABLE document_access_log (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL REFERENCES documents(id),
  revision_id TEXT REFERENCES document_revisions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  org_id TEXT REFERENCES organizations(id),
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_access_log_doc ON document_access_log(document_id);
CREATE INDEX idx_access_log_user ON document_access_log(user_id);

-- =============================================================================
-- STAMPS
-- =============================================================================

CREATE TABLE stamps (
  id TEXT PRIMARY KEY NOT NULL,
  blockchain_id TEXT UNIQUE,
  tx_hash TEXT,
  document_hash TEXT NOT NULL,
  jurisdiction_id TEXT NOT NULL,
  project_name TEXT,
  permit_number TEXT,
  notes TEXT,
  document_ipfs_hash TEXT,
  document_filename TEXT,
  document_size INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  revoked_at INTEGER,
  revoked_reason TEXT,
  qr_code_data_url TEXT,
  verify_url TEXT,
  project_id TEXT REFERENCES projects(id),
  org_id TEXT REFERENCES organizations(id),
  document_revision_id TEXT REFERENCES document_revisions(id),
  license_id TEXT REFERENCES professional_licenses(id),
  batch_id TEXT,
  spec_change_ids TEXT,
  review_statement TEXT,
  created_at INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id)
);

CREATE TABLE batch_stamps (
  id TEXT PRIMARY KEY NOT NULL,
  spec_change_ids TEXT NOT NULL,
  project_ids TEXT NOT NULL,
  license_id TEXT NOT NULL REFERENCES professional_licenses(id),
  review_statement TEXT NOT NULL,
  stamps_created INTEGER NOT NULL DEFAULT 0,
  tokens_minted INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  failed_project_ids TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

-- =============================================================================
-- LEGACY TABLES
-- =============================================================================

CREATE TABLE spec_projects (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id)
);

CREATE TABLE spec_versions (
  id TEXT PRIMARY KEY NOT NULL,
  blockchain_id TEXT UNIQUE,
  project_id TEXT NOT NULL REFERENCES spec_projects(id),
  version TEXT NOT NULL,
  spec_hash TEXT NOT NULL,
  spec_ipfs_hash TEXT,
  changelog TEXT,
  parent_version_id TEXT,
  created_at INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id)
);

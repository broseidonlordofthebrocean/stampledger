# STAMPLEDGER — Feature Expansion Specification

**Accounts | Document Storage | Specification Change Tracking**

Version 1.0 | February 2026
Addendum to existing StampLedger architecture (Cosmos SDK + Go/Gin API)

---

## 1. The Problem This Solves

Houston has 120 pump stations getting the same upgrades. Same base design, same spec changes, applied across 120 sites with site-specific variations. Right now the engineering firm managing this has:

- A base specification document that gets revised every time the city or the engineer identifies a change.
- A revision log that lives in an Excel spreadsheet or a Word table that someone manually updates.
- 120 individual project folders, each containing the base spec plus site-specific deviations.
- A PE who stamps each project individually with no systematic way to verify which version of the base spec was used on which site.

When Houston asks "which pump stations have Rev C of the electrical spec applied and which are still on Rev B?" nobody can answer that question without opening 120 folders.

StampLedger solves this by treating specification documents as living, versioned objects that are linked to projects. When the base spec changes from Rev B to Rev C, every project using that spec shows the delta. The PE can review the change once, approve it for all applicable sites, and stamp all 120 projects in a single action. The city can query "show me every project still on Rev B" and get an instant answer.

But to do any of this, StampLedger needs three things it doesn't have yet: a proper account system so that firms and municipalities can manage their people, document storage so the actual files live on the platform, and specification change tracking so revisions are first-class objects in the system.

---

## 2. Account System

Two account types. Individual and Organization. Every user starts as an individual. Organizations contain individuals with assigned roles.

### 2.1 Individual Accounts

An individual account is a person. They can be a PE, an EIT, a municipal inspector, a project manager, or anyone else who needs to interact with the system. Every human gets one individual account. Period.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | UUID | Auto | Primary key |
| email | VARCHAR(255) | Yes | Unique, used for login |
| password_hash | TEXT | Yes | bcrypt, never stored plain |
| first_name | VARCHAR(100) | Yes | |
| last_name | VARCHAR(100) | Yes | |
| phone | VARCHAR(20) | No | For 2FA and notifications |
| avatar_url | TEXT | No | Profile picture |
| account_type | ENUM | Yes | 'individual' always |
| is_licensed_professional | BOOLEAN | Yes | Default false |
| created_at | TIMESTAMPTZ | Auto | |
| updated_at | TIMESTAMPTZ | Auto | |
| last_login_at | TIMESTAMPTZ | Auto | |

### Professional License Record

If `is_licensed_professional` is true, the user has one or more entries in the licenses table. This is the bridge to the existing stamp module.

```sql
CREATE TABLE professional_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_type VARCHAR(50) NOT NULL,
  -- 'PE', 'PLS', 'RA', 'CPA', 'ESQ' (future expansion)
  license_number VARCHAR(100) NOT NULL,
  issuing_state VARCHAR(2) NOT NULL,
  issuing_body VARCHAR(200),
  -- 'Wisconsin DSPS', 'Texas TBPE', etc.
  disciplines TEXT[],
  -- ['civil', 'environmental', 'structural']
  status VARCHAR(20) NOT NULL DEFAULT 'pending_verification',
  -- 'pending_verification', 'active', 'expired', 'suspended', 'revoked'
  issued_date DATE,
  expiration_date DATE,
  last_verified_at TIMESTAMPTZ,
  verification_source VARCHAR(100),
  -- 'state_board_api', 'manual_review', 'user_submitted'
  stamp_token_count INTEGER DEFAULT 0,
  -- Number of tokens earned (1 per stamp, bonus at milestones)
  on_chain_credential_id VARCHAR(255),
  -- Reference to Cosmos credential module
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(license_number, issuing_state)
);
```

### 2.2 Organization Accounts

An organization is a firm, a municipality, a utility district, or any entity that has multiple people who need access. The organization does not log in. People log in with their individual accounts and access the organization's resources based on their role.

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  -- URL-friendly name: 'city-of-houston', 'smith-engineering'
  org_type VARCHAR(50) NOT NULL,
  -- 'engineering_firm', 'municipality', 'utility_district',
  -- 'construction_firm', 'government_agency', 'other'
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  phone VARCHAR(20),
  website VARCHAR(255),
  logo_url TEXT,
  billing_email VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',
  -- 'free', 'starter', 'professional', 'enterprise'
  storage_used_bytes BIGINT DEFAULT 0,
  storage_limit_bytes BIGINT DEFAULT 1073741824,
  -- 1 GB default, increases with plan
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Membership & Roles

One person can belong to multiple organizations. A PE who consults for three firms has three memberships. A municipal inspector might belong to the city org and a regional utility district.

```sql
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL,
  -- 'owner', 'admin', 'manager', 'member', 'viewer'
  permissions JSONB NOT NULL DEFAULT '{}',
  -- Granular overrides, see permissions table below
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active',
  -- 'invited', 'active', 'suspended', 'removed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);
```

### Role Permissions Matrix

| Permission | Owner | Admin | Manager | Member | Viewer |
|------------|-------|-------|---------|--------|--------|
| Manage billing & plan | Yes | No | No | No | No |
| Invite/remove users | Yes | Yes | No | No | No |
| Change user roles | Yes | Yes | No | No | No |
| Create projects | Yes | Yes | Yes | No | No |
| Delete projects | Yes | Yes | No | No | No |
| Upload documents | Yes | Yes | Yes | Yes | No |
| Stamp/approve documents | Yes | Yes | Yes | Yes* | No |
| View projects | Yes | Yes | Yes | Yes | Yes |
| View documents | Yes | Yes | Yes | Yes | Yes |
| Verify stamps | Yes | Yes | Yes | Yes | Yes |
| Edit org settings | Yes | Yes | No | No | No |
| View audit log | Yes | Yes | Yes | No | No |
| Export data | Yes | Yes | Yes | No | No |

*Member can only stamp if they have an active professional license. The stamp permission is gated by the licenses table, not just the role.*

### The Permissions Override (JSONB)

The role sets defaults. The permissions JSONB column on `org_memberships` allows per-user overrides. This handles the case where you want someone to have the 'member' role but also be able to create projects.

```json
// Example: Member who can also create projects
{
  "create_projects": true,
  "delete_projects": false
}

// Resolution logic (in API middleware):
// 1. Check role defaults
// 2. Check JSONB overrides
// 3. Override wins if present
// 4. If neither, deny
```

### 2.3 Auth Flow

Individual signs up with email + password. Gets individual account. Can immediately verify stamps (the core product). To access org features, they either create an org (become owner) or accept an invite to an existing org.

Session management: JWT access tokens (15 min expiry) + refresh tokens (30 day expiry). When a user belongs to multiple orgs, the JWT includes the currently active org context. Switching orgs issues a new JWT.

#### API Endpoints — Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create individual account |
| POST | `/api/v1/auth/login` | Sign in, returns JWT + refresh token |
| POST | `/api/v1/auth/refresh` | Exchange refresh token for new JWT |
| POST | `/api/v1/auth/logout` | Invalidate refresh token |
| POST | `/api/v1/auth/forgot-password` | Send password reset email |
| POST | `/api/v1/auth/reset-password` | Complete password reset |
| POST | `/api/v1/auth/verify-email` | Confirm email address |
| POST | `/api/v1/auth/switch-org/:orgId` | Switch active org context, new JWT |

#### API Endpoints — Organizations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orgs` | Create organization (caller becomes owner) |
| GET | `/api/v1/orgs/:id` | Get organization details |
| PATCH | `/api/v1/orgs/:id` | Update org settings |
| DELETE | `/api/v1/orgs/:id` | Delete org (owner only, requires confirmation) |
| GET | `/api/v1/orgs/:id/members` | List all members |
| POST | `/api/v1/orgs/:id/members/invite` | Invite user by email |
| PATCH | `/api/v1/orgs/:id/members/:userId` | Change role or permissions |
| DELETE | `/api/v1/orgs/:id/members/:userId` | Remove member |
| POST | `/api/v1/orgs/invites/:token/accept` | Accept org invite |
| GET | `/api/v1/me/orgs` | List all orgs the current user belongs to |

---

## 3. Document Storage

Documents live on the platform. Not just hashes. The actual files. This is what makes StampLedger an archive, not just a verification tool.

### 3.1 Storage Architecture

Files are stored in Cloudflare R2 (S3-compatible, zero egress fees). Every file is encrypted at rest with AES-256. The encryption key is derived per-organization, so even if R2 is compromised, files are unreadable without the key from your database.

#### Storage Structure in R2

```
stampledger-docs/
  {org_id}/
    {project_id}/
      {document_id}/
        {revision_id}/
          original.pdf
          stamped.pdf    (with QR code / stamp overlay)
          thumbnail.png  (first page preview)
          metadata.json  (extracted text, page count, etc.)
```

### 3.2 Document Data Model

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  -- What is this document?
  title VARCHAR(500) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  -- 'specification', 'drawing', 'calculation',
  -- 'report', 'correspondence', 'permit', 'other'
  document_number VARCHAR(100),
  -- Client/firm document numbering: 'SP-001', 'DWG-E-100'
  discipline VARCHAR(50),
  -- 'civil', 'structural', 'mechanical', 'electrical',
  -- 'controls', 'process', 'general'
  -- Current state
  current_revision_id UUID,
  -- Points to the latest revision
  revision_count INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'draft',
  -- 'draft', 'in_review', 'stamped', 'superseded', 'archived'
  -- Linking
  parent_spec_id UUID REFERENCES specifications(id),
  -- If this doc is governed by a master spec
  -- Metadata
  tags TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_docs_project ON documents(project_id);
CREATE INDEX idx_docs_org ON documents(org_id);
CREATE INDEX idx_docs_spec ON documents(parent_spec_id);
CREATE INDEX idx_docs_type ON documents(document_type);
```

### Document Revisions

Every time a document changes, a new revision is created. The old revision is never modified or deleted. This is the audit trail.

```sql
CREATE TABLE document_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id),
  revision_number VARCHAR(10) NOT NULL,
  -- 'A', 'B', 'C' or '1', '2', '3' depending on org convention
  revision_label VARCHAR(200),
  -- Human-readable: 'Added VFD specs per city comment'
  -- File storage
  file_key TEXT NOT NULL,
  -- R2 object key: '{org}/{project}/{doc}/{rev}/original.pdf'
  stamped_file_key TEXT,
  -- R2 key for stamped version (after PE approval)
  thumbnail_key TEXT,
  file_size_bytes BIGINT NOT NULL,
  file_hash_sha256 VARCHAR(64) NOT NULL,
  -- Hash of the original uploaded file
  mime_type VARCHAR(100) NOT NULL,
  page_count INTEGER,
  -- Stamp info
  is_stamped BOOLEAN DEFAULT FALSE,
  stamped_by UUID REFERENCES users(id),
  stamped_at TIMESTAMPTZ,
  stamp_token_id VARCHAR(255),
  -- On-chain token reference
  blockchain_tx_hash VARCHAR(255),
  -- Cosmos transaction hash
  -- Change tracking
  change_summary TEXT,
  -- What changed from previous revision
  change_type VARCHAR(30),
  -- 'new', 'minor_revision', 'major_revision', 'addendum'
  spec_change_ids UUID[],
  -- Which specification changes drove this revision
  -- Who and when
  uploaded_by UUID REFERENCES users(id),
  reviewed_by UUID REFERENCES users(id),
  review_status VARCHAR(20) DEFAULT 'pending',
  -- 'pending', 'in_review', 'approved', 'rejected'
  review_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revisions_doc ON document_revisions(document_id, created_at DESC);
CREATE INDEX idx_revisions_stamp ON document_revisions(is_stamped);
```

### 3.3 Upload Flow

Uploads go directly from the client to R2 using presigned URLs. The file never passes through your API server. This keeps your server costs low and upload speeds high.

| Step | What Happens | Where |
|------|-------------|-------|
| 1 | User selects file in the app | Client |
| 2 | Client requests presigned upload URL from API | API server |
| 3 | API validates permissions, generates presigned URL, creates draft revision record | API + R2 |
| 4 | Client uploads file directly to R2 using presigned URL | Client to R2 |
| 5 | Client notifies API that upload is complete | Client to API |
| 6 | API verifies file exists in R2, computes hash, extracts metadata | API + R2 |
| 7 | API generates thumbnail (first page of PDF) | API |
| 8 | Revision record updated with hash, size, page count, status set to 'pending' | API + DB |

#### Upload API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects/:id/documents` | Create new document (metadata only) |
| POST | `/api/v1/documents/:id/revisions/upload-url` | Get presigned upload URL for new revision |
| POST | `/api/v1/documents/:id/revisions/:revId/complete` | Confirm upload, trigger processing |
| GET | `/api/v1/documents/:id` | Get document with all revisions |
| GET | `/api/v1/documents/:id/revisions/:revId/download` | Get presigned download URL |
| GET | `/api/v1/documents/:id/revisions/:revId/stamped` | Download stamped version |
| DELETE | `/api/v1/documents/:id/revisions/:revId` | Delete draft revision (not stamped ones) |

### 3.4 Retention & Access Control

Engineering documents have legal retention requirements. In most jurisdictions, records must be kept for the life of the structure plus 10 years. For public infrastructure, that's effectively forever.

| Rule | Implementation |
|------|---------------|
| Stamped revisions cannot be deleted | Database constraint: ON DELETE RESTRICT where is_stamped = true |
| Draft revisions can be deleted by uploader or admin | Soft delete with 30-day grace period, then hard delete |
| Access is per-org | All queries filtered by org_id from JWT context |
| Cross-org sharing via project invites | Project-level access grants for external orgs (read-only by default) |
| Audit log on every access | Separate access_log table records who downloaded what, when |
| Encryption at rest | AES-256, org-specific key stored in secrets manager (not in DB) |

#### Access Log

```sql
CREATE TABLE document_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id),
  revision_id UUID NOT NULL REFERENCES document_revisions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  org_id UUID REFERENCES organizations(id),
  action VARCHAR(30) NOT NULL,
  -- 'view', 'download', 'print', 'share', 'stamp', 'delete'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_log_doc ON document_access_log(document_id, created_at DESC);
CREATE INDEX idx_access_log_user ON document_access_log(user_id, created_at DESC);
```

---

## 4. Specification Change Tracking

This is the feature that makes StampLedger essential for multi-site programs like Houston's 120 pump stations. A specification is a master document that governs multiple projects. When the spec changes, every affected project needs to respond.

### 4.1 The Data Model

#### Specifications (Master Documents)

A specification is a document that other documents reference. It is not a project document itself. It lives at the organization level and can be linked to any number of projects.

```sql
CREATE TABLE specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  title VARCHAR(500) NOT NULL,
  -- 'Pump Station Electrical Specification'
  spec_number VARCHAR(100) NOT NULL,
  -- 'SP-E-001' or 'Division 26 - Electrical'
  discipline VARCHAR(50),
  description TEXT,
  current_revision VARCHAR(10) DEFAULT '0',
  -- 'A', 'B', 'C' or '0', '1', '2'
  status VARCHAR(30) DEFAULT 'active',
  -- 'draft', 'active', 'superseded', 'archived'
  owner_user_id UUID REFERENCES users(id),
  -- The person responsible for this spec
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, spec_number)
);
```

#### Specification Revisions

Each revision of a spec is a complete snapshot. Revisions are immutable once published.

```sql
CREATE TABLE spec_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spec_id UUID NOT NULL REFERENCES specifications(id),
  revision_number VARCHAR(10) NOT NULL,
  revision_label VARCHAR(200),
  -- 'Updated VFD requirements per city directive 2026-03'
  file_key TEXT,
  -- R2 key for the spec document file
  file_hash_sha256 VARCHAR(64),
  status VARCHAR(20) DEFAULT 'draft',
  -- 'draft', 'published', 'superseded'
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spec_id, revision_number)
);
```

#### Specification Changes (The Delta)

A spec change is a single discrete modification within a revision. When the electrical spec goes from Rev B to Rev C, there might be 5 individual changes: new VFD requirements, updated panel schedule, revised conduit sizing, added surge protection, removed obsolete disconnect spec. Each is tracked separately because different projects may be affected by different changes.

```sql
CREATE TABLE spec_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spec_revision_id UUID NOT NULL REFERENCES spec_revisions(id),
  change_number INTEGER NOT NULL,
  -- Sequential within this revision: 1, 2, 3...
  title VARCHAR(300) NOT NULL,
  -- 'Add VFD requirement for all motors > 5 HP'
  description TEXT NOT NULL,
  -- Full description of what changed and why
  section_reference VARCHAR(100),
  -- Which section of the spec: '26 29 13.2.A'
  change_type VARCHAR(30) NOT NULL,
  -- 'addition', 'modification', 'deletion', 'clarification'
  priority VARCHAR(20) DEFAULT 'normal',
  -- 'critical', 'high', 'normal', 'low', 'informational'
  affects_cost BOOLEAN DEFAULT FALSE,
  affects_schedule BOOLEAN DEFAULT FALSE,
  estimated_cost_impact VARCHAR(200),
  -- 'Add $2,500-4,000 per pump station for VFD'
  initiated_by VARCHAR(200),
  -- 'City of Houston directive 2026-03-15'
  -- or 'Field observation at Station 47'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(spec_revision_id, change_number)
);
```

### 4.2 Linking Specs to Projects

This is where it all connects. A project uses one or more specifications. When a spec changes, the project knows about it.

#### Projects Table

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(300) NOT NULL,
  -- 'Pump Station 47 Upgrade'
  project_number VARCHAR(100),
  -- Client project number: 'PS-047'
  description TEXT,
  location_address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  status VARCHAR(30) DEFAULT 'active',
  -- 'planning', 'active', 'construction', 'complete', 'archived'
  -- Program grouping
  program_id UUID REFERENCES programs(id),
  -- All 120 pump stations belong to one program
  client_org_id UUID REFERENCES organizations(id),
  -- The municipality or owner
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Programs (Grouping Projects)

A program is a collection of related projects. Houston's 120 pump stations are one program. This lets you apply spec changes and run queries at the program level.

```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(300) NOT NULL,
  -- 'Houston Pump Station Upgrade Program'
  description TEXT,
  project_count INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Project-Specification Link

This table tracks which specs each project uses AND which revision of that spec the project is currently on.

```sql
CREATE TABLE project_specifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  spec_id UUID NOT NULL REFERENCES specifications(id),
  current_applied_revision VARCHAR(10) NOT NULL,
  -- Which revision this project is currently built to: 'B'
  latest_available_revision VARCHAR(10),
  -- The newest published revision: 'C'
  is_current BOOLEAN GENERATED ALWAYS AS
    (current_applied_revision = latest_available_revision) STORED,
  -- TRUE if project is on the latest spec revision
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, spec_id)
);

CREATE INDEX idx_project_specs_behind
  ON project_specifications(spec_id)
  WHERE current_applied_revision != latest_available_revision;
  -- Fast query: 'which projects are behind on this spec?'
```

### 4.3 Change Propagation

When a new spec revision is published, the system needs to notify every affected project. Here is the exact flow:

| Step | What Happens | Automated? |
|------|-------------|------------|
| 1 | Spec owner publishes Rev C of the electrical spec | User action |
| 2 | System queries project_specifications for all rows where spec_id matches | Yes |
| 3 | For each linked project, latest_available_revision is updated to 'C' | Yes |
| 4 | is_current becomes FALSE for any project still on Rev B | Yes (computed) |
| 5 | System creates a change_notification record for each affected project | Yes |
| 6 | Project managers/PEs receive notification: 'Electrical spec updated to Rev C' | Yes |
| 7 | Notification includes list of individual changes in Rev C with descriptions | Yes |
| 8 | PE reviews changes, determines which apply to their specific project | User action |
| 9 | PE uploads revised project documents incorporating the spec changes | User action |
| 10 | PE stamps the revised documents, referencing the spec change IDs | User action |
| 11 | current_applied_revision updated to 'C', is_current becomes TRUE | Yes (on stamp) |

#### Change Notifications Table

```sql
CREATE TABLE change_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  spec_id UUID NOT NULL REFERENCES specifications(id),
  spec_revision_id UUID NOT NULL REFERENCES spec_revisions(id),
  from_revision VARCHAR(10),
  to_revision VARCHAR(10),
  status VARCHAR(30) DEFAULT 'pending',
  -- 'pending', 'acknowledged', 'in_progress',
  -- 'applied', 'not_applicable', 'deferred'
  assigned_to UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  -- 'Applied changes 1-3. Change 4 N/A for this station
  --  (no motors > 5 HP). Change 5 deferred to Phase 2.'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 The Houston Query

The entire point of this system. Houston asks: "Which pump stations have Rev C of the electrical spec applied and which are still on Rev B?"

```sql
SELECT
  p.name AS project_name,
  p.project_number,
  ps.current_applied_revision,
  ps.latest_available_revision,
  ps.is_current,
  cn.status AS update_status,
  cn.assigned_to,
  u.first_name || ' ' || u.last_name AS assigned_engineer
FROM projects p
JOIN project_specifications ps ON ps.project_id = p.id
LEFT JOIN change_notifications cn ON cn.project_id = p.id
  AND cn.spec_id = ps.spec_id
  AND cn.to_revision = ps.latest_available_revision
LEFT JOIN users u ON u.id = cn.assigned_to
WHERE p.program_id = '{houston_pump_program_id}'
  AND ps.spec_id = '{electrical_spec_id}'
ORDER BY p.project_number;
```

#### Result

| Station | Number | Applied Rev | Latest Rev | Current? | Status | Assigned To |
|---------|--------|-------------|------------|----------|--------|-------------|
| Pump Station 01 | PS-001 | C | C | Yes | Applied | Jane Smith, PE |
| Pump Station 02 | PS-002 | C | C | Yes | Applied | Jane Smith, PE |
| Pump Station 03 | PS-003 | B | C | No | In Progress | Mike Johnson, PE |
| Pump Station 04 | PS-004 | B | C | No | Pending | Unassigned |
| Pump Station 05 | PS-005 | B | C | No | N/A | Jane Smith, PE |
| ... | ... | ... | ... | ... | ... | ... |
| Pump Station 120 | PS-120 | A | C | No | Pending | Unassigned |

Station 5 is marked N/A because the PE determined the changes in Rev C don't apply to that specific site. Station 120 is still on Rev A, meaning it's two revisions behind. The program manager can see all of this in one view.

---

## 5. Batch Stamping

When a spec change applies uniformly to 80 of 120 stations and the PE has reviewed the change once, they should be able to stamp all 80 in a single action. Not click 80 times.

### 5.1 Batch Stamp Flow

The PE selects a spec change and a set of projects. The system verifies:

1. The PE has an active license in the project jurisdiction.
2. The PE has review access to all selected projects.
3. All selected projects have updated documents uploaded for this revision.
4. No selected project has already been stamped for this revision.

If all checks pass, the system mints one stamp token per project (not one for the batch). Each project gets its own on-chain record because each project is independently liable. But the PE only clicks "stamp" once.

#### Batch Stamp API

```json
// POST /api/v1/stamps/batch
{
  "spec_change_ids": ["uuid1", "uuid2"],
  "project_ids": ["ps001", "ps002", ... "ps080"],
  "license_id": "pe_license_uuid",
  "review_statement": "Reviewed Rev C changes 1-3 for all selected stations. Change 4 confirmed applicable. No site-specific deviations required.",
  "stamp_password": "pe_signing_password"
}

// Response:
{
  "batch_id": "batch_uuid",
  "stamps_created": 80,
  "tokens_minted": 80,
  "blockchain_tx_hashes": ["tx1", "tx2", ... "tx80"],
  "failed": [],
  "pe_token_count_new": 230
}
```

### 5.2 Token Minting on Batch Stamp

Each stamp in the batch mints a token. The PE's token count increments by the number of projects stamped. Milestone bonuses apply:

| Milestone | Bonus Tokens | Total at Milestone |
|-----------|-------------|-------------------|
| Every project stamped | +1 | Running count |
| Every 5th stamp | +5 bonus | +6 that round |
| Every 25th stamp | +10 bonus | +11 that round |
| Every 100th stamp | +25 bonus | +26 that round |

So a PE who batch-stamps 80 projects earns 80 base tokens plus the milestone bonuses hit along the way. The tokens accumulate on their professional license record and are visible to anyone looking up that PE on the platform.

---

## 6. Key Queries & Dashboard Views

The value of this system is in the queries it can answer that nobody can answer today.

### 6.1 Program Dashboard

A single view showing compliance status across an entire program.

| Query | Who Needs It | API Endpoint |
|-------|-------------|-------------|
| Which projects are behind on spec X? | Program Manager | `GET /api/v1/programs/:id/compliance?specId=X` |
| What changed between Rev B and Rev C? | PE, Inspector | `GET /api/v1/specs/:id/diff?from=B&to=C` |
| Who stamped project Y and when? | Inspector, Legal | `GET /api/v1/projects/:id/stamps` |
| Show me all documents for Station 47 | Anyone with access | `GET /api/v1/projects/:id/documents` |
| Which PEs have stamped projects in this program? | Program Manager | `GET /api/v1/programs/:id/engineers` |
| How many projects has this PE stamped? | Anyone (public) | `GET /api/v1/engineers/:licenseId/tokens` |
| What is the total cost impact of Rev C changes? | Program Manager | `GET /api/v1/specs/:id/revisions/C/impact` |
| Show me Station 47's full revision history | PE, Inspector | `GET /api/v1/projects/:id/history` |
| Which changes are deferred across the program? | Program Manager | `GET /api/v1/programs/:id/deferred` |
| Export compliance report for city council | Administrator | `GET /api/v1/programs/:id/compliance/export` |

### 6.2 Engineer Dashboard

Each PE sees their own view:

1. Token count (the number, front and center)
2. Active assignments (change notifications assigned to them)
3. Recent stamps (last 30 days of stamping activity)
4. License status (active, expiration date, renewal reminder)
5. Projects they have stamped (full history, searchable)

### 6.3 Inspector / Verifier View

The municipal inspector pulls up a project and sees:

1. Current spec compliance (green = current, yellow = in progress, red = behind)
2. All stamped documents with QR verification
3. Which PE stamped each document
4. The PE's token count and license status at time of stamping
5. Full revision timeline showing how the project evolved

---

## 7. Pricing Model

Keep it simple. Tool sale where possible, subscription only where the ongoing cost justifies it.

| Plan | Price | Includes | Target |
|------|-------|----------|--------|
| Free (Individual) | $0 | Stamp verification only. Verify any stamp, view public PE token counts. No document storage. | Inspectors, public |
| Starter (Org) | $99/month | Up to 5 users, 10 GB storage, 50 projects, spec tracking, all features. | Small firms, small municipalities |
| Professional (Org) | $299/month | Up to 25 users, 100 GB storage, unlimited projects, batch stamping, API access, priority support. | Mid-size firms, mid-size municipalities |
| Enterprise (Org) | Custom | Unlimited users, unlimited storage, custom integrations, dedicated support, SLA, SSO/SAML. | Large firms, large cities like Houston |

### 7.1 Additional Revenue Lines

1. **Archive storage overage:** $0.10/GB/month beyond plan limit.
2. **API calls beyond plan limit:** $0.01 per verification call (free tier gets 100/month).
3. **Export/compliance reports:** Included in Professional and above, $10 per report on Starter.
4. **Insurance data licensing:** Future revenue. Anonymized aggregate data on stamp volumes, disciplines, project types sold to E&O insurers.

### 7.2 Why This Is Not Just a Subscription

The subscription covers the platform access, storage, and ongoing features. But the real value compounds over time. An org that has 3 years of project history, revision trails, and stamp records on StampLedger cannot switch to a competitor without losing their archive. The retention IS the moat. This is one of the few cases where a subscription is justified because the ongoing storage and verification infrastructure has real marginal cost and the value to the customer increases with time.

---

## 8. Build Order

These features layer onto your existing StampLedger architecture. Build in this order.

### Phase A: Accounts (2 weeks)

- [ ] Users table + auth (Supabase or roll your own with bcrypt + JWT)
- [ ] Organizations table
- [ ] Memberships + roles + permissions
- [ ] Invite flow (email invite, accept, join org)
- [ ] Org switching in JWT
- [ ] Professional licenses table
- [ ] License verification integration (start with Wisconsin DSPS)
- [ ] API endpoints for auth, orgs, members
- [ ] Basic web UI: login, org dashboard, member management

### Phase B: Document Storage (2 weeks)

- [ ] R2 bucket setup with encryption
- [ ] Documents + document_revisions tables
- [ ] Presigned upload URL flow
- [ ] Upload completion + hash verification
- [ ] Thumbnail generation (PDF first page)
- [ ] Download with presigned URLs
- [ ] Access log table
- [ ] Storage tracking per org
- [ ] Web UI: upload, browse, download documents

### Phase C: Projects & Programs (1 week)

- [ ] Projects table
- [ ] Programs table
- [ ] Link documents to projects
- [ ] Project dashboard view
- [ ] Program dashboard view (list all projects in program)

### Phase D: Specification Tracking (2 weeks)

- [ ] Specifications table
- [ ] Spec revisions table
- [ ] Spec changes table
- [ ] Project-specification link table
- [ ] Change notifications table
- [ ] Publish revision flow (auto-notify all linked projects)
- [ ] Change notification resolution workflow
- [ ] Compliance query: which projects are behind
- [ ] Spec diff view: what changed between revisions
- [ ] Web UI: spec management, change tracking, compliance dashboard

### Phase E: Batch Stamping + Tokens (1 week)

- [ ] Batch stamp API endpoint
- [ ] Pre-stamp validation (license, access, documents uploaded)
- [ ] Multi-project token minting (Cosmos integration)
- [ ] Milestone bonus calculation
- [ ] Token count display on engineer profiles
- [ ] Batch stamp confirmation UI

### Phase F: Integration with Existing Chain (1 week)

- [ ] Connect stamp events to Cosmos stamp module
- [ ] Connect license records to Cosmos credential module
- [ ] QR code generation linking to on-chain verification
- [ ] Public verification page (no login required)

---

**Total additional build time: 9 weeks** on top of existing 12-week StampLedger core roadmap.

**Realistic timeline with Q3 target:** Core chain + these features = launch-ready by August–September 2026.

---

*The first cut that eventually fells a forest.*

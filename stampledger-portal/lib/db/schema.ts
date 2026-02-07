import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core'

// =============================================================================
// USERS & AUTHENTICATION
// =============================================================================

// Individual user accounts
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),

  // Name fields (expanded from single 'name')
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),

  // Account type and status
  accountType: text('account_type').notNull().default('individual'), // 'individual' always
  isLicensedProfessional: integer('is_licensed_professional', { mode: 'boolean' }).notNull().default(false),

  // Legacy PE fields (kept for backward compatibility, new data goes to professionalLicenses)
  peLicenseNumber: text('pe_license_number'),
  peState: text('pe_state'),
  pePublicKey: text('pe_public_key'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),
})

// Professional licenses (PE, PLS, RA, etc.)
export const professionalLicenses = sqliteTable('professional_licenses', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  licenseType: text('license_type').notNull(), // 'PE', 'PLS', 'RA', 'CPA', 'ESQ'
  licenseNumber: text('license_number').notNull(),
  issuingState: text('issuing_state').notNull(), // 2-letter state code
  issuingBody: text('issuing_body'), // 'Wisconsin DSPS', 'Texas TBPE'
  disciplines: text('disciplines'), // JSON array: ['civil', 'environmental', 'structural']

  status: text('status').notNull().default('pending_verification'),
  // 'pending_verification', 'active', 'expired', 'suspended', 'revoked'

  issuedDate: integer('issued_date', { mode: 'timestamp' }),
  expirationDate: integer('expiration_date', { mode: 'timestamp' }),
  lastVerifiedAt: integer('last_verified_at', { mode: 'timestamp' }),
  verificationSource: text('verification_source'), // 'state_board_api', 'manual_review', 'user_submitted'

  // Token tracking
  stampTokenCount: integer('stamp_token_count').notNull().default(0),
  onChainCredentialId: text('on_chain_credential_id'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  uniqueLicense: uniqueIndex('unique_license').on(table.licenseNumber, table.issuingState),
}))

// =============================================================================
// ORGANIZATIONS & MEMBERSHIPS
// =============================================================================

// Organization accounts (firms, municipalities, utility districts)
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(), // URL-friendly: 'city-of-houston'

  orgType: text('org_type').notNull(),
  // 'engineering_firm', 'municipality', 'utility_district', 'construction_firm', 'government_agency', 'other'

  // Address
  addressLine1: text('address_line1'),
  addressLine2: text('address_line2'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),

  phone: text('phone'),
  website: text('website'),
  logoUrl: text('logo_url'),

  // Billing
  billingEmail: text('billing_email'),
  stripeCustomerId: text('stripe_customer_id'),
  plan: text('plan').notNull().default('free'), // 'free', 'starter', 'professional', 'enterprise'

  // Storage tracking
  storageUsedBytes: integer('storage_used_bytes').notNull().default(0),
  storageLimitBytes: integer('storage_limit_bytes').notNull().default(1073741824), // 1 GB

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Organization memberships (users belonging to orgs)
export const orgMemberships = sqliteTable('org_memberships', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  role: text('role').notNull(), // 'owner', 'admin', 'manager', 'member', 'viewer'
  permissions: text('permissions').notNull().default('{}'), // JSON for granular overrides

  invitedBy: text('invited_by').references(() => users.id),
  invitedAt: integer('invited_at', { mode: 'timestamp' }),
  acceptedAt: integer('accepted_at', { mode: 'timestamp' }),

  status: text('status').notNull().default('active'), // 'invited', 'active', 'suspended', 'removed'

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  uniqueMembership: uniqueIndex('unique_membership').on(table.orgId, table.userId),
}))

// =============================================================================
// PROGRAMS & PROJECTS
// =============================================================================

// Programs (grouping of related projects, e.g., Houston's 120 pump stations)
export const programs = sqliteTable('programs', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organizations.id),

  name: text('name').notNull(),
  description: text('description'),
  projectCount: integer('project_count').notNull().default(0),
  status: text('status').notNull().default('active'), // 'active', 'complete', 'archived'

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// Projects (individual work items)
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organizations.id),

  name: text('name').notNull(),
  projectNumber: text('project_number'), // Client project number: 'PS-047'
  description: text('description'),

  // Location
  locationAddress: text('location_address'),
  locationLat: real('location_lat'),
  locationLng: real('location_lng'),

  status: text('status').notNull().default('active'),
  // 'planning', 'active', 'construction', 'complete', 'archived'

  // Program grouping
  programId: text('program_id').references(() => programs.id),

  // Client org (municipality or owner)
  clientOrgId: text('client_org_id').references(() => organizations.id),

  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// =============================================================================
// SPECIFICATIONS & CHANGE TRACKING
// =============================================================================

// Master specifications (org-level documents that govern projects)
export const specifications = sqliteTable('specifications', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organizations.id),

  title: text('title').notNull(), // 'Pump Station Electrical Specification'
  specNumber: text('spec_number').notNull(), // 'SP-E-001' or 'Division 26 - Electrical'
  discipline: text('discipline'), // 'civil', 'structural', 'electrical', etc.
  description: text('description'),

  currentRevision: text('current_revision').notNull().default('0'), // 'A', 'B', 'C' or '0', '1', '2'
  status: text('status').notNull().default('active'), // 'draft', 'active', 'superseded', 'archived'

  ownerUserId: text('owner_user_id').references(() => users.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  uniqueSpec: uniqueIndex('unique_spec').on(table.orgId, table.specNumber),
}))

// Specification revisions (immutable snapshots)
export const specRevisions = sqliteTable('spec_revisions', {
  id: text('id').primaryKey(),
  specId: text('spec_id').notNull().references(() => specifications.id),

  revisionNumber: text('revision_number').notNull(), // 'A', 'B', 'C'
  revisionLabel: text('revision_label'), // 'Updated VFD requirements per city directive'

  // File storage
  fileKey: text('file_key'), // R2 key for spec document
  fileHashSha256: text('file_hash_sha256'),

  status: text('status').notNull().default('draft'), // 'draft', 'published', 'superseded'
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  publishedBy: text('published_by').references(() => users.id),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  uniqueRevision: uniqueIndex('unique_revision').on(table.specId, table.revisionNumber),
}))

// Individual specification changes (deltas within a revision)
export const specChanges = sqliteTable('spec_changes', {
  id: text('id').primaryKey(),
  specRevisionId: text('spec_revision_id').notNull().references(() => specRevisions.id),

  changeNumber: integer('change_number').notNull(), // Sequential: 1, 2, 3...
  title: text('title').notNull(), // 'Add VFD requirement for all motors > 5 HP'
  description: text('description').notNull(),
  sectionReference: text('section_reference'), // '26 29 13.2.A'

  changeType: text('change_type').notNull(), // 'addition', 'modification', 'deletion', 'clarification'
  priority: text('priority').notNull().default('normal'), // 'critical', 'high', 'normal', 'low', 'informational'

  affectsCost: integer('affects_cost', { mode: 'boolean' }).notNull().default(false),
  affectsSchedule: integer('affects_schedule', { mode: 'boolean' }).notNull().default(false),
  estimatedCostImpact: text('estimated_cost_impact'), // 'Add $2,500-4,000 per pump station for VFD'

  initiatedBy: text('initiated_by'), // 'City of Houston directive 2026-03-15'

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  uniqueChange: uniqueIndex('unique_change').on(table.specRevisionId, table.changeNumber),
}))

// Project-specification links (which specs each project uses)
export const projectSpecifications = sqliteTable('project_specifications', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  specId: text('spec_id').notNull().references(() => specifications.id),

  currentAppliedRevision: text('current_applied_revision').notNull(), // 'B'
  latestAvailableRevision: text('latest_available_revision'), // 'C'
  // isCurrent is computed: currentAppliedRevision === latestAvailableRevision

  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  uniqueProjectSpec: uniqueIndex('unique_project_spec').on(table.projectId, table.specId),
  idxBehind: index('idx_behind').on(table.specId),
}))

// Change notifications (when specs update, notify affected projects)
export const changeNotifications = sqliteTable('change_notifications', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  specId: text('spec_id').notNull().references(() => specifications.id),
  specRevisionId: text('spec_revision_id').notNull().references(() => specRevisions.id),

  fromRevision: text('from_revision'),
  toRevision: text('to_revision'),

  status: text('status').notNull().default('pending'),
  // 'pending', 'acknowledged', 'in_progress', 'applied', 'not_applicable', 'deferred'

  assignedTo: text('assigned_to').references(() => users.id),
  acknowledgedAt: integer('acknowledged_at', { mode: 'timestamp' }),
  resolvedAt: integer('resolved_at', { mode: 'timestamp' }),
  resolutionNotes: text('resolution_notes'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// =============================================================================
// DOCUMENTS & REVISIONS
// =============================================================================

// Documents (enhanced with project/org context)
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  orgId: text('org_id').references(() => organizations.id),
  projectId: text('project_id').references(() => projects.id),

  // Document metadata
  title: text('title').notNull(),
  documentType: text('document_type').notNull(),
  // 'specification', 'drawing', 'calculation', 'report', 'correspondence', 'permit', 'other'
  documentNumber: text('document_number'), // 'SP-001', 'DWG-E-100'
  discipline: text('discipline'), // 'civil', 'structural', 'mechanical', 'electrical'

  // Current state
  currentRevisionId: text('current_revision_id'),
  revisionCount: integer('revision_count').notNull().default(0),
  status: text('status').notNull().default('draft'),
  // 'draft', 'in_review', 'stamped', 'superseded', 'archived'

  // Link to master spec (if governed by one)
  parentSpecId: text('parent_spec_id').references(() => specifications.id),

  // Tags stored as JSON array
  tags: text('tags'), // JSON array

  // Legacy fields for backward compatibility
  filename: text('filename'),
  mimeType: text('mime_type'),
  size: integer('size'),
  r2Key: text('r2_key'),
  ipfsHash: text('ipfs_hash'),
  sha256Hash: text('sha256_hash'),
  stampId: text('stamp_id'),

  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),

  // Legacy userId for backward compatibility
  userId: text('user_id').references(() => users.id),
}, (table) => ({
  idxProject: index('idx_docs_project').on(table.projectId),
  idxOrg: index('idx_docs_org').on(table.orgId),
  idxSpec: index('idx_docs_spec').on(table.parentSpecId),
}))

// Document revisions (audit trail)
export const documentRevisions = sqliteTable('document_revisions', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => documents.id),

  revisionNumber: text('revision_number').notNull(), // 'A', 'B', 'C' or '1', '2', '3'
  revisionLabel: text('revision_label'), // 'Added VFD specs per city comment'

  // File storage
  fileKey: text('file_key').notNull(), // R2 key
  stampedFileKey: text('stamped_file_key'), // R2 key for stamped version
  thumbnailKey: text('thumbnail_key'),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  fileHashSha256: text('file_hash_sha256').notNull(),
  mimeType: text('mime_type').notNull(),
  pageCount: integer('page_count'),

  // Stamp info
  isStamped: integer('is_stamped', { mode: 'boolean' }).notNull().default(false),
  stampedBy: text('stamped_by').references(() => users.id),
  stampedAt: integer('stamped_at', { mode: 'timestamp' }),
  stampTokenId: text('stamp_token_id'),
  blockchainTxHash: text('blockchain_tx_hash'),

  // Change tracking
  changeSummary: text('change_summary'),
  changeType: text('change_type'), // 'new', 'minor_revision', 'major_revision', 'addendum'
  specChangeIds: text('spec_change_ids'), // JSON array of UUIDs

  // Review workflow
  uploadedBy: text('uploaded_by').references(() => users.id),
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewStatus: text('review_status').notNull().default('pending'),
  // 'pending', 'in_review', 'approved', 'rejected'
  reviewComments: text('review_comments'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  idxRevDoc: index('idx_revisions_doc').on(table.documentId),
  idxStamped: index('idx_revisions_stamp').on(table.isStamped),
}))

// Document access log (audit trail)
export const documentAccessLog = sqliteTable('document_access_log', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull().references(() => documents.id),
  revisionId: text('revision_id').references(() => documentRevisions.id),
  userId: text('user_id').notNull().references(() => users.id),
  orgId: text('org_id').references(() => organizations.id),

  action: text('action').notNull(), // 'view', 'download', 'print', 'share', 'stamp', 'delete'
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  idxAccessDoc: index('idx_access_log_doc').on(table.documentId),
  idxAccessUser: index('idx_access_log_user').on(table.userId),
}))

// =============================================================================
// STAMPS (Enhanced)
// =============================================================================

export const stamps = sqliteTable('stamps', {
  id: text('id').primaryKey(),
  blockchainId: text('blockchain_id').unique(),
  txHash: text('tx_hash'),

  documentHash: text('document_hash').notNull(),
  jurisdictionId: text('jurisdiction_id').notNull(),
  projectName: text('project_name'),
  permitNumber: text('permit_number'),
  notes: text('notes'),

  // Document info
  documentIpfsHash: text('document_ipfs_hash'),
  documentFilename: text('document_filename'),
  documentSize: integer('document_size'),

  // Status
  status: text('status').notNull().default('active'), // 'active', 'revoked'
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  revokedReason: text('revoked_reason'),

  // QR code
  qrCodeDataUrl: text('qr_code_data_url'),
  verifyUrl: text('verify_url'),

  // Project/org context (new)
  projectId: text('project_id').references(() => projects.id),
  orgId: text('org_id').references(() => organizations.id),
  documentRevisionId: text('document_revision_id').references(() => documentRevisions.id),
  licenseId: text('license_id').references(() => professionalLicenses.id),

  // Batch stamping (new)
  batchId: text('batch_id'),
  specChangeIds: text('spec_change_ids'), // JSON array
  reviewStatement: text('review_statement'),

  // QR code versioned payload
  qrCodeData: text('qr_code_data'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  userId: text('user_id').notNull().references(() => users.id),
})

// Batch stamp operations
export const batchStamps = sqliteTable('batch_stamps', {
  id: text('id').primaryKey(),

  specChangeIds: text('spec_change_ids').notNull(), // JSON array
  projectIds: text('project_ids').notNull(), // JSON array
  licenseId: text('license_id').notNull().references(() => professionalLicenses.id),

  reviewStatement: text('review_statement').notNull(),
  stampsCreated: integer('stamps_created').notNull().default(0),
  tokensMinted: integer('tokens_minted').notNull().default(0),

  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'completed', 'failed'
  failedProjectIds: text('failed_project_ids'), // JSON array

  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
})

// =============================================================================
// VERIFICATION LOGS
// =============================================================================

export const verificationLogs = sqliteTable('verification_logs', {
  id: text('id').primaryKey(),
  stampId: text('stamp_id').notNull().references(() => stamps.id),
  verifiedAt: integer('verified_at', { mode: 'timestamp' }).notNull(),
  verifierIpHash: text('verifier_ip_hash'),
  verificationMethod: text('verification_method').notNull().default('web'), // 'web', 'api', 'extension', 'acrobat'
  result: text('result').notNull(), // 'valid', 'invalid', 'revoked', 'not_found'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  idxStamp: index('idx_verification_logs_stamp').on(table.stampId),
  idxTime: index('idx_verification_logs_time').on(table.verifiedAt),
}))

// =============================================================================
// OAUTH & MULTI-PROVIDER AUTHENTICATION
// =============================================================================

// OAuth linked accounts (Google, Microsoft, Apple)
export const oauthAccounts = sqliteTable('oauth_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  provider: text('provider').notNull(), // 'google', 'microsoft', 'apple'
  providerAccountId: text('provider_account_id').notNull(),

  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  idToken: text('id_token'),

  providerEmail: text('provider_email'),
  providerName: text('provider_name'),
  providerAvatarUrl: text('provider_avatar_url'),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  uniqueProviderAccount: uniqueIndex('unique_provider_account').on(table.provider, table.providerAccountId),
  idxOauthUser: index('idx_oauth_user').on(table.userId),
}))

// WebAuthn credentials (CAC, YubiKey, platform authenticators)
export const webauthnCredentials = sqliteTable('webauthn_credentials', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  credentialId: text('credential_id').notNull().unique(),
  credentialPublicKey: text('credential_public_key').notNull(),
  counter: integer('counter').notNull().default(0),
  credentialDeviceType: text('credential_device_type').notNull(), // 'singleDevice' or 'multiDevice'
  credentialBackedUp: integer('credential_backed_up', { mode: 'boolean' }).notNull().default(false),
  transports: text('transports'), // JSON array: ['usb', 'nfc', 'ble', 'internal', 'smart-card']

  deviceName: text('device_name'), // User label: "YubiKey 5", "CAC Reader"
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  idxWaUser: index('idx_wa_user').on(table.userId),
}))

// Ephemeral auth challenges (OAuth state/PKCE, WebAuthn challenges)
export const authChallenges = sqliteTable('auth_challenges', {
  id: text('id').primaryKey(),
  challengeType: text('challenge_type').notNull(), // 'oauth_state', 'webauthn_register', 'webauthn_authenticate'
  challengeData: text('challenge_data').notNull(), // JSON blob
  userId: text('user_id'), // Set when linking to existing account
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// =============================================================================
// LEGACY TABLES (kept for backward compatibility)
// =============================================================================

// Spec Projects table (legacy - replaced by specifications)
export const specProjects = sqliteTable('spec_projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  userId: text('user_id').notNull().references(() => users.id),
})

// Spec Versions table (legacy - replaced by specRevisions)
export const specVersions = sqliteTable('spec_versions', {
  id: text('id').primaryKey(),
  blockchainId: text('blockchain_id').unique(),
  projectId: text('project_id').notNull().references(() => specProjects.id),
  version: text('version').notNull(),
  specHash: text('spec_hash').notNull(),
  specIpfsHash: text('spec_ipfs_hash'),
  changelog: text('changelog'),
  parentVersionId: text('parent_version_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  userId: text('user_id').notNull().references(() => users.id),
})

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type ProfessionalLicense = typeof professionalLicenses.$inferSelect
export type NewProfessionalLicense = typeof professionalLicenses.$inferInsert
export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert
export type OrgMembership = typeof orgMemberships.$inferSelect
export type NewOrgMembership = typeof orgMemberships.$inferInsert
export type Program = typeof programs.$inferSelect
export type NewProgram = typeof programs.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Specification = typeof specifications.$inferSelect
export type NewSpecification = typeof specifications.$inferInsert
export type SpecRevision = typeof specRevisions.$inferSelect
export type NewSpecRevision = typeof specRevisions.$inferInsert
export type SpecChange = typeof specChanges.$inferSelect
export type NewSpecChange = typeof specChanges.$inferInsert
export type ProjectSpecification = typeof projectSpecifications.$inferSelect
export type NewProjectSpecification = typeof projectSpecifications.$inferInsert
export type ChangeNotification = typeof changeNotifications.$inferSelect
export type NewChangeNotification = typeof changeNotifications.$inferInsert
export type Document = typeof documents.$inferSelect
export type NewDocument = typeof documents.$inferInsert
export type DocumentRevision = typeof documentRevisions.$inferSelect
export type NewDocumentRevision = typeof documentRevisions.$inferInsert
export type DocumentAccessLog = typeof documentAccessLog.$inferSelect
export type NewDocumentAccessLog = typeof documentAccessLog.$inferInsert
export type Stamp = typeof stamps.$inferSelect
export type NewStamp = typeof stamps.$inferInsert
export type BatchStamp = typeof batchStamps.$inferSelect
export type NewBatchStamp = typeof batchStamps.$inferInsert
export type SpecProject = typeof specProjects.$inferSelect
export type NewSpecProject = typeof specProjects.$inferInsert
export type SpecVersion = typeof specVersions.$inferSelect
export type NewSpecVersion = typeof specVersions.$inferInsert
export type VerificationLog = typeof verificationLogs.$inferSelect
export type NewVerificationLog = typeof verificationLogs.$inferInsert
export type OAuthAccount = typeof oauthAccounts.$inferSelect
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert
export type WebAuthnCredential = typeof webauthnCredentials.$inferSelect
export type NewWebAuthnCredential = typeof webauthnCredentials.$inferInsert
export type AuthChallenge = typeof authChallenges.$inferSelect
export type NewAuthChallenge = typeof authChallenges.$inferInsert

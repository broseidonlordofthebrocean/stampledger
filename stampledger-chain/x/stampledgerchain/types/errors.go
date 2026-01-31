package types

// DONTCOVER

import (
	"cosmossdk.io/errors"
)

// x/stampledgerchain module sentinel errors
var (
	ErrInvalidSigner = errors.Register(ModuleName, 1100, "expected gov account as only signer for proposal message")

	// Stamp errors
	ErrInvalidDocumentHash  = errors.Register(ModuleName, 1101, "invalid document hash: must be 64 hex characters (SHA-256)")
	ErrInvalidPublicKey     = errors.Register(ModuleName, 1102, "invalid PE public key: must be 64 hex characters (Ed25519)")
	ErrInvalidSignature     = errors.Register(ModuleName, 1103, "signature verification failed")
	ErrStampNotFound        = errors.Register(ModuleName, 1104, "stamp not found")
	ErrStampAlreadyRevoked  = errors.Register(ModuleName, 1105, "stamp is already revoked")
	ErrUnauthorized         = errors.Register(ModuleName, 1106, "unauthorized: sender is not authorized for this action")
	ErrDuplicateStamp       = errors.Register(ModuleName, 1107, "stamp already exists for this document and PE")

	// Document errors
	ErrInvalidIpfsHash  = errors.Register(ModuleName, 1110, "invalid IPFS hash format")
	ErrDocumentNotFound = errors.Register(ModuleName, 1111, "document not found")

	// Entity errors
	ErrEntityNotFound   = errors.Register(ModuleName, 1120, "entity not found")
	ErrInvalidEntityType = errors.Register(ModuleName, 1121, "invalid entity type: must be 'company', 'municipality', or 'firm'")
	ErrMemberNotFound   = errors.Register(ModuleName, 1122, "member not found in entity")
	ErrInvalidRole      = errors.Register(ModuleName, 1123, "invalid role: must be 'viewer', 'editor', or 'admin'")

	// Spec version errors
	ErrSpecVersionNotFound   = errors.Register(ModuleName, 1130, "spec version not found")
	ErrParentVersionNotFound = errors.Register(ModuleName, 1131, "parent version not found")
	ErrInvalidVersion        = errors.Register(ModuleName, 1132, "invalid version format")
)

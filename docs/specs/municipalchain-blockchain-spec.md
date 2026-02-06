# MunicipalChain - Blockchain Implementation Specification

**Project:** MunicipalChain (Cosmos SDK)  
**Purpose:** Blockchain for StampLedger PE stamp verification  
**Language:** Go  
**Framework:** Cosmos SDK  
**Timeline:** 4-6 weeks

---

## Project Overview

Build a permissioned blockchain using Cosmos SDK that stores immutable PE stamp records. This blockchain will be:
- **Permissioned**: Only approved municipalities can run validator nodes
- **Fast**: 3-5 second block finality
- **Scalable**: Handle 1M+ stamps per year
- **Government-grade**: SOC 2 compliant, auditable

---

## Why Cosmos SDK?

**Pros:**
- ✅ Production-ready (Binance Chain, Crypto.com, Osmosis use it)
- ✅ Well-documented
- ✅ Written in Go (good performance, easy to hire for)
- ✅ Can launch custom blockchain in weeks, not months
- ✅ Inter-blockchain communication (IBC) for future expansion
- ✅ Built-in CLI, REST API, gRPC

**Cons:**
- ⚠️ Learning curve (but manageable)
- ⚠️ Need to understand Tendermint consensus

---

## Tech Stack

```json
{
  "blockchain": "Cosmos SDK v0.50",
  "consensus": "CometBFT (Tendermint)",
  "language": "Go 1.21+",
  "database": "LevelDB (default) or RocksDB",
  "api": "gRPC + REST (auto-generated)",
  "cli": "cobra (built-in)"
}
```

---

## Project Structure

```
municipalchain/
├── cmd/
│   └── municipalchaind/
│       └── main.go                    # Blockchain daemon entry point
├── x/                                 # Custom modules
│   └── stamp/                         # PE stamp module
│       ├── keeper/                    # State management
│       │   ├── keeper.go
│       │   ├── msg_server.go         # Transaction handlers
│       │   ├── query.go              # Query handlers
│       │   └── stamp.go              # Stamp CRUD operations
│       ├── types/                     # Data structures
│       │   ├── stamp.pb.go           # Protobuf generated
│       │   ├── messages.go           # Transaction messages
│       │   ├── keys.go               # Storage keys
│       │   ├── codec.go              # Encoding
│       │   ├── errors.go             # Custom errors
│       │   └── events.go             # Event definitions
│       ├── genesis.go                 # Genesis state
│       ├── module.go                  # Module definition
│       └── simulation.go              # Testing
├── proto/
│   └── municipalchain/
│       └── stamp/
│           ├── v1/
│           │   ├── stamp.proto       # Stamp data structure
│           │   ├── tx.proto          # Transaction definitions
│           │   └── query.proto       # Query definitions
│           └── module.proto           # Module config
├── scripts/
│   ├── init-testnet.sh               # Initialize 3-node testnet
│   ├── create-stamp.sh               # CLI helper scripts
│   └── verify-stamp.sh
├── docs/
│   ├── architecture.md
│   ├── api.md
│   └── validator-setup.md
├── config/
│   ├── app.toml                      # App configuration
│   ├── config.toml                   # Tendermint config
│   └── genesis.json                  # Genesis file template
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

---

## Data Models (Protobuf Definitions)

### Stamp Structure

**File:** `proto/municipalchain/stamp/v1/stamp.proto`

```protobuf
syntax = "proto3";
package municipalchain.stamp.v1;

import "google/protobuf/timestamp.proto";
import "cosmos_proto/cosmos.proto";

option go_package = "github.com/stampledger/municipalchain/x/stamp/types";

// Stamp represents a PE stamp record on the blockchain
message Stamp {
  // Unique identifier for this stamp (generated)
  string id = 1;
  
  // SHA-256 hash of the document being stamped
  string document_hash = 2;
  
  // PE license information
  PEInfo pe_info = 3;
  
  // Project information
  ProjectInfo project_info = 4;
  
  // Verification data (snapshot at time of stamping)
  VerificationInfo verification_info = 5;
  
  // Digital signature from PE
  bytes signature = 6;
  
  // Timestamp when stamp was created
  google.protobuf.Timestamp created_at = 7;
  
  // Block height when stamp was created
  int64 block_height = 8;
  
  // Status of stamp (active, revoked, expired)
  StampStatus status = 9;
  
  // Reason for revocation (if applicable)
  string revocation_reason = 10;
  
  // Timestamp of revocation (if applicable)
  google.protobuf.Timestamp revoked_at = 11;
}

message PEInfo {
  // PE license number
  string license_number = 1;
  
  // State that issued license
  string state = 2;
  
  // Hash of PE's public key (for privacy)
  string public_key_hash = 3;
  
  // Disciplines (e.g., "electrical", "structural")
  repeated string disciplines = 4;
}

message ProjectInfo {
  // Project name
  string name = 1;
  
  // Project address
  string address = 2;
  
  // Municipality/jurisdiction ID
  string jurisdiction_id = 3;
  
  // Permit number (if known at stamping time)
  string permit_number = 4;
  
  // Document type (e.g., "electrical_plans", "structural_calcs")
  string document_type = 5;
}

message VerificationInfo {
  // Was PE license valid at time of stamping?
  bool license_valid = 1;
  
  // License expiration date (at time of stamping)
  google.protobuf.Timestamp license_expiry = 2;
  
  // Was PE insured at time of stamping?
  bool insurance_valid = 3;
  
  // Insurance carrier name
  string insurance_carrier = 4;
  
  // Insurance policy number
  string insurance_policy = 5;
  
  // Insurance coverage amount
  int64 insurance_amount = 6;
}

enum StampStatus {
  STAMP_STATUS_UNSPECIFIED = 0;
  STAMP_STATUS_ACTIVE = 1;
  STAMP_STATUS_REVOKED = 2;
  STAMP_STATUS_EXPIRED = 3;
}
```

---

### Transaction Messages

**File:** `proto/municipalchain/stamp/v1/tx.proto`

```protobuf
syntax = "proto3";
package municipalchain.stamp.v1;

import "municipalchain/stamp/v1/stamp.proto";
import "cosmos/msg/v1/msg.proto";

option go_package = "github.com/stampledger/municipalchain/x/stamp/types";

// Msg defines the stamp module's tx service
service Msg {
  option (cosmos.msg.v1.service) = true;
  
  // CreateStamp creates a new PE stamp record
  rpc CreateStamp(MsgCreateStamp) returns (MsgCreateStampResponse);
  
  // RevokeStamp revokes an existing stamp (PE or admin only)
  rpc RevokeStamp(MsgRevokeStamp) returns (MsgRevokeStampResponse);
  
  // UpdateStampStatus updates a stamp's status (admin only)
  rpc UpdateStampStatus(MsgUpdateStampStatus) returns (MsgUpdateStampStatusResponse);
}

message MsgCreateStamp {
  option (cosmos.msg.v1.signer) = "creator";
  
  // Address of the PE creating the stamp
  string creator = 1;
  
  // Document hash (SHA-256)
  string document_hash = 2;
  
  // PE information
  PEInfo pe_info = 3;
  
  // Project information
  ProjectInfo project_info = 4;
  
  // Verification snapshot
  VerificationInfo verification_info = 5;
  
  // PE's digital signature over the document hash
  bytes signature = 6;
}

message MsgCreateStampResponse {
  // The ID of the created stamp
  string stamp_id = 1;
  
  // Block height where stamp was recorded
  int64 block_height = 2;
}

message MsgRevokeStamp {
  option (cosmos.msg.v1.signer) = "creator";
  
  // Address of the revoker (must be PE or admin)
  string creator = 1;
  
  // ID of stamp to revoke
  string stamp_id = 2;
  
  // Reason for revocation
  string reason = 3;
}

message MsgRevokeStampResponse {
  // Success indicator
  bool success = 1;
}

message MsgUpdateStampStatus {
  option (cosmos.msg.v1.signer) = "creator";
  
  // Admin address
  string creator = 1;
  
  // Stamp ID
  string stamp_id = 2;
  
  // New status
  StampStatus new_status = 3;
  
  // Reason for status change
  string reason = 4;
}

message MsgUpdateStampStatusResponse {
  bool success = 1;
}
```

---

### Query Service

**File:** `proto/municipalchain/stamp/v1/query.proto`

```protobuf
syntax = "proto3";
package municipalchain.stamp.v1;

import "municipalchain/stamp/v1/stamp.proto";
import "cosmos/base/query/v1beta1/pagination.proto";
import "google/api/annotations.proto";

option go_package = "github.com/stampledger/municipalchain/x/stamp/types";

// Query defines the stamp module's query service
service Query {
  // GetStamp retrieves a stamp by ID
  rpc GetStamp(QueryGetStampRequest) returns (QueryGetStampResponse) {
    option (google.api.http).get = "/municipalchain/stamp/v1/stamps/{stamp_id}";
  }
  
  // ListStamps lists all stamps (with pagination)
  rpc ListStamps(QueryListStampsRequest) returns (QueryListStampsResponse) {
    option (google.api.http).get = "/municipalchain/stamp/v1/stamps";
  }
  
  // GetStampsByPE retrieves all stamps by a specific PE
  rpc GetStampsByPE(QueryGetStampsByPERequest) returns (QueryGetStampsByPEResponse) {
    option (google.api.http).get = "/municipalchain/stamp/v1/stamps/pe/{license_number}/{state}";
  }
  
  // GetStampsByJurisdiction retrieves all stamps for a jurisdiction
  rpc GetStampsByJurisdiction(QueryGetStampsByJurisdictionRequest) returns (QueryGetStampsByJurisdictionResponse) {
    option (google.api.http).get = "/municipalchain/stamp/v1/stamps/jurisdiction/{jurisdiction_id}";
  }
  
  // VerifyStamp verifies a document hash against blockchain records
  rpc VerifyStamp(QueryVerifyStampRequest) returns (QueryVerifyStampResponse) {
    option (google.api.http).get = "/municipalchain/stamp/v1/verify/{document_hash}";
  }
}

message QueryGetStampRequest {
  string stamp_id = 1;
}

message QueryGetStampResponse {
  Stamp stamp = 1;
}

message QueryListStampsRequest {
  cosmos.base.query.v1beta1.PageRequest pagination = 1;
}

message QueryListStampsResponse {
  repeated Stamp stamps = 1;
  cosmos.base.query.v1beta1.PageResponse pagination = 2;
}

message QueryGetStampsByPERequest {
  string license_number = 1;
  string state = 2;
  cosmos.base.query.v1beta1.PageRequest pagination = 3;
}

message QueryGetStampsByPEResponse {
  repeated Stamp stamps = 1;
  cosmos.base.query.v1beta1.PageResponse pagination = 2;
}

message QueryGetStampsByJurisdictionRequest {
  string jurisdiction_id = 1;
  cosmos.base.query.v1beta1.PageRequest pagination = 2;
}

message QueryGetStampsByJurisdictionResponse {
  repeated Stamp stamps = 1;
  cosmos.base.query.v1beta1.PageResponse pagination = 2;
}

message QueryVerifyStampRequest {
  string document_hash = 1;
}

message QueryVerifyStampResponse {
  // Does a stamp exist for this document hash?
  bool exists = 1;
  
  // The stamp record (if it exists)
  Stamp stamp = 2;
  
  // Is the stamp currently valid?
  bool valid = 3;
  
  // Validation message (reason if invalid)
  string message = 4;
}
```

---

## Implementation: Keeper (State Management)

**File:** `x/stamp/keeper/keeper.go`

```go
package keeper

import (
    "fmt"
    
    "cosmossdk.io/core/store"
    "cosmossdk.io/log"
    "github.com/cosmos/cosmos-sdk/codec"
    sdk "github.com/cosmos/cosmos-sdk/types"
    
    "github.com/stampledger/municipalchain/x/stamp/types"
)

type Keeper struct {
    cdc          codec.BinaryCodec
    storeService store.KVStoreService
    authority    string // Account with authority to update module params
    
    // External keepers (for accessing other modules if needed)
    // bankKeeper types.BankKeeper
}

func NewKeeper(
    cdc codec.BinaryCodec,
    storeService store.KVStoreService,
    authority string,
) Keeper {
    return Keeper{
        cdc:          cdc,
        storeService: storeService,
        authority:    authority,
    }
}

// Logger returns a module-specific logger
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
    return ctx.Logger().With("module", fmt.Sprintf("x/%s", types.ModuleName))
}

// GetAuthority returns the module's authority
func (k Keeper) GetAuthority() string {
    return k.authority
}
```

---

**File:** `x/stamp/keeper/stamp.go`

```go
package keeper

import (
    "context"
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "time"
    
    sdk "github.com/cosmos/cosmos-sdk/types"
    "github.com/stampledger/municipalchain/x/stamp/types"
)

// SetStamp stores a stamp in the KVStore
func (k Keeper) SetStamp(ctx context.Context, stamp types.Stamp) error {
    store := k.storeService.OpenKVStore(ctx)
    
    // Marshal stamp to bytes
    bz := k.cdc.MustMarshal(&stamp)
    
    // Store using stamp ID as key
    key := types.StampKey(stamp.Id)
    return store.Set(key, bz)
}

// GetStamp retrieves a stamp by ID
func (k Keeper) GetStamp(ctx context.Context, stampID string) (types.Stamp, error) {
    store := k.storeService.OpenKVStore(ctx)
    
    key := types.StampKey(stampID)
    bz, err := store.Get(key)
    if err != nil {
        return types.Stamp{}, err
    }
    if bz == nil {
        return types.Stamp{}, types.ErrStampNotFound
    }
    
    var stamp types.Stamp
    k.cdc.MustUnmarshal(bz, &stamp)
    
    return stamp, nil
}

// GetAllStamps returns all stamps (use with caution, implement pagination)
func (k Keeper) GetAllStamps(ctx context.Context) ([]types.Stamp, error) {
    store := k.storeService.OpenKVStore(ctx)
    
    iterator, err := store.Iterator(types.StampKeyPrefix, nil)
    if err != nil {
        return nil, err
    }
    defer iterator.Close()
    
    var stamps []types.Stamp
    for ; iterator.Valid(); iterator.Next() {
        var stamp types.Stamp
        k.cdc.MustUnmarshal(iterator.Value(), &stamp)
        stamps = append(stamps, stamp)
    }
    
    return stamps, nil
}

// GetStampsByPE retrieves all stamps by a specific PE license
func (k Keeper) GetStampsByPE(ctx context.Context, licenseNumber string, state string) ([]types.Stamp, error) {
    // Implementation: Use secondary index or scan all stamps
    // For production, maintain a secondary index: PE license → []stamp IDs
    
    allStamps, err := k.GetAllStamps(ctx)
    if err != nil {
        return nil, err
    }
    
    var filtered []types.Stamp
    for _, stamp := range allStamps {
        if stamp.PeInfo.LicenseNumber == licenseNumber && stamp.PeInfo.State == state {
            filtered = append(filtered, stamp)
        }
    }
    
    return filtered, nil
}

// GetStampsByJurisdiction retrieves all stamps for a jurisdiction
func (k Keeper) GetStampsByJurisdiction(ctx context.Context, jurisdictionID string) ([]types.Stamp, error) {
    allStamps, err := k.GetAllStamps(ctx)
    if err != nil {
        return nil, err
    }
    
    var filtered []types.Stamp
    for _, stamp := range allStamps {
        if stamp.ProjectInfo.JurisdictionId == jurisdictionID {
            filtered = append(filtered, stamp)
        }
    }
    
    return filtered, nil
}

// VerifyDocumentHash checks if a document hash has a valid stamp
func (k Keeper) VerifyDocumentHash(ctx context.Context, documentHash string) (exists bool, stamp types.Stamp, valid bool, message string, err error) {
    allStamps, err := k.GetAllStamps(ctx)
    if err != nil {
        return false, types.Stamp{}, false, "", err
    }
    
    for _, s := range allStamps {
        if s.DocumentHash == documentHash {
            // Found stamp
            exists = true
            stamp = s
            
            // Check if stamp is valid (not revoked/expired)
            if s.Status == types.STAMP_STATUS_ACTIVE {
                valid = true
                message = "Stamp is valid and active"
            } else if s.Status == types.STAMP_STATUS_REVOKED {
                valid = false
                message = fmt.Sprintf("Stamp revoked: %s", s.RevocationReason)
            } else if s.Status == types.STAMP_STATUS_EXPIRED {
                valid = false
                message = "Stamp has expired"
            }
            
            return exists, stamp, valid, message, nil
        }
    }
    
    // No stamp found for this document hash
    return false, types.Stamp{}, false, "No stamp found for this document", nil
}

// GenerateStampID creates a unique ID for a stamp
func (k Keeper) GenerateStampID(documentHash string, licenseNumber string, timestamp time.Time) string {
    data := fmt.Sprintf("%s-%s-%d", documentHash, licenseNumber, timestamp.Unix())
    hash := sha256.Sum256([]byte(data))
    return "stamp_" + hex.EncodeToString(hash[:16]) // 32-character ID
}

// RevokeStamp marks a stamp as revoked
func (k Keeper) RevokeStamp(ctx context.Context, stampID string, reason string) error {
    stamp, err := k.GetStamp(ctx, stampID)
    if err != nil {
        return err
    }
    
    // Update status
    stamp.Status = types.STAMP_STATUS_REVOKED
    stamp.RevocationReason = reason
    stamp.RevokedAt = timestamppb.Now()
    
    return k.SetStamp(ctx, stamp)
}
```

---

## Message Server (Transaction Handlers)

**File:** `x/stamp/keeper/msg_server.go`

```go
package keeper

import (
    "context"
    "fmt"
    
    sdk "github.com/cosmos/cosmos-sdk/types"
    "github.com/stampledger/municipalchain/x/stamp/types"
    "google.golang.org/protobuf/types/known/timestamppb"
)

type msgServer struct {
    Keeper
}

// NewMsgServerImpl returns an implementation of the stamp MsgServer interface
func NewMsgServerImpl(keeper Keeper) types.MsgServer {
    return &msgServer{Keeper: keeper}
}

var _ types.MsgServer = msgServer{}

// CreateStamp creates a new PE stamp record
func (ms msgServer) CreateStamp(goCtx context.Context, msg *types.MsgCreateStamp) (*types.MsgCreateStampResponse, error) {
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    // Validate message
    if err := msg.ValidateBasic(); err != nil {
        return nil, err
    }
    
    // TODO: Verify signature
    // if !ms.verifySignature(msg.DocumentHash, msg.Signature, msg.PeInfo.PublicKeyHash) {
    //     return nil, types.ErrInvalidSignature
    // }
    
    // TODO: Verify PE license with external API
    // if !ms.verifyPELicense(msg.PeInfo.LicenseNumber, msg.PeInfo.State) {
    //     return nil, types.ErrInvalidPELicense
    // }
    
    // Generate stamp ID
    stampID := ms.GenerateStampID(
        msg.DocumentHash,
        msg.PeInfo.LicenseNumber,
        ctx.BlockTime(),
    )
    
    // Create stamp object
    stamp := types.Stamp{
        Id:               stampID,
        DocumentHash:     msg.DocumentHash,
        PeInfo:           msg.PeInfo,
        ProjectInfo:      msg.ProjectInfo,
        VerificationInfo: msg.VerificationInfo,
        Signature:        msg.Signature,
        CreatedAt:        timestamppb.New(ctx.BlockTime()),
        BlockHeight:      ctx.BlockHeight(),
        Status:           types.STAMP_STATUS_ACTIVE,
    }
    
    // Store stamp
    if err := ms.SetStamp(ctx, stamp); err != nil {
        return nil, err
    }
    
    // Emit event
    ctx.EventManager().EmitEvent(
        sdk.NewEvent(
            types.EventTypeStampCreated,
            sdk.NewAttribute(types.AttributeKeyStampID, stampID),
            sdk.NewAttribute(types.AttributeKeyPELicense, msg.PeInfo.LicenseNumber),
            sdk.NewAttribute(types.AttributeKeyJurisdiction, msg.ProjectInfo.JurisdictionId),
        ),
    )
    
    return &types.MsgCreateStampResponse{
        StampId:     stampID,
        BlockHeight: ctx.BlockHeight(),
    }, nil
}

// RevokeStamp revokes an existing stamp
func (ms msgServer) RevokeStamp(goCtx context.Context, msg *types.MsgRevokeStamp) (*types.MsgRevokeStampResponse, error) {
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    // Get existing stamp
    stamp, err := ms.GetStamp(ctx, msg.StampId)
    if err != nil {
        return nil, err
    }
    
    // TODO: Verify requester has authority to revoke
    // Either the PE who created it OR an admin
    
    // Revoke stamp
    if err := ms.Keeper.RevokeStamp(ctx, msg.StampId, msg.Reason); err != nil {
        return nil, err
    }
    
    // Emit event
    ctx.EventManager().EmitEvent(
        sdk.NewEvent(
            types.EventTypeStampRevoked,
            sdk.NewAttribute(types.AttributeKeyStampID, msg.StampId),
            sdk.NewAttribute(types.AttributeKeyReason, msg.Reason),
        ),
    )
    
    return &types.MsgRevokeStampResponse{Success: true}, nil
}

// UpdateStampStatus updates a stamp's status (admin only)
func (ms msgServer) UpdateStampStatus(goCtx context.Context, msg *types.MsgUpdateStampStatus) (*types.MsgUpdateStampStatusResponse, error) {
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    // Verify sender is module authority (admin)
    if msg.Creator != ms.GetAuthority() {
        return nil, types.ErrUnauthorized
    }
    
    // Get stamp
    stamp, err := ms.GetStamp(ctx, msg.StampId)
    if err != nil {
        return nil, err
    }
    
    // Update status
    stamp.Status = msg.NewStatus
    if msg.NewStatus == types.STAMP_STATUS_REVOKED {
        stamp.RevocationReason = msg.Reason
        stamp.RevokedAt = timestamppb.Now()
    }
    
    // Save
    if err := ms.SetStamp(ctx, stamp); err != nil {
        return nil, err
    }
    
    return &types.MsgUpdateStampStatusResponse{Success: true}, nil
}
```

---

## Query Server

**File:** `x/stamp/keeper/query.go`

```go
package keeper

import (
    "context"
    
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    
    sdk "github.com/cosmos/cosmos-sdk/types"
    "github.com/cosmos/cosmos-sdk/types/query"
    "github.com/stampledger/municipalchain/x/stamp/types"
)

var _ types.QueryServer = Keeper{}

// GetStamp implements the Query/GetStamp gRPC method
func (k Keeper) GetStamp(goCtx context.Context, req *types.QueryGetStampRequest) (*types.QueryGetStampResponse, error) {
    if req == nil {
        return nil, status.Error(codes.InvalidArgument, "invalid request")
    }
    
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    stamp, err := k.Keeper.GetStamp(ctx, req.StampId)
    if err != nil {
        return nil, status.Error(codes.NotFound, "stamp not found")
    }
    
    return &types.QueryGetStampResponse{Stamp: &stamp}, nil
}

// ListStamps implements the Query/ListStamps gRPC method
func (k Keeper) ListStamps(goCtx context.Context, req *types.QueryListStampsRequest) (*types.QueryListStampsResponse, error) {
    if req == nil {
        return nil, status.Error(codes.InvalidArgument, "invalid request")
    }
    
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    // TODO: Implement proper pagination
    stamps, err := k.Keeper.GetAllStamps(ctx)
    if err != nil {
        return nil, err
    }
    
    // Convert to pointers for response
    var stampPtrs []*types.Stamp
    for i := range stamps {
        stampPtrs = append(stampPtrs, &stamps[i])
    }
    
    return &types.QueryListStampsResponse{
        Stamps: stampPtrs,
        // Pagination: ... (implement using SDK pagination)
    }, nil
}

// GetStampsByPE implements Query/GetStampsByPE
func (k Keeper) GetStampsByPE(goCtx context.Context, req *types.QueryGetStampsByPERequest) (*types.QueryGetStampsByPEResponse, error) {
    if req == nil {
        return nil, status.Error(codes.InvalidArgument, "invalid request")
    }
    
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    stamps, err := k.Keeper.GetStampsByPE(ctx, req.LicenseNumber, req.State)
    if err != nil {
        return nil, err
    }
    
    var stampPtrs []*types.Stamp
    for i := range stamps {
        stampPtrs = append(stampPtrs, &stamps[i])
    }
    
    return &types.QueryGetStampsByPEResponse{Stamps: stampPtrs}, nil
}

// GetStampsByJurisdiction implements Query/GetStampsByJurisdiction
func (k Keeper) GetStampsByJurisdiction(goCtx context.Context, req *types.QueryGetStampsByJurisdictionRequest) (*types.QueryGetStampsByJurisdictionResponse, error) {
    if req == nil {
        return nil, status.Error(codes.InvalidArgument, "invalid request")
    }
    
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    stamps, err := k.Keeper.GetStampsByJurisdiction(ctx, req.JurisdictionId)
    if err != nil {
        return nil, err
    }
    
    var stampPtrs []*types.Stamp
    for i := range stamps {
        stampPtrs = append(stampPtrs, &stamps[i])
    }
    
    return &types.QueryGetStampsByJurisdictionResponse{Stamps: stampPtrs}, nil
}

// VerifyStamp implements Query/VerifyStamp
func (k Keeper) VerifyStamp(goCtx context.Context, req *types.QueryVerifyStampRequest) (*types.QueryVerifyStampResponse, error) {
    if req == nil {
        return nil, status.Error(codes.InvalidArgument, "invalid request")
    }
    
    ctx := sdk.UnwrapSDKContext(goCtx)
    
    exists, stamp, valid, message, err := k.Keeper.VerifyDocumentHash(ctx, req.DocumentHash)
    if err != nil {
        return nil, err
    }
    
    response := &types.QueryVerifyStampResponse{
        Exists:  exists,
        Valid:   valid,
        Message: message,
    }
    
    if exists {
        response.Stamp = &stamp
    }
    
    return response, nil
}
```

---

## CLI Commands

**File:** `x/stamp/client/cli/tx.go`

```go
package cli

import (
    "encoding/hex"
    "fmt"
    
    "github.com/cosmos/cosmos-sdk/client"
    "github.com/cosmos/cosmos-sdk/client/flags"
    "github.com/cosmos/cosmos-sdk/client/tx"
    "github.com/spf13/cobra"
    
    "github.com/stampledger/municipalchain/x/stamp/types"
)

// GetTxCmd returns the transaction commands for this module
func GetTxCmd() *cobra.Command {
    cmd := &cobra.Command{
        Use:                        types.ModuleName,
        Short:                      fmt.Sprintf("%s transactions subcommands", types.ModuleName),
        DisableFlagParsing:         true,
        SuggestionsMinimumDistance: 2,
        RunE:                       client.ValidateCmd,
    }
    
    cmd.AddCommand(
        CmdCreateStamp(),
        CmdRevokeStamp(),
    )
    
    return cmd
}

// CmdCreateStamp creates a new stamp
func CmdCreateStamp() *cobra.Command {
    cmd := &cobra.Command{
        Use:   "create-stamp [document-hash] [license-number] [state] [project-name] [project-address] [jurisdiction-id]",
        Short: "Create a new PE stamp",
        Args:  cobra.ExactArgs(6),
        RunE: func(cmd *cobra.Command, args []string) error {
            clientCtx, err := client.GetClientTxContext(cmd)
            if err != nil {
                return err
            }
            
            // Parse arguments
            documentHash := args[0]
            licenseNumber := args[1]
            state := args[2]
            projectName := args[3]
            projectAddress := args[4]
            jurisdictionID := args[5]
            
            // TODO: Get signature from flag or prompt
            signature := []byte("signature_placeholder")
            
            // Build message
            msg := &types.MsgCreateStamp{
                Creator:      clientCtx.GetFromAddress().String(),
                DocumentHash: documentHash,
                PeInfo: &types.PEInfo{
                    LicenseNumber: licenseNumber,
                    State:         state,
                    PublicKeyHash: "pubkey_hash_placeholder",
                    Disciplines:   []string{"electrical"},
                },
                ProjectInfo: &types.ProjectInfo{
                    Name:           projectName,
                    Address:        projectAddress,
                    JurisdictionId: jurisdictionID,
                    DocumentType:   "electrical_plans",
                },
                VerificationInfo: &types.VerificationInfo{
                    LicenseValid:   true,
                    InsuranceValid: true,
                },
                Signature: signature,
            }
            
            if err := msg.ValidateBasic(); err != nil {
                return err
            }
            
            return tx.GenerateOrBroadcastTxCLI(clientCtx, cmd.Flags(), msg)
        },
    }
    
    flags.AddTxFlagsToCmd(cmd)
    
    return cmd
}

// CmdRevokeStamp revokes a stamp
func CmdRevokeStamp() *cobra.Command {
    cmd := &cobra.Command{
        Use:   "revoke-stamp [stamp-id] [reason]",
        Short: "Revoke a PE stamp",
        Args:  cobra.ExactArgs(2),
        RunE: func(cmd *cobra.Command, args []string) error {
            clientCtx, err := client.GetClientTxContext(cmd)
            if err != nil {
                return err
            }
            
            msg := &types.MsgRevokeStamp{
                Creator:  clientCtx.GetFromAddress().String(),
                StampId:  args[0],
                Reason:   args[1],
            }
            
            return tx.GenerateOrBroadcastTxCLI(clientCtx, cmd.Flags(), msg)
        },
    }
    
    flags.AddTxFlagsToCmd(cmd)
    
    return cmd
}
```

**File:** `x/stamp/client/cli/query.go`

```go
package cli

import (
    "context"
    "fmt"
    
    "github.com/cosmos/cosmos-sdk/client"
    "github.com/cosmos/cosmos-sdk/client/flags"
    "github.com/spf13/cobra"
    
    "github.com/stampledger/municipalchain/x/stamp/types"
)

// GetQueryCmd returns the cli query commands for this module
func GetQueryCmd() *cobra.Command {
    cmd := &cobra.Command{
        Use:                        types.ModuleName,
        Short:                      fmt.Sprintf("Querying commands for the %s module", types.ModuleName),
        DisableFlagParsing:         true,
        SuggestionsMinimumDistance: 2,
        RunE:                       client.ValidateCmd,
    }
    
    cmd.AddCommand(
        CmdGetStamp(),
        CmdListStamps(),
        CmdVerifyStamp(),
    )
    
    return cmd
}

// CmdGetStamp queries a stamp by ID
func CmdGetStamp() *cobra.Command {
    cmd := &cobra.Command{
        Use:   "get-stamp [stamp-id]",
        Short: "Get a stamp by ID",
        Args:  cobra.ExactArgs(1),
        RunE: func(cmd *cobra.Command, args []string) error {
            clientCtx := client.GetClientContextFromCmd(cmd)
            queryClient := types.NewQueryClient(clientCtx)
            
            res, err := queryClient.GetStamp(context.Background(), &types.QueryGetStampRequest{
                StampId: args[0],
            })
            if err != nil {
                return err
            }
            
            return clientCtx.PrintProto(res)
        },
    }
    
    flags.AddQueryFlagsToCmd(cmd)
    
    return cmd
}

// CmdListStamps queries all stamps
func CmdListStamps() *cobra.Command {
    cmd := &cobra.Command{
        Use:   "list-stamps",
        Short: "List all stamps",
        Args:  cobra.NoArgs,
        RunE: func(cmd *cobra.Command, args []string) error {
            clientCtx := client.GetClientContextFromCmd(cmd)
            queryClient := types.NewQueryClient(clientCtx)
            
            res, err := queryClient.ListStamps(context.Background(), &types.QueryListStampsRequest{})
            if err != nil {
                return err
            }
            
            return clientCtx.PrintProto(res)
        },
    }
    
    flags.AddQueryFlagsToCmd(cmd)
    flags.AddPaginationFlagsToCmd(cmd, "stamps")
    
    return cmd
}

// CmdVerifyStamp verifies a document hash
func CmdVerifyStamp() *cobra.Command {
    cmd := &cobra.Command{
        Use:   "verify [document-hash]",
        Short: "Verify a document hash",
        Args:  cobra.ExactArgs(1),
        RunE: func(cmd *cobra.Command, args []string) error {
            clientCtx := client.GetClientContextFromCmd(cmd)
            queryClient := types.NewQueryClient(clientCtx)
            
            res, err := queryClient.VerifyStamp(context.Background(), &types.QueryVerifyStampRequest{
                DocumentHash: args[0],
            })
            if err != nil {
                return err
            }
            
            return clientCtx.PrintProto(res)
        },
    }
    
    flags.AddQueryFlagsToCmd(cmd)
    
    return cmd
}
```

---

## Testing Scripts

**File:** `scripts/init-testnet.sh`

```bash
#!/bin/bash

# Initialize a 3-node local testnet for MunicipalChain

CHAIN_ID="municipalchain-testnet-1"
MONIKER="validator1"

# Clean previous data
rm -rf ~/.municipalchain

# Initialize chain
municipalchaind init $MONIKER --chain-id $CHAIN_ID

# Add validator keys
municipalchaind keys add validator1 --keyring-backend test
municipalchaind keys add validator2 --keyring-backend test
municipalchaind keys add validator3 --keyring-backend test

# Add genesis accounts
municipalchaind genesis add-genesis-account validator1 100000000000stake --keyring-backend test
municipalchaind genesis add-genesis-account validator2 100000000000stake --keyring-backend test
municipalchaind genesis add-genesis-account validator3 100000000000stake --keyring-backend test

# Create gentx
municipalchaind genesis gentx validator1 10000000stake --chain-id $CHAIN_ID --keyring-backend test

# Collect gentxs
municipalchaind genesis collect-gentxs

# Validate genesis
municipalchaind genesis validate-genesis

echo "Testnet initialized. Start with: municipalchaind start"
```

---

## Deployment Configuration

**File:** `config/app.toml`

```toml
# This is a TOML config file for the MunicipalChain application

[api]
# Enable API server
enable = true
swagger = true
address = "tcp://localhost:1317"

[grpc]
# Enable gRPC server
enable = true
address = "localhost:9090"

[state-sync]
# State sync snapshots
snapshot-interval = 1000
snapshot-keep-recent = 2
```

**File:** `config/config.toml` (Tendermint/CometBFT config)

```toml
# CometBFT configuration

[consensus]
timeout_propose = "3s"
timeout_propose_delta = "500ms"
timeout_prevote = "1s"
timeout_prevote_delta = "500ms"
timeout_precommit = "1s"
timeout_precommit_delta = "500ms"
timeout_commit = "5s"

[p2p]
# P2P network settings
laddr = "tcp://0.0.0.0:26656"
external_address = ""
seeds = ""
persistent_peers = ""
max_num_inbound_peers = 40
max_num_outbound_peers = 10

[rpc]
# RPC server settings
laddr = "tcp://127.0.0.1:26657"
cors_allowed_origins = ["*"]
```

---

## Success Criteria

**The blockchain is complete when:**

✅ Can create a stamp via CLI  
✅ Can query stamp by ID  
✅ Can verify document hash  
✅ Can revoke a stamp  
✅ 3-node testnet runs successfully  
✅ REST API accessible at localhost:1317  
✅ gRPC API accessible at localhost:9090  
✅ Block time ~5 seconds  
✅ All unit tests pass  
✅ Integration tests pass  
✅ Documentation complete  

---

## Next Steps (After Blockchain Works)

1. **Build Go API wrapper** - REST API that sits in front of blockchain for StampLedger application
2. **Integrate with PE license verification APIs** - Call state boards in real-time
3. **Add insurance verification** - Partner with carriers for policy checks
4. **Deploy to production** - 3+ validator nodes across municipalities
5. **Monitoring** - Prometheus + Grafana for blockchain metrics
6. **Backup & DR** - Snapshot and restore procedures

---

## Notes for Claude Code

**When building this:**

1. **Use Cosmos SDK 0.50** (latest stable)
2. **Follow Cosmos SDK patterns** - Don't fight the framework
3. **Use Protobuf for all data structures** - Required by Cosmos
4. **Test extensively** - Blockchain bugs are hard to fix after deployment
5. **Document everything** - Future validators need to understand this
6. **Keep it simple** - Don't over-engineer the first version
7. **Security first** - Validate all inputs, check signatures, prevent spam

**Common pitfalls to avoid:**
- Don't store large data on-chain (use IPFS for documents)
- Don't iterate over all stamps in production (use indexes)
- Don't forget to implement pagination
- Don't skip signature verification (security critical)

This is a serious blockchain that municipalities will trust. Build it like production code from day one.


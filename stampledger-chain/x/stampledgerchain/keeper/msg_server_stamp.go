package keeper

import (
	"context"
	"crypto/ed25519"
	"encoding/hex"
	"fmt"
	"time"

	"cosmossdk.io/collections"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/google/uuid"

	"stampledger-chain/x/stampledgerchain/types"
)

// CreateStamp creates a new PE stamp on the blockchain
func (k Keeper) CreateStamp(
	ctx context.Context,
	creator string,
	documentHash string,
	pePublicKey string,
	signature string,
	jurisdictionId string,
	peLicenseNumber string,
	peName string,
	projectName string,
	documentIpfsHash string,
	documentSize int64,
	documentFilename string,
) (string, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// 1. Validate document hash (SHA-256 = 64 hex chars)
	if len(documentHash) != 64 {
		return "", types.ErrInvalidDocumentHash.Wrapf("got %d chars, expected 64", len(documentHash))
	}
	if _, err := hex.DecodeString(documentHash); err != nil {
		return "", types.ErrInvalidDocumentHash.Wrap("not valid hex encoding")
	}

	// 2. Decode and validate public key (Ed25519 = 32 bytes = 64 hex chars)
	if len(pePublicKey) != 64 {
		return "", types.ErrInvalidPublicKey.Wrapf("got %d chars, expected 64", len(pePublicKey))
	}
	pubKeyBytes, err := hex.DecodeString(pePublicKey)
	if err != nil || len(pubKeyBytes) != 32 {
		return "", types.ErrInvalidPublicKey.Wrap("invalid hex encoding or length")
	}

	// 3. Decode signature (Ed25519 = 64 bytes = 128 hex chars)
	if len(signature) != 128 {
		return "", types.ErrInvalidSignature.Wrapf("got %d chars, expected 128", len(signature))
	}
	sigBytes, err := hex.DecodeString(signature)
	if err != nil || len(sigBytes) != 64 {
		return "", types.ErrInvalidSignature.Wrap("invalid hex encoding or length")
	}

	// 4. Verify Ed25519 signature
	hashBytes, _ := hex.DecodeString(documentHash)
	if !ed25519.Verify(pubKeyBytes, hashBytes, sigBytes) {
		return "", types.ErrInvalidSignature.Wrap("signature verification failed")
	}

	// 5. Generate unique stamp ID
	stampID := uuid.New().String()

	// 6. Create stamp record
	stamp := types.Stamp{
		Id:               stampID,
		DocumentHash:     documentHash,
		PePublicKey:      pePublicKey,
		Signature:        signature,
		JurisdictionId:   jurisdictionId,
		CreatedAt:        time.Now().Unix(),
		Creator:          creator,
		Revoked:          false,
		PeLicenseNumber:  peLicenseNumber,
		PeName:           peName,
		ProjectName:      projectName,
		DocumentIpfsHash: documentIpfsHash,
		DocumentSize:     documentSize,
		DocumentFilename: documentFilename,
	}

	// 7. Store the stamp
	if err := k.Stamps.Set(ctx, stampID, stamp); err != nil {
		return "", err
	}

	// 8. Index by PE public key
	peStampKey := collections.Join(pePublicKey, stampID)
	if err := k.StampsByPE.Set(ctx, peStampKey, []byte{}); err != nil {
		return "", err
	}

	// 9. Index by jurisdiction
	if jurisdictionId != "" {
		jurisdictionStampKey := collections.Join(jurisdictionId, stampID)
		if err := k.StampsByJurisdiction.Set(ctx, jurisdictionStampKey, []byte{}); err != nil {
			return "", err
		}
	}

	// 10. Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"stamp_created",
			sdk.NewAttribute("stamp_id", stampID),
			sdk.NewAttribute("pe_public_key", pePublicKey),
			sdk.NewAttribute("jurisdiction", jurisdictionId),
			sdk.NewAttribute("creator", creator),
		),
	)

	return stampID, nil
}

// RevokeStamp revokes an existing stamp
func (k Keeper) RevokeStamp(
	ctx context.Context,
	creator string,
	stampID string,
	reason string,
) error {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// 1. Get the stamp
	stamp, err := k.Stamps.Get(ctx, stampID)
	if err != nil {
		return types.ErrStampNotFound.Wrapf("stamp ID: %s", stampID)
	}

	// 2. Check if already revoked
	if stamp.Revoked {
		return types.ErrStampAlreadyRevoked.Wrapf("stamp ID: %s", stampID)
	}

	// 3. Verify creator is authorized (must be the original creator or an admin)
	if stamp.Creator != creator {
		return types.ErrUnauthorized.Wrap("only the stamp creator can revoke")
	}

	// 4. Update stamp
	stamp.Revoked = true
	stamp.RevokedAt = time.Now().Unix()
	stamp.RevokedReason = reason

	// 5. Save updated stamp
	if err := k.Stamps.Set(ctx, stampID, stamp); err != nil {
		return err
	}

	// 6. Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"stamp_revoked",
			sdk.NewAttribute("stamp_id", stampID),
			sdk.NewAttribute("reason", reason),
			sdk.NewAttribute("revoked_by", creator),
		),
	)

	return nil
}

// GetStamp retrieves a stamp by ID
func (k Keeper) GetStamp(ctx context.Context, stampID string) (types.Stamp, error) {
	stamp, err := k.Stamps.Get(ctx, stampID)
	if err != nil {
		return types.Stamp{}, types.ErrStampNotFound.Wrapf("stamp ID: %s", stampID)
	}
	return stamp, nil
}

// GetStampsByPE returns all stamps created by a PE
func (k Keeper) GetStampsByPE(ctx context.Context, pePublicKey string) ([]types.Stamp, error) {
	var stamps []types.Stamp

	// Iterate over stamps by PE index
	rng := collections.NewPrefixedPairRange[string, string](pePublicKey)
	iter, err := k.StampsByPE.Iterate(ctx, rng)
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		key, err := iter.Key()
		if err != nil {
			return nil, err
		}
		stampID := key.K2()

		stamp, err := k.Stamps.Get(ctx, stampID)
		if err != nil {
			continue // Skip if stamp not found (shouldn't happen)
		}
		stamps = append(stamps, stamp)
	}

	return stamps, nil
}

// GetStampsByJurisdiction returns all stamps for a jurisdiction
func (k Keeper) GetStampsByJurisdiction(ctx context.Context, jurisdictionId string) ([]types.Stamp, error) {
	var stamps []types.Stamp

	rng := collections.NewPrefixedPairRange[string, string](jurisdictionId)
	iter, err := k.StampsByJurisdiction.Iterate(ctx, rng)
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		key, err := iter.Key()
		if err != nil {
			return nil, err
		}
		stampID := key.K2()

		stamp, err := k.Stamps.Get(ctx, stampID)
		if err != nil {
			continue
		}
		stamps = append(stamps, stamp)
	}

	return stamps, nil
}

// VerifyStamp verifies a stamp's authenticity
func (k Keeper) VerifyStamp(ctx context.Context, stampID string) (bool, string, error) {
	stamp, err := k.Stamps.Get(ctx, stampID)
	if err != nil {
		return false, "stamp not found", types.ErrStampNotFound
	}

	if stamp.Revoked {
		return false, fmt.Sprintf("stamp revoked: %s", stamp.RevokedReason), nil
	}

	// Verify signature again
	pubKeyBytes, _ := hex.DecodeString(stamp.PePublicKey)
	sigBytes, _ := hex.DecodeString(stamp.Signature)
	hashBytes, _ := hex.DecodeString(stamp.DocumentHash)

	if !ed25519.Verify(pubKeyBytes, hashBytes, sigBytes) {
		return false, "signature verification failed", nil
	}

	return true, "valid", nil
}

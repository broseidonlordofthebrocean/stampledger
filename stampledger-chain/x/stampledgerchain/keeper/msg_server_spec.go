package keeper

import (
	"context"
	"time"

	"cosmossdk.io/collections"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/google/uuid"

	"stampledger-chain/x/stampledgerchain/types"
)

// CreateSpecVersion creates a new version of a spec on the blockchain
func (k Keeper) CreateSpecVersion(
	ctx context.Context,
	creator string,
	projectID string,
	version string,
	specHash string,
	specIpfs string,
	changelog string,
	parentVersionID string,
) (string, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// 1. If parent version specified, verify it exists
	if parentVersionID != "" {
		_, err := k.SpecVersions.Get(ctx, parentVersionID)
		if err != nil {
			return "", types.ErrParentVersionNotFound.Wrapf("parent version ID: %s", parentVersionID)
		}
	}

	// 2. Validate version format (basic check)
	if len(version) == 0 {
		return "", types.ErrInvalidVersion.Wrap("version cannot be empty")
	}

	// 3. Generate version ID
	versionID := uuid.New().String()

	// 4. Create version record
	spec := types.SpecVersion{
		Id:              versionID,
		ProjectId:       projectID,
		Version:         version,
		SpecHash:        specHash,
		SpecIpfs:        specIpfs,
		CreatedAt:       time.Now().Unix(),
		CreatedBy:       creator,
		Changelog:       changelog,
		ParentVersionId: parentVersionID,
	}

	// 5. Store spec version
	if err := k.SpecVersions.Set(ctx, versionID, spec); err != nil {
		return "", err
	}

	// 6. Index by project
	projectVersionKey := collections.Join(projectID, versionID)
	if err := k.SpecVersionsByProject.Set(ctx, projectVersionKey, []byte{}); err != nil {
		return "", err
	}

	// 7. Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"spec_version_created",
			sdk.NewAttribute("version_id", versionID),
			sdk.NewAttribute("project_id", projectID),
			sdk.NewAttribute("version", version),
			sdk.NewAttribute("created_by", creator),
		),
	)

	return versionID, nil
}

// GetSpecVersion retrieves a spec version by ID
func (k Keeper) GetSpecVersion(ctx context.Context, versionID string) (types.SpecVersion, error) {
	spec, err := k.SpecVersions.Get(ctx, versionID)
	if err != nil {
		return types.SpecVersion{}, types.ErrSpecVersionNotFound.Wrapf("version ID: %s", versionID)
	}
	return spec, nil
}

// GetSpecVersionsByProject returns all versions for a project
func (k Keeper) GetSpecVersionsByProject(ctx context.Context, projectID string) ([]types.SpecVersion, error) {
	var versions []types.SpecVersion

	rng := collections.NewPrefixedPairRange[string, string](projectID)
	iter, err := k.SpecVersionsByProject.Iterate(ctx, rng)
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		key, err := iter.Key()
		if err != nil {
			return nil, err
		}
		versionID := key.K2()

		spec, err := k.SpecVersions.Get(ctx, versionID)
		if err != nil {
			continue
		}
		versions = append(versions, spec)
	}

	return versions, nil
}

// GetSpecHistory returns the version history starting from a version and tracing back
func (k Keeper) GetSpecHistory(ctx context.Context, startingVersionID string) ([]types.SpecVersion, error) {
	var history []types.SpecVersion

	currentID := startingVersionID
	for currentID != "" {
		version, err := k.SpecVersions.Get(ctx, currentID)
		if err != nil {
			break
		}

		history = append(history, version)
		currentID = version.ParentVersionId
	}

	return history, nil
}

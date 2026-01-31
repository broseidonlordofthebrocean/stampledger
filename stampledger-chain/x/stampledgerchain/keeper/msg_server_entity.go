package keeper

import (
	"context"
	"time"

	"cosmossdk.io/collections"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/google/uuid"

	"stampledger-chain/x/stampledgerchain/types"
)

// CreateEntity creates a new organization/entity account
func (k Keeper) CreateEntity(
	ctx context.Context,
	creator string,
	name string,
	entityType string,
) (string, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// 1. Validate entity type
	if !types.ValidEntityTypes[entityType] {
		return "", types.ErrInvalidEntityType.Wrapf("got '%s'", entityType)
	}

	// 2. Generate entity ID
	entityID := uuid.New().String()

	// 3. Create entity
	entity := types.EntityAccount{
		Id:              entityID,
		Name:            name,
		EntityType:      entityType,
		OwnerAddress:    creator,
		MemberAddresses: []string{creator},
		AdminAddresses:  []string{creator},
		CreatedAt:       time.Now().Unix(),
		Active:          true,
		Permissions:     map[string]string{creator: "admin"},
	}

	// 4. Store entity
	if err := k.Entities.Set(ctx, entityID, entity); err != nil {
		return "", err
	}

	// 5. Index by owner
	ownerEntityKey := collections.Join(creator, entityID)
	if err := k.EntitiesByOwner.Set(ctx, ownerEntityKey, []byte{}); err != nil {
		return "", err
	}

	// 6. Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"entity_created",
			sdk.NewAttribute("entity_id", entityID),
			sdk.NewAttribute("name", name),
			sdk.NewAttribute("type", entityType),
			sdk.NewAttribute("owner", creator),
		),
	)

	return entityID, nil
}

// AddEntityMember adds a member to an entity
func (k Keeper) AddEntityMember(
	ctx context.Context,
	creator string,
	entityID string,
	memberAddress string,
	role string,
) error {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// 1. Validate role
	if !types.ValidRoles[role] {
		return types.ErrInvalidRole.Wrapf("got '%s'", role)
	}

	// 2. Get entity
	entity, err := k.Entities.Get(ctx, entityID)
	if err != nil {
		return types.ErrEntityNotFound.Wrapf("entity ID: %s", entityID)
	}

	// 3. Verify creator is admin
	isAdmin := false
	for _, admin := range entity.AdminAddresses {
		if admin == creator {
			isAdmin = true
			break
		}
	}
	if !isAdmin {
		return types.ErrUnauthorized.Wrap("only admins can add members")
	}

	// 4. Add member
	entity.MemberAddresses = append(entity.MemberAddresses, memberAddress)
	if entity.Permissions == nil {
		entity.Permissions = make(map[string]string)
	}
	entity.Permissions[memberAddress] = role

	// 5. If role is admin, add to admin list
	if role == "admin" {
		entity.AdminAddresses = append(entity.AdminAddresses, memberAddress)
	}

	// 6. Update entity
	if err := k.Entities.Set(ctx, entityID, entity); err != nil {
		return err
	}

	// 7. Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"entity_member_added",
			sdk.NewAttribute("entity_id", entityID),
			sdk.NewAttribute("member_address", memberAddress),
			sdk.NewAttribute("role", role),
			sdk.NewAttribute("added_by", creator),
		),
	)

	return nil
}

// RemoveEntityMember removes a member from an entity
func (k Keeper) RemoveEntityMember(
	ctx context.Context,
	creator string,
	entityID string,
	memberAddress string,
) error {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// 1. Get entity
	entity, err := k.Entities.Get(ctx, entityID)
	if err != nil {
		return types.ErrEntityNotFound.Wrapf("entity ID: %s", entityID)
	}

	// 2. Verify creator is admin
	isAdmin := false
	for _, admin := range entity.AdminAddresses {
		if admin == creator {
			isAdmin = true
			break
		}
	}
	if !isAdmin {
		return types.ErrUnauthorized.Wrap("only admins can remove members")
	}

	// 3. Cannot remove owner
	if memberAddress == entity.OwnerAddress {
		return types.ErrUnauthorized.Wrap("cannot remove the entity owner")
	}

	// 4. Find and remove member
	found := false
	newMembers := make([]string, 0, len(entity.MemberAddresses))
	for _, m := range entity.MemberAddresses {
		if m == memberAddress {
			found = true
			continue
		}
		newMembers = append(newMembers, m)
	}

	if !found {
		return types.ErrMemberNotFound.Wrapf("member: %s", memberAddress)
	}

	entity.MemberAddresses = newMembers

	// 5. Remove from admins if present
	newAdmins := make([]string, 0, len(entity.AdminAddresses))
	for _, a := range entity.AdminAddresses {
		if a != memberAddress {
			newAdmins = append(newAdmins, a)
		}
	}
	entity.AdminAddresses = newAdmins

	// 6. Remove permission
	delete(entity.Permissions, memberAddress)

	// 7. Update entity
	if err := k.Entities.Set(ctx, entityID, entity); err != nil {
		return err
	}

	// 8. Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"entity_member_removed",
			sdk.NewAttribute("entity_id", entityID),
			sdk.NewAttribute("member_address", memberAddress),
			sdk.NewAttribute("removed_by", creator),
		),
	)

	return nil
}

// GetEntity retrieves an entity by ID
func (k Keeper) GetEntity(ctx context.Context, entityID string) (types.EntityAccount, error) {
	entity, err := k.Entities.Get(ctx, entityID)
	if err != nil {
		return types.EntityAccount{}, types.ErrEntityNotFound.Wrapf("entity ID: %s", entityID)
	}
	return entity, nil
}

// GetEntitiesByOwner returns all entities owned by an address
func (k Keeper) GetEntitiesByOwner(ctx context.Context, ownerAddress string) ([]types.EntityAccount, error) {
	var entities []types.EntityAccount

	rng := collections.NewPrefixedPairRange[string, string](ownerAddress)
	iter, err := k.EntitiesByOwner.Iterate(ctx, rng)
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		key, err := iter.Key()
		if err != nil {
			return nil, err
		}
		entityID := key.K2()

		entity, err := k.Entities.Get(ctx, entityID)
		if err != nil {
			continue
		}
		entities = append(entities, entity)
	}

	return entities, nil
}

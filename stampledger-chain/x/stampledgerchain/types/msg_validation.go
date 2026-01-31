package types

import (
	sdk "github.com/cosmos/cosmos-sdk/types"
)

// ValidEntityTypes defines valid entity types
var ValidEntityTypes = map[string]bool{
	"company":      true,
	"municipality": true,
	"firm":         true,
}

// ValidRoles defines valid member roles
var ValidRoles = map[string]bool{
	"viewer": true,
	"editor": true,
	"admin":  true,
}

// ============================================================================
// GOVERNANCE MESSAGE VALIDATION
// ============================================================================

func (m MsgUpdateParams) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(m.Authority)
	return []sdk.AccAddress{addr}
}

func (m MsgUpdateParams) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Authority); err != nil {
		return err
	}
	return nil
}

// ============================================================================
// STAMP MESSAGE VALIDATION
// ============================================================================

func (m MsgCreateStamp) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(m.Creator)
	return []sdk.AccAddress{addr}
}

func (m MsgCreateStamp) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Creator); err != nil {
		return err
	}
	if len(m.DocumentHash) != 64 {
		return ErrInvalidDocumentHash
	}
	if len(m.PePublicKey) != 64 {
		return ErrInvalidPublicKey
	}
	if len(m.Signature) != 128 {
		return ErrInvalidSignature
	}
	return nil
}

func (m MsgRevokeStamp) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(m.Creator)
	return []sdk.AccAddress{addr}
}

func (m MsgRevokeStamp) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Creator); err != nil {
		return err
	}
	if m.StampId == "" {
		return ErrStampNotFound
	}
	return nil
}

// ============================================================================
// DOCUMENT MESSAGE VALIDATION
// ============================================================================

func (m MsgStoreDocument) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(m.Creator)
	return []sdk.AccAddress{addr}
}

func (m MsgStoreDocument) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Creator); err != nil {
		return err
	}
	if m.StampId == "" {
		return ErrStampNotFound
	}
	if len(m.IpfsHash) < 46 {
		return ErrInvalidIpfsHash
	}
	return nil
}

// ============================================================================
// ENTITY MESSAGE VALIDATION
// ============================================================================

func (m MsgCreateEntity) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(m.Creator)
	return []sdk.AccAddress{addr}
}

func (m MsgCreateEntity) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Creator); err != nil {
		return err
	}
	if m.Name == "" {
		return ErrInvalidEntityType.Wrap("name cannot be empty")
	}
	if !ValidEntityTypes[m.EntityType] {
		return ErrInvalidEntityType
	}
	return nil
}

func (m MsgAddEntityMember) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(m.Creator)
	return []sdk.AccAddress{addr}
}

func (m MsgAddEntityMember) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Creator); err != nil {
		return err
	}
	if m.EntityId == "" {
		return ErrEntityNotFound
	}
	if !ValidRoles[m.Role] {
		return ErrInvalidRole
	}
	return nil
}

func (m MsgRemoveEntityMember) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(m.Creator)
	return []sdk.AccAddress{addr}
}

func (m MsgRemoveEntityMember) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Creator); err != nil {
		return err
	}
	if m.EntityId == "" {
		return ErrEntityNotFound
	}
	return nil
}

// ============================================================================
// SPEC VERSION MESSAGE VALIDATION
// ============================================================================

func (m MsgCreateSpecVersion) GetSigners() []sdk.AccAddress {
	addr, _ := sdk.AccAddressFromBech32(m.Creator)
	return []sdk.AccAddress{addr}
}

func (m MsgCreateSpecVersion) ValidateBasic() error {
	if _, err := sdk.AccAddressFromBech32(m.Creator); err != nil {
		return err
	}
	if m.ProjectId == "" {
		return ErrInvalidVersion.Wrap("project_id cannot be empty")
	}
	if m.Version == "" {
		return ErrInvalidVersion
	}
	return nil
}

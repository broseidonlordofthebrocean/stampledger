package keeper

import (
	"context"
	"encoding/hex"

	sdk "github.com/cosmos/cosmos-sdk/types"

	"stampledger-chain/x/stampledgerchain/types"
)

type msgServer struct {
	Keeper
}

// NewMsgServerImpl returns an implementation of the MsgServer interface
// for the provided Keeper.
func NewMsgServerImpl(keeper Keeper) types.MsgServer {
	return &msgServer{Keeper: keeper}
}

var _ types.MsgServer = msgServer{}

// CreateStamp handles MsgCreateStamp
func (m msgServer) CreateStamp(ctx context.Context, msg *types.MsgCreateStamp) (*types.MsgCreateStampResponse, error) {
	stampID, err := m.Keeper.CreateStamp(
		ctx,
		msg.Creator,
		msg.DocumentHash,
		msg.PePublicKey,
		msg.Signature,
		msg.JurisdictionId,
		msg.PeLicenseNumber,
		msg.PeName,
		msg.ProjectName,
		msg.DocumentIpfsHash,
		msg.DocumentSize,
		msg.DocumentFilename,
	)
	if err != nil {
		return nil, err
	}

	sdkCtx := sdk.UnwrapSDKContext(ctx)
	txHash := hex.EncodeToString(sdkCtx.TxBytes())

	return &types.MsgCreateStampResponse{
		StampId: stampID,
		TxHash:  txHash,
	}, nil
}

// RevokeStamp handles MsgRevokeStamp
func (m msgServer) RevokeStamp(ctx context.Context, msg *types.MsgRevokeStamp) (*types.MsgRevokeStampResponse, error) {
	err := m.Keeper.RevokeStamp(ctx, msg.Creator, msg.StampId, msg.Reason)
	if err != nil {
		return nil, err
	}

	return &types.MsgRevokeStampResponse{
		Success: true,
	}, nil
}

// StoreDocument handles MsgStoreDocument
func (m msgServer) StoreDocument(ctx context.Context, msg *types.MsgStoreDocument) (*types.MsgStoreDocumentResponse, error) {
	docID, ipfsURL, err := m.Keeper.StoreDocument(
		ctx,
		msg.Creator,
		msg.StampId,
		msg.IpfsHash,
		msg.Filename,
		msg.Size_,
		msg.MimeType,
		msg.PinForever,
	)
	if err != nil {
		return nil, err
	}

	return &types.MsgStoreDocumentResponse{
		DocumentId: docID,
		IpfsUrl:    ipfsURL,
	}, nil
}

// CreateEntity handles MsgCreateEntity
func (m msgServer) CreateEntity(ctx context.Context, msg *types.MsgCreateEntity) (*types.MsgCreateEntityResponse, error) {
	entityID, err := m.Keeper.CreateEntity(ctx, msg.Creator, msg.Name, msg.EntityType)
	if err != nil {
		return nil, err
	}

	return &types.MsgCreateEntityResponse{
		EntityId: entityID,
	}, nil
}

// AddEntityMember handles MsgAddEntityMember
func (m msgServer) AddEntityMember(ctx context.Context, msg *types.MsgAddEntityMember) (*types.MsgAddEntityMemberResponse, error) {
	err := m.Keeper.AddEntityMember(ctx, msg.Creator, msg.EntityId, msg.MemberAddress, msg.Role)
	if err != nil {
		return nil, err
	}

	return &types.MsgAddEntityMemberResponse{
		Success: true,
	}, nil
}

// RemoveEntityMember handles MsgRemoveEntityMember
func (m msgServer) RemoveEntityMember(ctx context.Context, msg *types.MsgRemoveEntityMember) (*types.MsgRemoveEntityMemberResponse, error) {
	err := m.Keeper.RemoveEntityMember(ctx, msg.Creator, msg.EntityId, msg.MemberAddress)
	if err != nil {
		return nil, err
	}

	return &types.MsgRemoveEntityMemberResponse{
		Success: true,
	}, nil
}

// CreateSpecVersion handles MsgCreateSpecVersion
func (m msgServer) CreateSpecVersion(ctx context.Context, msg *types.MsgCreateSpecVersion) (*types.MsgCreateSpecVersionResponse, error) {
	versionID, err := m.Keeper.CreateSpecVersion(
		ctx,
		msg.Creator,
		msg.ProjectId,
		msg.Version,
		msg.SpecHash,
		msg.SpecIpfs,
		msg.Changelog,
		msg.ParentVersionId,
	)
	if err != nil {
		return nil, err
	}

	return &types.MsgCreateSpecVersionResponse{
		VersionId: versionID,
	}, nil
}

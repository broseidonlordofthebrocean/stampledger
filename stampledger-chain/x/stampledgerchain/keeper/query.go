package keeper

import (
	"context"

	"stampledger-chain/x/stampledgerchain/types"
)

var _ types.QueryServer = queryServer{}

// NewQueryServerImpl returns an implementation of the QueryServer interface
// for the provided Keeper.
func NewQueryServerImpl(k Keeper) types.QueryServer {
	return queryServer{k}
}

type queryServer struct {
	k Keeper
}

// Stamp returns a stamp by ID
func (q queryServer) Stamp(ctx context.Context, req *types.QueryStampRequest) (*types.QueryStampResponse, error) {
	stamp, err := q.k.GetStamp(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return &types.QueryStampResponse{Stamp: stamp}, nil
}

// StampsByPE returns all stamps by a PE
func (q queryServer) StampsByPE(ctx context.Context, req *types.QueryStampsByPERequest) (*types.QueryStampsByPEResponse, error) {
	stamps, err := q.k.GetStampsByPE(ctx, req.PePublicKey)
	if err != nil {
		return nil, err
	}
	return &types.QueryStampsByPEResponse{Stamps: stamps}, nil
}

// StampsByJurisdiction returns all stamps for a jurisdiction
func (q queryServer) StampsByJurisdiction(ctx context.Context, req *types.QueryStampsByJurisdictionRequest) (*types.QueryStampsByJurisdictionResponse, error) {
	stamps, err := q.k.GetStampsByJurisdiction(ctx, req.JurisdictionId)
	if err != nil {
		return nil, err
	}
	return &types.QueryStampsByJurisdictionResponse{Stamps: stamps}, nil
}

// AllStamps returns all stamps
func (q queryServer) AllStamps(ctx context.Context, req *types.QueryAllStampsRequest) (*types.QueryAllStampsResponse, error) {
	var stamps []types.Stamp

	iter, err := q.k.Stamps.Iterate(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		stamp, err := iter.Value()
		if err != nil {
			return nil, err
		}
		stamps = append(stamps, stamp)
	}

	return &types.QueryAllStampsResponse{Stamps: stamps}, nil
}

// Document returns a document by ID
func (q queryServer) Document(ctx context.Context, req *types.QueryDocumentRequest) (*types.QueryDocumentResponse, error) {
	doc, err := q.k.GetDocument(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return &types.QueryDocumentResponse{Document: doc}, nil
}

// DocumentsByStamp returns all documents for a stamp
func (q queryServer) DocumentsByStamp(ctx context.Context, req *types.QueryDocumentsByStampRequest) (*types.QueryDocumentsByStampResponse, error) {
	docs, err := q.k.GetDocumentsByStamp(ctx, req.StampId)
	if err != nil {
		return nil, err
	}
	return &types.QueryDocumentsByStampResponse{Documents: docs}, nil
}

// Entity returns an entity by ID
func (q queryServer) Entity(ctx context.Context, req *types.QueryEntityRequest) (*types.QueryEntityResponse, error) {
	entity, err := q.k.GetEntity(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return &types.QueryEntityResponse{Entity: entity}, nil
}

// EntitiesByOwner returns all entities owned by an address
func (q queryServer) EntitiesByOwner(ctx context.Context, req *types.QueryEntitiesByOwnerRequest) (*types.QueryEntitiesByOwnerResponse, error) {
	entities, err := q.k.GetEntitiesByOwner(ctx, req.OwnerAddress)
	if err != nil {
		return nil, err
	}
	return &types.QueryEntitiesByOwnerResponse{Entities: entities}, nil
}

// SpecVersion returns a spec version by ID
func (q queryServer) SpecVersion(ctx context.Context, req *types.QuerySpecVersionRequest) (*types.QuerySpecVersionResponse, error) {
	version, err := q.k.GetSpecVersion(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return &types.QuerySpecVersionResponse{Version: version}, nil
}

// SpecVersionsByProject returns all versions for a project
func (q queryServer) SpecVersionsByProject(ctx context.Context, req *types.QuerySpecVersionsByProjectRequest) (*types.QuerySpecVersionsByProjectResponse, error) {
	versions, err := q.k.GetSpecVersionsByProject(ctx, req.ProjectId)
	if err != nil {
		return nil, err
	}
	return &types.QuerySpecVersionsByProjectResponse{Versions: versions}, nil
}

// SpecHistory returns the version history starting from a version
func (q queryServer) SpecHistory(ctx context.Context, req *types.QuerySpecHistoryRequest) (*types.QuerySpecHistoryResponse, error) {
	history, err := q.k.GetSpecHistory(ctx, req.StartingVersionId)
	if err != nil {
		return nil, err
	}
	return &types.QuerySpecHistoryResponse{History: history}, nil
}

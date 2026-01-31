package keeper

import (
	"context"
	"fmt"
	"strings"
	"time"

	"cosmossdk.io/collections"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/google/uuid"

	"stampledger-chain/x/stampledgerchain/types"
)

// StoreDocument stores a document reference on the blockchain
func (k Keeper) StoreDocument(
	ctx context.Context,
	creator string,
	stampID string,
	ipfsHash string,
	filename string,
	size int64,
	mimeType string,
	pinForever bool,
) (string, string, error) {
	sdkCtx := sdk.UnwrapSDKContext(ctx)

	// 1. Verify stamp exists
	stamp, err := k.Stamps.Get(ctx, stampID)
	if err != nil {
		return "", "", types.ErrStampNotFound.Wrapf("stamp ID: %s", stampID)
	}

	// 2. Verify creator is the PE who created the stamp
	if stamp.Creator != creator {
		return "", "", types.ErrUnauthorized.Wrap("only stamp creator can store documents")
	}

	// 3. Validate IPFS hash (CIDv0 starts with "Qm", CIDv1 starts with "bafy")
	if !strings.HasPrefix(ipfsHash, "Qm") && !strings.HasPrefix(ipfsHash, "bafy") {
		return "", "", types.ErrInvalidIpfsHash.Wrap("must start with 'Qm' or 'bafy'")
	}
	if len(ipfsHash) < 46 {
		return "", "", types.ErrInvalidIpfsHash.Wrap("hash too short")
	}

	// 4. Create document record
	docID := uuid.New().String()
	doc := types.DocumentStorage{
		Id:         docID,
		StampId:    stampID,
		IpfsHash:   ipfsHash,
		Filename:   filename,
		Size_:      size,
		MimeType:   mimeType,
		UploadedAt: time.Now().Unix(),
		UploadedBy: creator,
		Pinned:     pinForever,
	}

	// 5. Store document
	if err := k.Documents.Set(ctx, docID, doc); err != nil {
		return "", "", err
	}

	// 6. Index by stamp ID
	docStampKey := collections.Join(stampID, docID)
	if err := k.DocumentsByStamp.Set(ctx, docStampKey, []byte{}); err != nil {
		return "", "", err
	}

	// 7. Emit event
	sdkCtx.EventManager().EmitEvent(
		sdk.NewEvent(
			"document_stored",
			sdk.NewAttribute("document_id", docID),
			sdk.NewAttribute("stamp_id", stampID),
			sdk.NewAttribute("ipfs_hash", ipfsHash),
			sdk.NewAttribute("filename", filename),
		),
	)

	ipfsURL := fmt.Sprintf("ipfs://%s", ipfsHash)
	return docID, ipfsURL, nil
}

// GetDocument retrieves a document by ID
func (k Keeper) GetDocument(ctx context.Context, docID string) (types.DocumentStorage, error) {
	doc, err := k.Documents.Get(ctx, docID)
	if err != nil {
		return types.DocumentStorage{}, types.ErrDocumentNotFound.Wrapf("document ID: %s", docID)
	}
	return doc, nil
}

// GetDocumentsByStamp returns all documents associated with a stamp
func (k Keeper) GetDocumentsByStamp(ctx context.Context, stampID string) ([]types.DocumentStorage, error) {
	var documents []types.DocumentStorage

	rng := collections.NewPrefixedPairRange[string, string](stampID)
	iter, err := k.DocumentsByStamp.Iterate(ctx, rng)
	if err != nil {
		return nil, err
	}
	defer iter.Close()

	for ; iter.Valid(); iter.Next() {
		key, err := iter.Key()
		if err != nil {
			return nil, err
		}
		docID := key.K2()

		doc, err := k.Documents.Get(ctx, docID)
		if err != nil {
			continue
		}
		documents = append(documents, doc)
	}

	return documents, nil
}

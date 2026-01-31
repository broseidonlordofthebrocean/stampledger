package keeper

import (
	"fmt"

	"cosmossdk.io/collections"
	"cosmossdk.io/core/address"
	corestore "cosmossdk.io/core/store"
	"github.com/cosmos/cosmos-sdk/codec"

	"stampledger-chain/x/stampledgerchain/types"
)

type Keeper struct {
	storeService corestore.KVStoreService
	cdc          codec.Codec
	addressCodec address.Codec
	// Address capable of executing a MsgUpdateParams message.
	// Typically, this should be the x/gov module account.
	authority []byte

	Schema collections.Schema
	Params collections.Item[types.Params]

	// Stamp storage
	Stamps               collections.Map[string, types.Stamp]
	StampsByPE           collections.Map[collections.Pair[string, string], []byte] // PE public key -> stamp IDs
	StampsByJurisdiction collections.Map[collections.Pair[string, string], []byte] // Jurisdiction -> stamp IDs

	// Document storage
	Documents        collections.Map[string, types.DocumentStorage]
	DocumentsByStamp collections.Map[collections.Pair[string, string], []byte] // Stamp ID -> document IDs

	// Entity storage
	Entities        collections.Map[string, types.EntityAccount]
	EntitiesByOwner collections.Map[collections.Pair[string, string], []byte] // Owner address -> entity IDs

	// Spec version storage
	SpecVersions          collections.Map[string, types.SpecVersion]
	SpecVersionsByProject collections.Map[collections.Pair[string, string], []byte] // Project ID -> version IDs
}

func NewKeeper(
	storeService corestore.KVStoreService,
	cdc codec.Codec,
	addressCodec address.Codec,
	authority []byte,
) Keeper {
	if _, err := addressCodec.BytesToString(authority); err != nil {
		panic(fmt.Sprintf("invalid authority address %s: %s", authority, err))
	}

	sb := collections.NewSchemaBuilder(storeService)

	k := Keeper{
		storeService: storeService,
		cdc:          cdc,
		addressCodec: addressCodec,
		authority:    authority,

		Params: collections.NewItem(sb, types.ParamsKey, "params", codec.CollValue[types.Params](cdc)),

		// Stamp collections using JSON codec
		Stamps: collections.NewMap(
			sb, types.StampsKey, "stamps",
			collections.StringKey, types.NewJSONValueCodec[types.Stamp](),
		),
		StampsByPE: collections.NewMap(
			sb, types.StampsByPEKey, "stamps_by_pe",
			collections.PairKeyCodec(collections.StringKey, collections.StringKey),
			collections.BytesValue,
		),
		StampsByJurisdiction: collections.NewMap(
			sb, types.StampsByJurisdictionKey, "stamps_by_jurisdiction",
			collections.PairKeyCodec(collections.StringKey, collections.StringKey),
			collections.BytesValue,
		),

		// Document collections using JSON codec
		Documents: collections.NewMap(
			sb, types.DocumentsKey, "documents",
			collections.StringKey, types.NewJSONValueCodec[types.DocumentStorage](),
		),
		DocumentsByStamp: collections.NewMap(
			sb, types.DocumentsByStampKey, "documents_by_stamp",
			collections.PairKeyCodec(collections.StringKey, collections.StringKey),
			collections.BytesValue,
		),

		// Entity collections using JSON codec
		Entities: collections.NewMap(
			sb, types.EntitiesKey, "entities",
			collections.StringKey, types.NewJSONValueCodec[types.EntityAccount](),
		),
		EntitiesByOwner: collections.NewMap(
			sb, types.EntitiesByOwnerKey, "entities_by_owner",
			collections.PairKeyCodec(collections.StringKey, collections.StringKey),
			collections.BytesValue,
		),

		// Spec version collections using JSON codec
		SpecVersions: collections.NewMap(
			sb, types.SpecVersionsKey, "spec_versions",
			collections.StringKey, types.NewJSONValueCodec[types.SpecVersion](),
		),
		SpecVersionsByProject: collections.NewMap(
			sb, types.SpecVersionsByProjectKey, "spec_versions_by_project",
			collections.PairKeyCodec(collections.StringKey, collections.StringKey),
			collections.BytesValue,
		),
	}

	schema, err := sb.Build()
	if err != nil {
		panic(err)
	}
	k.Schema = schema

	return k
}

// GetAuthority returns the module's authority.
func (k Keeper) GetAuthority() []byte {
	return k.authority
}

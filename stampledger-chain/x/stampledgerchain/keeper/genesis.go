package keeper

import (
	"context"

	"stampledger-chain/x/stampledgerchain/types"
)

// InitGenesis initializes the module's state from a provided genesis state.
// NOTE: After proto regeneration, this should also import stamps, documents, entities, and spec versions
func (k Keeper) InitGenesis(ctx context.Context, genState types.GenesisState) error {
	return k.Params.Set(ctx, genState.Params)
}

// ExportGenesis returns the module's exported genesis.
// NOTE: After proto regeneration, this should also export stamps, documents, entities, and spec versions
func (k Keeper) ExportGenesis(ctx context.Context) (*types.GenesisState, error) {
	var err error

	genesis := types.DefaultGenesis()
	genesis.Params, err = k.Params.Get(ctx)
	if err != nil {
		return nil, err
	}

	// TODO: After proto regeneration, uncomment to export all state:
	// stampIter, _ := k.Stamps.Iterate(ctx, nil)
	// for ; stampIter.Valid(); stampIter.Next() {
	//     stamp, _ := stampIter.Value()
	//     genesis.Stamps = append(genesis.Stamps, stamp)
	// }
	// stampIter.Close()

	return genesis, nil
}

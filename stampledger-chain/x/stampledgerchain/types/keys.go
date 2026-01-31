package types

import "cosmossdk.io/collections"

const (
	// ModuleName defines the module name
	ModuleName = "stampledgerchain"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// GovModuleName duplicates the gov module's name to avoid a dependency with x/gov.
	GovModuleName = "gov"
)

var (
	// ParamsKey is the prefix to retrieve all Params
	ParamsKey = collections.NewPrefix("p_stampledgerchain")

	// Stamp storage keys - use short unique prefixes to avoid collisions
	StampsKey               = collections.NewPrefix("st/id")
	StampsByPEKey           = collections.NewPrefix("st/pe")
	StampsByJurisdictionKey = collections.NewPrefix("st/jur")

	// Document storage keys
	DocumentsKey        = collections.NewPrefix("doc/id")
	DocumentsByStampKey = collections.NewPrefix("doc/stamp")

	// Entity storage keys
	EntitiesKey        = collections.NewPrefix("ent/id")
	EntitiesByOwnerKey = collections.NewPrefix("ent/own")

	// Spec version storage keys
	SpecVersionsKey          = collections.NewPrefix("spec/id")
	SpecVersionsByProjectKey = collections.NewPrefix("spec/proj")
)

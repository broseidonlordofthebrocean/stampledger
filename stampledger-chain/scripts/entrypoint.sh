#!/bin/sh
set -e

CHAIN_HOME="/root/.stampledger-chain"
CHAIN_ID="${CHAIN_ID:-stampledger-1}"
MONIKER="${MONIKER:-stampledger-node}"
SERVICE_ACCOUNT="service-account"

# Check if already initialized
if [ ! -f "$CHAIN_HOME/config/genesis.json" ]; then
    echo "============================================"
    echo "  Initializing StampLedger Chain"
    echo "  Chain ID: $CHAIN_ID"
    echo "============================================"

    # 1. Initialize the node
    stampledger-chaind init "$MONIKER" --chain-id "$CHAIN_ID" --home "$CHAIN_HOME"

    # 2. Create service account (captures mnemonic in JSON output)
    stampledger-chaind keys add "$SERVICE_ACCOUNT" \
        --keyring-backend test \
        --home "$CHAIN_HOME" \
        --output json > "$CHAIN_HOME/service-account.json" 2>&1

    # 3. Get the service account address
    SERVICE_ADDR=$(stampledger-chaind keys show "$SERVICE_ACCOUNT" \
        --keyring-backend test \
        --home "$CHAIN_HOME" \
        -a)

    echo "Service account address: $SERVICE_ADDR"

    # 4. Fund the service account in genesis
    stampledger-chaind genesis add-genesis-account "$SERVICE_ADDR" 200000000stake,100000token \
        --keyring-backend test \
        --home "$CHAIN_HOME"

    # 5. Create genesis validator transaction
    stampledger-chaind genesis gentx "$SERVICE_ACCOUNT" 100000000stake \
        --chain-id "$CHAIN_ID" \
        --keyring-backend test \
        --home "$CHAIN_HOME"

    # 6. Collect genesis transactions
    stampledger-chaind genesis collect-gentxs --home "$CHAIN_HOME"

    # 7. Configure for single-node + external access
    # Enable REST API (default is disabled)
    sed -i '/\[api\]/,/\[/{s/^enable = false/enable = true/}' "$CHAIN_HOME/config/app.toml"

    # Listen on all interfaces (required for Docker)
    sed -i 's|address = "tcp://localhost:1317"|address = "tcp://0.0.0.0:1317"|' "$CHAIN_HOME/config/app.toml"
    sed -i 's|laddr = "tcp://127.0.0.1:26657"|laddr = "tcp://0.0.0.0:26657"|' "$CHAIN_HOME/config/config.toml"

    # Accept zero-fee transactions (single validator, we control it)
    sed -i 's/^minimum-gas-prices = ""/minimum-gas-prices = "0stake"/' "$CHAIN_HOME/config/app.toml"

    # Allow CORS for RPC
    sed -i 's/cors_allowed_origins = \[\]/cors_allowed_origins = ["*"]/' "$CHAIN_HOME/config/config.toml"

    # Enable unsafe CORS on REST API
    sed -i '/\[api\]/,/\[/{s/^enabled-unsafe-cors = false/enabled-unsafe-cors = true/}' "$CHAIN_HOME/config/app.toml"

    # 8. Generate Ed25519 PE signing keypair
    echo "Generating Ed25519 PE signing keypair..."
    openssl genpkey -algorithm Ed25519 -out "$CHAIN_HOME/pe-signing-key.pem"

    # Export PKCS8 DER as base64 (for Cloudflare secret)
    openssl pkey -in "$CHAIN_HOME/pe-signing-key.pem" -outform DER | base64 -w 0 > "$CHAIN_HOME/pe-signing-key.b64"

    # Extract raw 32-byte public key as hex (for chain messages)
    openssl pkey -in "$CHAIN_HOME/pe-signing-key.pem" -pubout -outform DER | tail -c 32 | od -An -tx1 | tr -d ' \n' > "$CHAIN_HOME/pe-pubkey.hex"

    echo ""
    echo "============================================"
    echo "  Chain initialized successfully!"
    echo "============================================"
    echo ""
    echo "Keys saved to $CHAIN_HOME/"
    echo "  service-account.json  - Cosmos account (has mnemonic)"
    echo "  pe-signing-key.b64   - Ed25519 private key (PKCS8 base64)"
    echo "  pe-pubkey.hex        - Ed25519 public key (hex)"
    echo ""
fi

echo "Starting StampLedger chain..."
exec stampledger-chaind start --home "$CHAIN_HOME" "$@"

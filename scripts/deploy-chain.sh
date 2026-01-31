#!/bin/bash
# Deploy StampLedger Blockchain Node with Cloudflare Tunnel

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CHAIN_DIR="$PROJECT_ROOT/stampledger-chain"

CHAIN_ID="${CHAIN_ID:-stampledger-testnet-1}"
MONIKER="${MONIKER:-stampledger-node}"

echo "=== Deploying StampLedger Blockchain Node ==="

cd "$CHAIN_DIR"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is required but not installed."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is required but not installed."
    exit 1
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t stampledger-chain:latest .

# Initialize the chain if not already initialized
if [ ! -f "$HOME/.stampledger-chain/config/genesis.json" ]; then
    echo "Initializing chain..."
    docker run --rm -v "$HOME/.stampledger-chain:/root/.stampledger-chain" \
        stampledger-chain:latest init "$MONIKER" --chain-id "$CHAIN_ID"
fi

# Start the chain with docker-compose
echo "Starting chain with Docker Compose..."
docker compose up -d

echo "=== Blockchain Node Deployment Complete ==="
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
echo ""
echo "Endpoints (after Cloudflare Tunnel setup):"
echo "  RPC: https://rpc.stampledger.com"
echo "  API: https://api.stampledger.com"
echo "  gRPC: https://grpc.stampledger.com"

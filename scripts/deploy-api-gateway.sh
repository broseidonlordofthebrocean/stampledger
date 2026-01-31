#!/bin/bash
# Deploy StampLedger API Gateway to Cloudflare Workers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
GATEWAY_DIR="$PROJECT_ROOT/stampledger-api-gateway"

ENV="${1:-preview}"

echo "=== Deploying StampLedger API Gateway (env: $ENV) ==="

cd "$GATEWAY_DIR"

# Install dependencies
echo "Installing dependencies..."
npm install

# Deploy
echo "Deploying to Cloudflare Workers..."
if [ "$ENV" = "production" ]; then
    npm run deploy:production
else
    npm run deploy:preview
fi

echo "=== API Gateway Deployment Complete ==="

#!/bin/bash
# Deploy StampLedger Landing Page to Cloudflare Pages

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LANDING_DIR="$PROJECT_ROOT/stampledger-landing"

echo "=== Deploying StampLedger Landing Page ==="

cd "$LANDING_DIR"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build for Cloudflare Pages
echo "Building for Cloudflare Pages..."
npm run build
npm run pages:build

# Deploy
echo "Deploying to Cloudflare Pages..."
npm run pages:deploy

echo "=== Landing Page Deployment Complete ==="

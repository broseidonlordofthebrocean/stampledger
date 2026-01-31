#!/bin/bash
# StampLedger Cloudflare Setup Script
#
# This script helps set up all Cloudflare services for StampLedger

set -e

echo "=============================================="
echo "  StampLedger Cloudflare Setup"
echo "=============================================="
echo ""

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."

    local missing=()

    if ! command -v npm &> /dev/null; then
        missing+=("npm")
    fi

    if ! command -v wrangler &> /dev/null; then
        missing+=("wrangler (npm install -g wrangler)")
    fi

    if ! command -v cloudflared &> /dev/null; then
        missing+=("cloudflared (https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)")
    fi

    if [ ${#missing[@]} -ne 0 ]; then
        echo "Missing prerequisites:"
        for item in "${missing[@]}"; do
            echo "  - $item"
        done
        echo ""
        echo "Please install the missing tools and try again."
        exit 1
    fi

    echo "All prerequisites installed!"
}

# Login to Cloudflare
cloudflare_login() {
    echo ""
    echo "Step 1: Cloudflare Login"
    echo "------------------------"

    if ! wrangler whoami &> /dev/null; then
        echo "Logging in to Cloudflare..."
        wrangler login
    else
        echo "Already logged in to Cloudflare."
    fi
}

# Setup Cloudflare Tunnel
setup_tunnel() {
    echo ""
    echo "Step 2: Cloudflare Tunnel Setup"
    echo "-------------------------------"

    if ! cloudflared tunnel list | grep -q "stampledger-chain"; then
        echo "Creating Cloudflare Tunnel..."
        cloudflared tunnel create stampledger-chain

        echo ""
        echo "Setting up DNS routes..."
        cloudflared tunnel route dns stampledger-chain rpc.stampledger.com
        cloudflared tunnel route dns stampledger-chain api.stampledger.com
        cloudflared tunnel route dns stampledger-chain grpc.stampledger.com
    else
        echo "Tunnel 'stampledger-chain' already exists."
    fi

    # Get tunnel ID and update config
    TUNNEL_ID=$(cloudflared tunnel list | grep "stampledger-chain" | awk '{print $1}')
    echo ""
    echo "Tunnel ID: $TUNNEL_ID"
    echo ""
    echo "Please update stampledger-chain/cloudflare-tunnel.yml with:"
    echo "  tunnel: $TUNNEL_ID"
    echo "  credentials-file: ~/.cloudflared/$TUNNEL_ID.json"
}

# Setup Pages project
setup_pages() {
    echo ""
    echo "Step 3: Cloudflare Pages Setup"
    echo "------------------------------"

    echo "Creating Pages project for landing page..."
    cd stampledger-landing
    npm install
    wrangler pages project create stampledger-landing --production-branch main || true
    cd ..
}

# Setup Workers
setup_workers() {
    echo ""
    echo "Step 4: Cloudflare Workers Setup"
    echo "--------------------------------"

    echo "Setting up API Gateway Worker..."
    cd stampledger-api-gateway
    npm install
    echo "Worker ready for deployment. Run 'npm run deploy' to deploy."
    cd ..
}

# Main
main() {
    check_prerequisites
    cloudflare_login
    setup_tunnel
    setup_pages
    setup_workers

    echo ""
    echo "=============================================="
    echo "  Setup Complete!"
    echo "=============================================="
    echo ""
    echo "Next steps:"
    echo "1. Update stampledger-chain/cloudflare-tunnel.yml with your tunnel ID"
    echo "2. Deploy the landing page: ./scripts/deploy-landing.sh"
    echo "3. Deploy the API gateway: ./scripts/deploy-api-gateway.sh"
    echo "4. Start the blockchain: ./scripts/deploy-chain.sh"
    echo ""
}

main

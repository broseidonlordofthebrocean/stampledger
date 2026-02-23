#!/bin/bash
set -e

# =============================================================================
#  StampLedger Chain — One-Command Deployment
#
#  Run this on a fresh Linux VPS (Ubuntu 22+, Debian 12+, etc.)
#  Prerequisites: git (to clone the repo)
#
#  Usage:
#    git clone https://github.com/broseidonlordofthebrocean/stampledger.git
#    cd stampledger/stampledger-chain
#    chmod +x scripts/deploy.sh
#    ./scripts/deploy.sh
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}"
echo "============================================"
echo "  StampLedger Chain Deployment"
echo "============================================"
echo -e "${NC}"

# ── Step 1: Check / Install Docker ──────────────────────────────────────────
echo -e "${YELLOW}[1/5] Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${CYAN}  Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}  ✓ Docker installed${NC}"
else
    echo -e "${GREEN}  ✓ Docker already installed${NC}"
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}  ✗ Docker Compose plugin not found.${NC}"
    echo "    Install it: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "${GREEN}  ✓ Docker Compose available${NC}"

# ── Step 2: Build the chain Docker image ────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/5] Building StampLedger chain image...${NC}"
echo -e "${CYAN}  This compiles the Cosmos SDK chain from source.${NC}"
echo -e "${CYAN}  First build takes 5-10 minutes. Subsequent builds use cache.${NC}"
echo ""
docker compose build

echo -e "${GREEN}  ✓ Image built successfully${NC}"

# ── Step 3: Start the chain ─────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[3/5] Starting chain node...${NC}"
docker compose up -d

echo -e "${CYAN}  Waiting for chain to initialize and start producing blocks...${NC}"
HEALTHY=false
for i in $(seq 1 90); do
    if curl -sf http://localhost:26657/status > /dev/null 2>&1; then
        HEALTHY=true
        break
    fi
    sleep 2
    # Show progress every 10 seconds
    if [ $((i % 5)) -eq 0 ]; then
        echo -e "  ${CYAN}Waiting... ($((i * 2))s)${NC}"
    fi
done

if [ "$HEALTHY" = false ]; then
    echo -e "${RED}  ✗ Chain failed to start within 3 minutes.${NC}"
    echo "    Check logs: docker compose logs stampledger-chain"
    exit 1
fi

echo -e "${GREEN}  ✓ Chain is running and producing blocks!${NC}"

# ── Step 4: Extract secrets ─────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/5] Extracting secrets...${NC}"

# Give it a moment for files to be written
sleep 2

MNEMONIC=$(docker exec stampledger-chain sh -c 'cat /root/.stampledger-chain/service-account.json 2>/dev/null' | python3 -c "import sys,json; print(json.load(sys.stdin).get('mnemonic',''))" 2>/dev/null || echo "")
PE_KEY=$(docker exec stampledger-chain cat /root/.stampledger-chain/pe-signing-key.b64 2>/dev/null || echo "")
PE_PUBKEY=$(docker exec stampledger-chain cat /root/.stampledger-chain/pe-pubkey.hex 2>/dev/null || echo "")
SERVICE_ADDR=$(docker exec stampledger-chain sh -c 'cat /root/.stampledger-chain/service-account.json 2>/dev/null' | python3 -c "import sys,json; print(json.load(sys.stdin).get('address',''))" 2>/dev/null || echo "")

# Fallback: try jq if python3 isn't available
if [ -z "$MNEMONIC" ]; then
    MNEMONIC=$(docker exec stampledger-chain sh -c 'cat /root/.stampledger-chain/service-account.json' | jq -r '.mnemonic // empty' 2>/dev/null || echo "")
    SERVICE_ADDR=$(docker exec stampledger-chain sh -c 'cat /root/.stampledger-chain/service-account.json' | jq -r '.address // empty' 2>/dev/null || echo "")
fi

if [ -z "$MNEMONIC" ] || [ -z "$PE_KEY" ]; then
    echo -e "${RED}  ✗ Could not extract secrets. Check container logs.${NC}"
    echo "    Manual extraction:"
    echo "    docker exec stampledger-chain cat /root/.stampledger-chain/service-account.json"
    echo "    docker exec stampledger-chain cat /root/.stampledger-chain/pe-signing-key.b64"
    echo "    docker exec stampledger-chain cat /root/.stampledger-chain/pe-pubkey.hex"
    exit 1
fi

echo -e "${GREEN}  ✓ Secrets extracted${NC}"

# ── Step 5: Display results ─────────────────────────────────────────────────
echo ""
SERVER_IP=$(curl -sf https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo -e "${BOLD}"
echo "============================================"
echo "  DEPLOYMENT COMPLETE"
echo "============================================"
echo -e "${NC}"
echo -e "Chain RPC:  ${GREEN}http://$SERVER_IP:26657${NC}"
echo -e "REST API:   ${GREEN}http://$SERVER_IP:1317${NC}"
echo -e "Account:    ${CYAN}$SERVICE_ADDR${NC}"
echo ""
echo -e "${BOLD}Verify it's working:${NC}"
echo "  curl http://localhost:26657/status | jq .result.sync_info"
echo ""
echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}SET THESE IN CLOUDFLARE PAGES${NC}"
echo -e "${BOLD}${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Go to: ${CYAN}Cloudflare Dashboard → Pages → stampledger-portal${NC}"
echo -e "       ${CYAN}→ Settings → Environment variables → Add variables${NC}"
echo ""
echo -e "${BOLD}1. CHAIN_RPC_URL${NC}"
echo -e "   ${GREEN}http://$SERVER_IP:26657${NC}"
echo ""
echo -e "${BOLD}2. CHAIN_MNEMONIC${NC} (encrypt this one)"
echo -e "   ${GREEN}$MNEMONIC${NC}"
echo ""
echo -e "${BOLD}3. PE_SIGNING_KEY${NC} (encrypt this one)"
echo -e "   ${GREEN}$PE_KEY${NC}"
echo ""
echo -e "${BOLD}4. PE_PUBLIC_KEY_HEX${NC}"
echo -e "   ${GREEN}$PE_PUBKEY${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BOLD}Optional: Secure with Cloudflare Tunnel${NC}"
echo "  Instead of exposing ports directly, use a CF Tunnel:"
echo "  1. curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared"
echo "  2. chmod +x /usr/local/bin/cloudflared"
echo "  3. cloudflared tunnel login"
echo "  4. cloudflared tunnel create stampledger-chain"
echo "  5. cloudflared tunnel route dns stampledger-chain rpc.stampledger.com"
echo "  6. Edit cloudflare-tunnel.yml with your tunnel ID"
echo "  7. Uncomment the cloudflared service in docker-compose.yml"
echo "  8. docker compose up -d"
echo "  9. Update CHAIN_RPC_URL to https://rpc.stampledger.com"
echo ""
echo -e "${GREEN}Done! Stamps will now be written to the blockchain.${NC}"

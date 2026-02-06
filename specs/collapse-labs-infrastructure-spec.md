# Collapse Labs — Infrastructure & Deployment Specification
## Self-Hosted Architecture for the Full Product Portfolio
### February 2026

---

## 1. OVERVIEW

This document defines the shared infrastructure that supports the entire Collapse Labs / Midnight Works product portfolio. Every product — StampLedger, Asset Chain, UpstreamScout, and future verticals — runs on the same foundational stack: a self-hosted Ubuntu server behind Cloudflare Tunnel, with Supabase for data persistence, Docker for service isolation, and Cloudflare Pages/Workers for the frontend and edge compute.

The architecture is designed around three principles: zero monthly cost at pre-revenue stage, zero open ports on the home network, and zero data loss on code deployments.

---

## 2. PRODUCT PORTFOLIO & STACK REQUIREMENTS

### 2.1 StampLedger — Blockchain PE Stamp Verification

**What it does:** Engineers stamp documents with blockchain-verified digital seals. Inspectors scan QR codes to verify stamps instantly. Municipalities get immutable proof that the PE who stamped a document was licensed and insured at the time of stamping.

**Live sites:** stampledger.com, portal.stampledger.com

**Stack requirements:**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | SvelteKit or React on Cloudflare Pages | PE portal, inspector verification page |
| Auth | Supabase Auth (email/password, OAuth) | PE accounts, org admin, inspector access |
| Database | Supabase PostgreSQL | Stamps, projects, documents, specs, licenses, tokens |
| File storage | Supabase Storage or Cloudflare R2 | Stamped PDFs, uploaded drawings, QR images |
| Blockchain | Cosmos SDK node (Go) on home server | Immutable stamp records, transaction history |
| API | Go + Gin on home server | Document hashing, QR generation, CMAC validation, Bluebeam webhooks |
| PDF processing | pdf-lib (Node) or reportlab (Python) | QR embedding in PDFs, verification certificates |
| Email | Resend | Stamp notifications, pilot invitations, verification alerts |

**Blockchain modules:** Stamp Module (create, verify, revoke stamps), Credential Module (PE license records)

**Key integrations:** Bluebeam Studio API (webhooks), Adobe Acrobat JS extension, state licensing board data feeds

---

### 2.2 Asset Chain — Supply Chain Tracking & Verification

**What it does:** Defense contractors and industrial operations track physical assets through blockchain-secured NFC/RFID tags. Every custody transfer, maintenance event, and audit is cryptographically verified and immutably recorded.

**Live sites:** assetchain-web.pages.dev (demo)

**Stack requirements:**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | SvelteKit or React on Cloudflare Pages | Dashboard, asset management, movements, audits |
| Auth | Supabase Auth (email/password, CAC/PIV via custom SAML later) | User accounts, role-based access (admin, technician, inspector, auditor) |
| Database | Supabase PostgreSQL | Assets, shipments, manifests, maintenance records, contractors, IoT devices, alerts, audits |
| File storage | Supabase Storage or Cloudflare R2 | Maintenance photos, shipping documents, audit reports |
| Blockchain | Cosmos SDK node (shared with StampLedger) | Asset registry, movement records, custody transfers, audit proofs |
| API | Go + Gin on home server | NFC CMAC validation (NTAG 424 DNA), RFID portal event ingestion, manifest management |
| IoT ingestion | MQTT broker (Mosquitto) on home server | Sensor data from GPS trackers, temperature sensors, shock sensors |
| Mobile | React Native + Expo or Progressive Web App | Field scanning (NFC tap), packing flow, receiving flow |
| Email | Resend | Shipment notifications, alert escalations, audit reports |

**Blockchain modules:** Asset Module (register, transfer, decommission), Movement Module (shipments, manifests), Maintenance Module (work orders, records), Audit Module (reconciliation records)

**Hardware integration:** NTAG 424 DNA (NFC asset tags), UHF RFID (container tags via Impinj readers), NFC tamper seals

---

### 2.3 UpstreamScout — Municipal Water Infrastructure Intelligence

**What it does:** Aggregates public data on water and wastewater infrastructure projects across the Midwest, tracks project lifecycles, and surfaces procurement intelligence for engineering firms and contractors.

**Live sites:** upstreamscout.com

**Stack requirements:**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | SvelteKit or React on Cloudflare Pages | Search, project detail, municipality profiles, maps |
| Auth | Supabase Auth | Subscriber accounts, trial management |
| Database | Supabase PostgreSQL | Municipalities, projects, facilities, permits, bid documents, contact info |
| File storage | Cloudflare R2 | Cached public documents, generated reports |
| API | Cloudflare Workers or Go on home server | Search, filtering, AI-powered project classification |
| Data pipeline | Python scrapers on home server (cron) | State DNR feeds, EPA data, municipal meeting minutes, bid postings |
| Maps | Mapbox or Google Maps | Facility locations, project map views |
| AI/ML | Claude API or local LLM | Project lifecycle classification, document summarization |
| Email | Resend | Weekly intelligence digests, new project alerts |
| Payments | Stripe | Subscription billing |

**No blockchain needed.** UpstreamScout is a SaaS data product — traditional database architecture is the right fit.

---

### 2.4 Education Suite — Teacher Productivity Tools

**What it does:** Suite of 8 AI-powered tools for teachers: lesson planning, IEP writing, report card comments, sub plans, test building, parent communication, behavior logging, curriculum generation.

**Live sites:** publicschoolbook.com (existing, needs iteration), additional tools TBD

**Stack requirements:**

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | SvelteKit or React on Cloudflare Pages | Tool interfaces, teacher dashboard, admin portal |
| Auth | Supabase Auth (email/password, Google OAuth for schools) | Teacher accounts, building admin, district admin |
| Database | Supabase PostgreSQL | User profiles, class rosters, generated content, templates, state standards |
| File storage | Supabase Storage | Generated PDFs (lesson plans, IEPs, reports), uploaded documents |
| API | Cloudflare Workers | Proxying AI requests, content generation orchestration |
| AI | Claude API (Anthropic) | Content generation for all 8 tools |
| State standards DB | PostgreSQL table or JSON files | All 50 states' learning standards, indexed by grade/subject |
| Email | Resend | Account management, shared content notifications |
| Payments | Stripe | Teacher ($9.99/mo), Building ($6.99/seat), District (custom) |

**No blockchain needed.** Education suite is pure SaaS.

---

### 2.5 Future Verticals (Blue Collar Trades, Municipal Government, Medical)

All future verticals follow the same pattern: Cloudflare Pages frontend, Supabase Auth + PostgreSQL + Storage, Claude API for AI features, Stripe for payments. They plug into the existing infrastructure with no additional server requirements. The home server handles any compute-heavy backend tasks; Cloudflare Workers handles everything else.

---

## 3. INFRASTRUCTURE ARCHITECTURE

### 3.1 Physical Topology

```
                    ┌─────────────────────────────────────┐
                    │           CLOUDFLARE                 │
                    │                                     │
                    │  Pages (frontends)                  │
                    │  Workers (edge compute)             │
                    │  R2 (file storage)                  │
                    │  DNS + CDN + DDoS protection        │
                    │  Tunnel endpoint                    │
                    └──────────────┬──────────────────────┘
                                   │
                          Cloudflare Tunnel
                        (outbound-only, encrypted)
                        (no open ports on router)
                                   │
                    ┌──────────────┴──────────────────────┐
                    │        HOME SERVER (Ubuntu 24.04)    │
                    │                                     │
                    │  ┌─────────────────────────────┐    │
                    │  │  Docker Compose              │    │
                    │  │                             │    │
                    │  │  ┌─────────────────────┐   │    │
                    │  │  │  Supabase Stack      │   │    │
                    │  │  │  - PostgreSQL 15     │   │    │
                    │  │  │  - GoTrue (Auth)     │   │    │
                    │  │  │  - Storage API       │   │    │
                    │  │  │  - PostgREST         │   │    │
                    │  │  │  - Realtime          │   │    │
                    │  │  │  - Studio (Admin)    │   │    │
                    │  │  └─────────────────────┘   │    │
                    │  │                             │    │
                    │  │  ┌─────────────────────┐   │    │
                    │  │  │  Cosmos SDK Node     │   │    │
                    │  │  │  - StampLedger       │   │    │
                    │  │  │    Stamp Module      │   │    │
                    │  │  │    Credential Module │   │    │
                    │  │  │  - Asset Chain       │   │    │
                    │  │  │    Asset Module      │   │    │
                    │  │  │    Movement Module   │   │    │
                    │  │  │    Maintenance Module│   │    │
                    │  │  │    Audit Module      │   │    │
                    │  │  └─────────────────────┘   │    │
                    │  │                             │    │
                    │  │  ┌─────────────────────┐   │    │
                    │  │  │  Application APIs    │   │    │
                    │  │  │  - StampLedger API   │   │    │
                    │  │  │  - Asset Chain API   │   │    │
                    │  │  │  - UpstreamScout     │   │    │
                    │  │  │    scrapers          │   │    │
                    │  │  └─────────────────────┘   │    │
                    │  │                             │    │
                    │  │  ┌─────────────────────┐   │    │
                    │  │  │  Supporting Services │   │    │
                    │  │  │  - Mosquitto (MQTT)  │   │    │
                    │  │  │  - Redis (cache)     │   │    │
                    │  │  │  - Cloudflared       │   │    │
                    │  │  └─────────────────────┘   │    │
                    │  │                             │    │
                    │  └─────────────────────────────┘    │
                    │                                     │
                    │  Volumes:                           │
                    │  /data/postgres    (database)       │
                    │  /data/storage     (files)          │
                    │  /data/cosmos      (blockchain)     │
                    │  /data/redis       (cache)          │
                    │  /data/backups     (daily dumps)    │
                    │                                     │
                    │  LUKS encrypted drive               │
                    │  Automated daily backups to R2      │
                    └─────────────────────────────────────┘
```

### 3.2 Network Architecture

```
EXTERNAL TRAFFIC FLOW:

User visits stampledger.com
  → Cloudflare DNS resolves to Cloudflare CDN
  → Cloudflare Pages serves frontend (static HTML/JS/CSS)
  → Frontend makes API call to api.stampledger.com
  → Cloudflare routes through Tunnel to home server
  → Home server processes request (Go API → PostgreSQL / Cosmos)
  → Response travels back through Tunnel → Cloudflare → User

ZERO OPEN PORTS ON HOME ROUTER.
Home IP address never exposed.
All traffic encrypted end-to-end.
```

### 3.3 Domain Routing via Cloudflare Tunnel

| Domain | Routes To | Service |
|--------|----------|---------|
| stampledger.com | Cloudflare Pages | Frontend |
| portal.stampledger.com | Cloudflare Pages | PE Portal frontend |
| api.stampledger.com | Home server :8001 | StampLedger Go API |
| assetchain.io | Cloudflare Pages | Frontend |
| api.assetchain.io | Home server :8002 | Asset Chain Go API |
| upstreamscout.com | Cloudflare Pages | Frontend |
| api.upstreamscout.com | Home server :8003 | UpstreamScout API |
| supabase.collapselabs.com | Home server :8000 | Supabase Studio (admin only) |
| auth.collapselabs.com | Home server :9999 | Supabase GoTrue (shared auth) |
| db.collapselabs.com | Home server :3000 | Supabase PostgREST (shared DB API) |

All routing configured in Cloudflare Tunnel's `config.yml`:

```yaml
tunnel: collapse-labs-homelab
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: api.stampledger.com
    service: http://localhost:8001
  - hostname: api.assetchain.io
    service: http://localhost:8002
  - hostname: api.upstreamscout.com
    service: http://localhost:8003
  - hostname: supabase.collapselabs.com
    service: http://localhost:8000
    originRequest:
      noTLSVerify: true
  - hostname: auth.collapselabs.com
    service: http://localhost:9999
  - hostname: db.collapselabs.com
    service: http://localhost:3000
  - service: http_status:404
```

---

## 4. SERVER SETUP

### 4.1 Hardware Requirements

**Minimum (will work for dev + early pilots):**
- CPU: 4 cores (Intel i5 or AMD Ryzen 5, any generation from 2018+)
- RAM: 16GB DDR4
- Storage: 500GB SSD (NVMe preferred for database performance)
- Network: Ethernet to router (not WiFi)

**Recommended (comfortable for production with 10-50 active users):**
- CPU: 8 cores (Intel i7/i9 or AMD Ryzen 7)
- RAM: 32GB DDR4/DDR5
- Storage: 1TB NVMe SSD (primary) + 2TB HDD (backups)
- Network: Gigabit Ethernet
- UPS: Battery backup (30-60 min runtime for clean shutdown on power loss)

### 4.2 OS Installation

Ubuntu 24.04 LTS Server (no desktop environment — all management via SSH).

```bash
# After fresh Ubuntu 24.04 Server install:

# Update everything
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y \
  curl wget git htop tmux ufw fail2ban \
  docker.io docker-compose-v2 \
  net-tools jq unzip

# Add your user to docker group (no sudo needed for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# Enable unattended security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4.3 Security Hardening

```bash
# SSH: Key-only authentication
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Firewall: Deny all inbound (Cloudflare Tunnel is outbound-only)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh          # Keep SSH for local network management
sudo ufw enable

# Fail2ban: Block brute force SSH attempts
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Automatic security updates (already configured above)
# Verify:
cat /etc/apt/apt.conf.d/20auto-upgrades
# Should show:
# APT::Periodic::Update-Package-Lists "1";
# APT::Periodic::Unattended-Upgrade "1";
```

### 4.4 LUKS Full-Disk Encryption

If the server stores defense contractor data (Asset Chain), encrypt the data partition:

```bash
# For a separate data partition (recommended):
sudo cryptsetup luksFormat /dev/sdb1
sudo cryptsetup open /dev/sdb1 data_crypt
sudo mkfs.ext4 /dev/mapper/data_crypt
sudo mkdir /data
sudo mount /dev/mapper/data_crypt /data

# Auto-unlock on boot with keyfile (stored on encrypted root):
sudo dd if=/dev/urandom of=/root/.data_keyfile bs=1024 count=4
sudo chmod 400 /root/.data_keyfile
sudo cryptsetup luksAddKey /dev/sdb1 /root/.data_keyfile

# Add to /etc/crypttab:
# data_crypt /dev/sdb1 /root/.data_keyfile luks

# Add to /etc/fstab:
# /dev/mapper/data_crypt /data ext4 defaults 0 2
```

### 4.5 Cloudflare Tunnel Installation

```bash
# Install cloudflared
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | \
  sudo tee /usr/share/keyrings/cloudflare.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare.gpg] https://pkg.cloudflare.com/cloudflare-main $(lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/cloudflare.list
sudo apt update && sudo apt install cloudflared

# Authenticate with Cloudflare account
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create collapse-labs-homelab

# Place config at /etc/cloudflared/config.yml (see Section 3.3)

# Install as systemd service (runs on boot, auto-restarts)
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

# Verify
cloudflared tunnel info collapse-labs-homelab
```

---

## 5. DOCKER COMPOSE — FULL STACK

### 5.1 Directory Structure

```
/data/
├── docker-compose.yml
├── .env
├── postgres/           # PostgreSQL data (persistent)
├── storage/            # Supabase file storage (persistent)
├── cosmos/             # Blockchain data (persistent)
├── redis/              # Redis data (persistent)
├── mosquitto/          # MQTT broker config + data
│   └── config/
│       └── mosquitto.conf
├── backups/            # Daily database dumps
├── stampledger-api/    # StampLedger Go API source
├── assetchain-api/     # Asset Chain Go API source
└── scrapers/           # UpstreamScout Python scrapers
```

### 5.2 Environment Variables

```bash
# /data/.env

# PostgreSQL
POSTGRES_PASSWORD=<generate-strong-password>
POSTGRES_DB=collapselabs
POSTGRES_PORT=5432

# Supabase
SUPABASE_JWT_SECRET=<generate-with-openssl-rand-base64-32>
SUPABASE_ANON_KEY=<generate-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<generate-supabase-service-key>
SUPABASE_URL=http://localhost:8000

# APIs
STAMPLEDGER_API_PORT=8001
ASSETCHAIN_API_PORT=8002
UPSTREAMSCOUT_API_PORT=8003

# External services
RESEND_API_KEY=<your-resend-key>
STRIPE_SECRET_KEY=<your-stripe-key>
ANTHROPIC_API_KEY=<your-claude-api-key>
MAPBOX_TOKEN=<your-mapbox-token>

# Cosmos
COSMOS_CHAIN_ID=collapselabs-mainnet-1
COSMOS_MONIKER=homelab-validator
```

### 5.3 Docker Compose File

```yaml
# /data/docker-compose.yml
version: "3.8"

services:
  # ──────────────────────────────────────────────
  # SUPABASE STACK
  # ──────────────────────────────────────────────
  
  supabase-db:
    image: supabase/postgres:15.1.1.61
    container_name: supabase-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    volumes:
      - ./postgres:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  supabase-auth:
    image: supabase/gotrue:v2.151.0
    container_name: supabase-auth
    restart: unless-stopped
    ports:
      - "9999:9999"
    depends_on:
      supabase-db:
        condition: service_healthy
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: https://auth.collapselabs.com
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@supabase-db:5432/${POSTGRES_DB}?search_path=auth
      GOTRUE_SITE_URL: https://stampledger.com
      GOTRUE_URI_ALLOW_LIST: "https://stampledger.com,https://portal.stampledger.com,https://assetchain.io,https://upstreamscout.com"
      GOTRUE_JWT_SECRET: ${SUPABASE_JWT_SECRET}
      GOTRUE_JWT_EXP: 3600
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
      GOTRUE_MAILER_AUTOCONFIRM: "false"

  supabase-rest:
    image: postgrest/postgrest:v12.0.2
    container_name: supabase-rest
    restart: unless-stopped
    ports:
      - "3000:3000"
    depends_on:
      supabase-db:
        condition: service_healthy
    environment:
      PGRST_DB_URI: postgres://postgres:${POSTGRES_PASSWORD}@supabase-db:5432/${POSTGRES_DB}
      PGRST_DB_SCHEMAS: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${SUPABASE_JWT_SECRET}

  supabase-storage:
    image: supabase/storage-api:v0.46.4
    container_name: supabase-storage
    restart: unless-stopped
    ports:
      - "5000:5000"
    depends_on:
      supabase-db:
        condition: service_healthy
    volumes:
      - ./storage:/var/lib/storage
    environment:
      ANON_KEY: ${SUPABASE_ANON_KEY}
      SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@supabase-db:5432/${POSTGRES_DB}
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
      PGRST_JWT_SECRET: ${SUPABASE_JWT_SECRET}

  supabase-studio:
    image: supabase/studio:20240101
    container_name: supabase-studio
    restart: unless-stopped
    ports:
      - "8000:3000"
    depends_on:
      supabase-db:
        condition: service_healthy
    environment:
      STUDIO_PG_META_URL: http://supabase-meta:8080
      SUPABASE_URL: http://localhost:8000
      SUPABASE_REST_URL: http://supabase-rest:3000
      SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
      SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}

  supabase-meta:
    image: supabase/postgres-meta:v0.80.0
    container_name: supabase-meta
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      supabase-db:
        condition: service_healthy
    environment:
      PG_META_PORT: 8080
      PG_META_DB_HOST: supabase-db
      PG_META_DB_PORT: 5432
      PG_META_DB_NAME: ${POSTGRES_DB}
      PG_META_DB_USER: postgres
      PG_META_DB_PASSWORD: ${POSTGRES_PASSWORD}

  # ──────────────────────────────────────────────
  # BLOCKCHAIN NODE
  # ──────────────────────────────────────────────
  
  cosmos-node:
    build:
      context: ./cosmos
      dockerfile: Dockerfile
    container_name: cosmos-node
    restart: unless-stopped
    ports:
      - "26656:26656"   # P2P
      - "26657:26657"   # RPC
      - "1317:1317"     # REST API
      - "9090:9090"     # gRPC
    volumes:
      - ./cosmos:/root/.collapselabs
    environment:
      CHAIN_ID: ${COSMOS_CHAIN_ID}
      MONIKER: ${COSMOS_MONIKER}

  # ──────────────────────────────────────────────
  # APPLICATION APIs
  # ──────────────────────────────────────────────
  
  stampledger-api:
    build:
      context: ./stampledger-api
      dockerfile: Dockerfile
    container_name: stampledger-api
    restart: unless-stopped
    ports:
      - "${STAMPLEDGER_API_PORT}:8080"
    depends_on:
      supabase-db:
        condition: service_healthy
      cosmos-node:
        condition: service_started
    environment:
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@supabase-db:5432/${POSTGRES_DB}
      COSMOS_RPC: http://cosmos-node:26657
      COSMOS_REST: http://cosmos-node:1317
      RESEND_API_KEY: ${RESEND_API_KEY}
      JWT_SECRET: ${SUPABASE_JWT_SECRET}
      PORT: 8080

  assetchain-api:
    build:
      context: ./assetchain-api
      dockerfile: Dockerfile
    container_name: assetchain-api
    restart: unless-stopped
    ports:
      - "${ASSETCHAIN_API_PORT}:8080"
    depends_on:
      supabase-db:
        condition: service_healthy
      cosmos-node:
        condition: service_started
    environment:
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@supabase-db:5432/${POSTGRES_DB}
      COSMOS_RPC: http://cosmos-node:26657
      COSMOS_REST: http://cosmos-node:1317
      MQTT_BROKER: tcp://mosquitto:1883
      RESEND_API_KEY: ${RESEND_API_KEY}
      JWT_SECRET: ${SUPABASE_JWT_SECRET}
      PORT: 8080

  # ──────────────────────────────────────────────
  # SUPPORTING SERVICES
  # ──────────────────────────────────────────────
  
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - ./redis:/data
    command: redis-server --appendonly yes

  mosquitto:
    image: eclipse-mosquitto:2
    container_name: mosquitto
    restart: unless-stopped
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log

  # ──────────────────────────────────────────────
  # TUNNEL (connects everything to Cloudflare)
  # ──────────────────────────────────────────────
  
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --config /etc/cloudflared/config.yml run
    volumes:
      - /etc/cloudflared:/etc/cloudflared
    depends_on:
      - stampledger-api
      - assetchain-api
      - supabase-auth
      - supabase-rest
      - supabase-studio
```

### 5.4 Operations

```bash
# Start everything
cd /data && docker compose up -d

# Check status
docker compose ps

# View logs for a specific service
docker compose logs -f stampledger-api

# Restart a single service (e.g., after code update)
docker compose restart stampledger-api

# Update a service's code and rebuild
cd /data/stampledger-api && git pull
docker compose build stampledger-api
docker compose up -d stampledger-api
# Database untouched. Blockchain untouched. Zero data loss.

# Update all infrastructure images
docker compose pull
docker compose up -d

# Full stop (data persists in volumes)
docker compose down

# Nuclear option — remove everything INCLUDING data (use with extreme caution)
docker compose down -v
```

---

## 6. DATABASE SCHEMA

### 6.1 Shared Tables (All Products)

```sql
-- Organizations (shared across products)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'engineering_firm', 'contractor', 'municipality', 'school_district'
  cage_code TEXT, -- Defense contractors
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Supabase Auth handles credentials; this stores profile data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL, -- 'admin', 'engineer', 'technician', 'inspector', 'teacher'
  title TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 StampLedger Tables

```sql
-- PE Licenses
CREATE TABLE pe_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  license_number TEXT NOT NULL,
  state TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  disciplines TEXT[] NOT NULL,
  expiry_date DATE,
  insurance_status TEXT DEFAULT 'unverified',
  insurance_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE sl_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  project_id TEXT NOT NULL, -- 'PS-047'
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stamps
CREATE TABLE stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stamp_id TEXT UNIQUE NOT NULL, -- 'SL-2026-00047'
  project_id UUID REFERENCES sl_projects(id),
  pe_license_id UUID REFERENCES pe_licenses(id),
  document_hash TEXT NOT NULL,
  document_filename TEXT,
  document_page_count INTEGER,
  status TEXT DEFAULT 'valid', -- 'valid', 'revoked', 'expired'
  qr_placement TEXT DEFAULT 'bottom_right_first_page',
  blockchain_tx_hash TEXT,
  blockchain_block_height BIGINT,
  stamped_pdf_path TEXT, -- Path in Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT
);

-- Stamp Tokens
CREATE TABLE stamp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_used INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Specifications
CREATE TABLE specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  spec_id TEXT NOT NULL, -- 'SP-E-001'
  title TEXT NOT NULL,
  revision TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 Asset Chain Tables

```sql
-- Assets
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT UNIQUE NOT NULL, -- 'AST-001'
  organization_id UUID REFERENCES organizations(id),
  description TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  nsn TEXT, -- National Stock Number
  serial_number TEXT,
  part_number TEXT,
  manufacturer TEXT,
  status TEXT DEFAULT 'operational', -- 'operational', 'maintenance', 'transit', 'decommissioned'
  location TEXT,
  custodian_id UUID REFERENCES profiles(id),
  nfc_tag_uid TEXT, -- NTAG 424 DNA UID
  nfc_aes_key_encrypted TEXT, -- AES key (encrypted at rest)
  nfc_read_counter INTEGER DEFAULT 0,
  acquisition_cost DECIMAL(12,2),
  contract_number TEXT,
  last_inventory_date TIMESTAMPTZ,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments (Movements)
CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id TEXT UNIQUE NOT NULL, -- 'SHP-2026-0047'
  organization_id UUID REFERENCES organizations(id),
  origin_facility TEXT NOT NULL,
  origin_location TEXT,
  destination_facility TEXT NOT NULL,
  destination_location TEXT,
  status TEXT DEFAULT 'packing', -- 'packing', 'sealed', 'in_transit', 'arrived', 'received', 'discrepancy'
  rfid_container_tag_tid TEXT,
  seal_tag_uid TEXT,
  seal_status TEXT DEFAULT 'not_applied',
  manifest_hash TEXT,
  packed_by UUID REFERENCES profiles(id),
  received_by UUID REFERENCES profiles(id),
  contract_number TEXT,
  expected_arrival TIMESTAMPTZ,
  actual_arrival TIMESTAMPTZ,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment Items (Manifest)
CREATE TABLE shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID REFERENCES shipments(id),
  asset_id UUID REFERENCES assets(id),
  nfc_packed_cmac TEXT,
  nfc_packed_counter INTEGER,
  nfc_received_cmac TEXT,
  nfc_received_counter INTEGER,
  status TEXT DEFAULT 'packed', -- 'packed', 'verified', 'missing', 'extra', 'damaged'
  condition TEXT DEFAULT 'serviceable',
  notes TEXT
);

-- Maintenance Records
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id TEXT UNIQUE NOT NULL, -- 'REC-001'
  asset_id UUID REFERENCES assets(id),
  maintenance_type TEXT NOT NULL, -- 'inspection', 'preventive', 'corrective', 'calibration'
  description TEXT,
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cost DECIMAL(12,2),
  nfc_start_cmac TEXT,
  nfc_end_cmac TEXT,
  notes TEXT,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maintenance Schedules
CREATE TABLE maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  maintenance_type TEXT NOT NULL,
  frequency TEXT NOT NULL, -- 'Every 500 flight hours', 'Every 3 months', 'Annual'
  last_performed TIMESTAMPTZ,
  next_due TIMESTAMPTZ,
  status TEXT DEFAULT 'current' -- 'current', 'upcoming', 'overdue'
);

-- Contractors
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cage_code TEXT,
  contract_number TEXT,
  clearance_level TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'suspended'
  contact_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IoT Devices
CREATE TABLE iot_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL, -- 'DEV-001'
  device_name TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'gps_tracker', 'temperature_sensor', 'shock_sensor', 'rfid_reader'
  asset_id UUID REFERENCES assets(id),
  location TEXT,
  firmware_version TEXT,
  battery_percent INTEGER,
  status TEXT DEFAULT 'active', -- 'active', 'offline', 'maintenance', 'low_battery'
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id TEXT UNIQUE NOT NULL, -- 'ALT-001'
  asset_id UUID REFERENCES assets(id),
  device_id UUID REFERENCES iot_devices(id),
  alert_type TEXT NOT NULL, -- 'temperature_exceedance', 'geofence_breach', 'low_battery', 'maintenance_overdue', 'seal_tamper'
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  message TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'acknowledged', 'resolved'
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Records
CREATE TABLE audit_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id TEXT UNIQUE NOT NULL, -- 'REC-001'
  facility TEXT NOT NULL,
  auditor_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved'
  items_matched INTEGER DEFAULT 0,
  items_missing INTEGER DEFAULT 0,
  items_extra INTEGER DEFAULT 0,
  performed_at TIMESTAMPTZ,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NFC Tag Registry (master key store)
CREATE TABLE nfc_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_uid TEXT UNIQUE NOT NULL,
  tag_type TEXT NOT NULL, -- 'asset', 'seal'
  aes_key_encrypted TEXT NOT NULL, -- Encrypted with server master key
  asset_id UUID REFERENCES assets(id),
  last_counter INTEGER DEFAULT 0,
  last_verified_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'replaced', 'decommissioned'
  registered_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.4 Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;

-- Users can only see assets belonging to their organization
CREATE POLICY "Users see own org assets" ON assets
  FOR SELECT USING (
    organization_id = (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Users can only create assets for their organization
CREATE POLICY "Users create own org assets" ON assets
  FOR INSERT WITH CHECK (
    organization_id = (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Same pattern for all tables
-- Public verification endpoints bypass RLS via service role key
```

---

## 7. BACKUP STRATEGY

### 7.1 Automated Daily Backups

```bash
#!/bin/bash
# /data/scripts/backup.sh
# Run via cron: 0 3 * * * /data/scripts/backup.sh

BACKUP_DIR="/data/backups"
DATE=$(date +%Y-%m-%d)
RETENTION_DAYS=30

# PostgreSQL dump
docker exec supabase-db pg_dumpall -U postgres | gzip > "$BACKUP_DIR/postgres-$DATE.sql.gz"

# Cosmos blockchain state
tar -czf "$BACKUP_DIR/cosmos-$DATE.tar.gz" -C /data cosmos/

# Upload to Cloudflare R2 (off-site backup)
# Requires rclone configured with R2 credentials
rclone copy "$BACKUP_DIR/postgres-$DATE.sql.gz" r2:collapselabs-backups/postgres/
rclone copy "$BACKUP_DIR/cosmos-$DATE.tar.gz" r2:collapselabs-backups/cosmos/

# Clean up old local backups
find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

```bash
# Install cron job
crontab -e
# Add: 0 3 * * * /data/scripts/backup.sh >> /data/backups/backup.log 2>&1
```

### 7.2 Restore Procedure

```bash
# Restore PostgreSQL
gunzip -c /data/backups/postgres-2026-02-06.sql.gz | \
  docker exec -i supabase-db psql -U postgres

# Restore Cosmos
docker compose stop cosmos-node
tar -xzf /data/backups/cosmos-2026-02-06.tar.gz -C /data/
docker compose start cosmos-node
```

---

## 8. DEPLOYMENT WORKFLOW

### 8.1 Code Update Process

```
Developer pushes code to GitHub
       │
       ├── Frontend (Cloudflare Pages)
       │   └── Cloudflare auto-builds and deploys
       │       └── Users see new frontend on next page load
       │       └── Database UNTOUCHED
       │
       ├── Backend API (Home Server)
       │   └── SSH into server (or GitHub Actions webhook)
       │   └── cd /data/stampledger-api && git pull
       │   └── docker compose build stampledger-api
       │   └── docker compose up -d stampledger-api
       │   └── Container restarts with new code
       │   └── Database UNTOUCHED, Blockchain UNTOUCHED
       │
       └── Database Schema Change
           └── Write migration SQL file
           └── Apply: docker exec supabase-db psql -U postgres -f migration.sql
           └── Migrations ADD columns/tables, never DELETE existing data
           └── Application code handles both old and new schema during transition
```

### 8.2 Zero-Downtime Deploys

For the backend APIs, the Cloudflare Tunnel handles the brief gap during container restart. Requests during the 1-2 second restart window get a 502, which the frontend should retry automatically. For true zero-downtime, run two instances of each API behind a local nginx reverse proxy and do rolling restarts — but that's a future optimization, not a launch requirement.

---

## 9. MONITORING

### 9.1 Basic Health Checks

```bash
#!/bin/bash
# /data/scripts/healthcheck.sh
# Run via cron every 5 minutes

SERVICES=("supabase-db" "supabase-auth" "cosmos-node" "stampledger-api" "assetchain-api" "cloudflared")

for svc in "${SERVICES[@]}"; do
  STATUS=$(docker inspect --format='{{.State.Status}}' "$svc" 2>/dev/null)
  if [ "$STATUS" != "running" ]; then
    echo "ALERT: $svc is $STATUS — attempting restart"
    docker compose -f /data/docker-compose.yml restart "$svc"
    # Send alert via Resend API or push notification
  fi
done
```

### 9.2 Disk Space Monitoring

```bash
# Alert if disk usage exceeds 80%
USAGE=$(df /data --output=pcent | tail -1 | tr -d ' %')
if [ "$USAGE" -gt 80 ]; then
  echo "DISK ALERT: /data at ${USAGE}%"
fi
```

---

## 10. COST SUMMARY

### 10.1 Pre-Revenue (Current Stage)

| Item | Monthly Cost |
|------|-------------|
| Cloudflare Pages/Workers/R2 | $0 (free tier) |
| Cloudflare Tunnel | $0 (included free) |
| Home server hardware | $0 (already owned) |
| Home server electricity | ~$10-15 |
| Domain names (annual, amortized) | ~$5 |
| Resend (email) | $0 (100/day free) |
| Claude API (education suite) | Pay-as-you-go |
| **Total** | **~$15-20/month** |

### 10.2 Early Revenue (10-50 Paying Customers)

| Item | Monthly Cost |
|------|-------------|
| Everything above | $15-20 |
| Stripe fees (2.9% + $0.30 per transaction) | Variable |
| Resend (paid tier if needed) | $20 |
| Cloudflare Pro (if needed) | $20 |
| UPS battery backup | One-time $150-300 |
| **Total** | **~$55-60/month** |

### 10.3 Scale Trigger (Move to Cloud)

Move off the home server when any of these happen:
- Revenue exceeds $5K/month (can justify cloud hosting costs)
- A customer requires an SLA with guaranteed uptime
- A defense contractor requires FedRAMP or IL4/IL5 certification
- Home internet reliability becomes a bottleneck

Migration path: `docker compose` the same stack onto Railway ($20-100/mo), Hetzner ($20-50/mo for a dedicated server), or AWS GovCloud (for FedRAMP). The containerized architecture means the migration is a file copy + DNS change, not a rewrite.

---

## 11. SECURITY SUMMARY

| Threat | Mitigation |
|--------|-----------|
| Home IP exposed | Cloudflare Tunnel — outbound only, IP never published |
| Port scanning / DDoS | No open ports; Cloudflare absorbs DDoS |
| SSH brute force | Key-only auth + Fail2ban |
| Physical theft of server | LUKS full-disk encryption |
| Database breach | Supabase RLS + encrypted AES keys for NFC tags |
| Unpatched vulnerabilities | Unattended-upgrades enabled |
| Service crash | Docker restart policies + health check cron |
| Data loss | Daily PostgreSQL dumps + blockchain data to Cloudflare R2 |
| Man-in-the-middle | TLS everywhere (Cloudflare handles certs) |
| Container escape | Docker isolation + minimal container privileges |

---

## 12. FIRST STEPS

1. **Today:** Install Ubuntu 24.04 Server on the spare computer
2. **Today:** Install Docker, cloudflared, set up Cloudflare Tunnel
3. **This week:** Stand up Supabase stack (PostgreSQL + Auth)
4. **This week:** Create database tables for StampLedger (or Asset Chain — whichever ships first)
5. **This week:** Connect existing frontend to Supabase (replace hardcoded data with real queries)
6. **Next week:** Add Supabase Auth (login/signup flow)
7. **Next week:** Build first API endpoint (Go) for blockchain operations or NFC validation
8. **Ongoing:** Push frontend updates via Cloudflare Pages, push backend updates via Docker rebuild, database persists through all deployments

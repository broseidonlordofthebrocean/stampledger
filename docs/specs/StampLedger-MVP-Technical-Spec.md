# StampLedger - MVP Technical Specification

**Version:** 1.0  
**Date:** January 27, 2026  
**Target Completion:** May 2026 (4 months)  
**Team Size:** 1 developer (you)

---

## MVP Goals

### Primary Objectives

1. **Prove Technical Feasibility**: Show that blockchain PE stamps work
2. **Validate Market Demand**: Get 3 municipalities + 20 PEs using it
3. **Generate Initial Revenue**: Break-even by Month 10
4. **Build Foundation**: Architecture that scales to 10,000+ users

### MVP Feature Set (Minimum Viable Product)

**Must Have:**
- ✅ PE can upload drawing, create stamp, get stamped PDF with QR code
- ✅ Inspector can scan QR code, see valid/invalid in 2 seconds
- ✅ Blockchain stores stamp record (Cosmos SDK)
- ✅ Database stores rich metadata (PostgreSQL)
- ✅ API for programmatic access (REST)
- ✅ Basic web dashboard (PE portal)
- ✅ Mobile app for inspectors (React Native)
- ✅ Authentication (email/password + JWT)
- ✅ PE license verification (manual initially)
- ✅ Payment integration (Stripe)

**Nice to Have (if time permits):**
- ⭕ GraphQL API (advanced queries)
- ⭕ Insurance verification (automated)
- ⭕ Batch stamping (multiple drawings at once)
- ⭕ Analytics dashboard (usage stats)

**Explicitly Out of Scope for MVP:**
- ❌ Automated PE license sync (do manually)
- ❌ Hardware wallet integration (use MetaMask)
- ❌ Multi-language support (English only)
- ❌ White-label option (single brand)
- ❌ Enterprise features (SSO, custom reports)

### Success Metrics

**Technical:**
- Stamp creation: <5 seconds (target: 2 seconds)
- Verification: <1 second (target: 200ms)
- Blockchain finality: <10 seconds (target: 5 seconds)
- Zero data loss
- 99% uptime (during pilot)

**Business:**
- 3 municipalities signed up (free pilot)
- 20 PEs creating stamps
- 100 stamps created in pilot
- 500 verifications performed
- NPS >40 (satisfaction)

---

## Technology Stack (MVP)

### Backend

| Component | Technology | Why |
|-----------|-----------|-----|
| **Blockchain** | Cosmos SDK (Go) | Fast, customizable, proven at scale |
| **API Server** | Go + Gin framework | High performance, great concurrency, same language as blockchain |
| **Database** | PostgreSQL 15 | Reliable, JSONB support, familiar |
| **Cache** | Redis 7 | Fast, simple, perfect for sessions and license cache |
| **Queue** | None (MVP - direct processing) | Add later when async needed |
| **Storage** | AWS S3 | Cheap, reliable, 99.99% availability |

### Frontend

| Component | Technology | Why |
|-----------|-----------|-----|
| **PE Portal** | SvelteKit + TypeScript | Fast, small bundle, great DX |
| **Inspector App** | React Native + Expo | Cross-platform (iOS + Android), QR scanning built-in |
| **Styling** | TailwindCSS | Rapid prototyping, consistent design |
| **State Management** | Svelte stores / React Context | Simple, no need for Redux yet |

### Infrastructure

| Component | Technology | Why |
|-----------|-----------|-----|
| **Cloud** | AWS | Familiar, mature, lots of services |
| **IaC** | Terraform | Declarative, versioned infrastructure |
| **Containers** | Docker | Standard, easy deployment |
| **Orchestration** | Docker Compose (MVP) | Simple, good enough for 3 servers |
| **CI/CD** | GitHub Actions | Free, integrated, powerful |
| **Monitoring** | Prometheus + Grafana | Open source, industry standard |
| **Logging** | JSON to CloudWatch | Built-in AWS, cheap |

### Development Tools

| Tool | Purpose |
|------|---------|
| **VS Code** | Primary IDE |
| **Postman** | API testing |
| **TablePlus** | Database GUI |
| **Figma** | Design mockups |
| **Git + GitHub** | Version control |

---

## MVP Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                      MVP DEPLOYMENT                          │
└─────────────────────────────────────────────────────────────┘

                    ┌───────────────┐
                    │   CloudFlare  │
                    │   (DNS + CDN) │
                    └───────┬───────┘
                            │
                ┌───────────┴───────────┐
                │                       │
         ┌──────▼──────┐        ┌──────▼──────┐
         │  Web Portal │        │ Inspector   │
         │  (Vercel)   │        │ Mobile App  │
         └──────┬──────┘        └──────┬──────┘
                │                       │
                └───────────┬───────────┘
                            │
                    ┌───────▼───────┐
                    │   API Server  │
                    │   (Go + Gin)  │
                    │   EC2 t3.med  │
                    └───────┬───────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
  ┌──────▼──────┐    ┌──────▼──────┐   ┌──────▼──────┐
  │ Blockchain  │    │ PostgreSQL  │   │   Redis     │
  │ 3 Validators│    │   (RDS)     │   │ (ElastiCache│
  │ t3.medium   │    │ db.t3.med   │   │  or EC2)    │
  └─────────────┘    └─────────────┘   └─────────────┘
                            │
                     ┌──────▼──────┐
                     │     S3      │
                     │ (Documents) │
                     └─────────────┘
```

**Why This Simple?**
- Single API server (scale later)
- 3 blockchain validators (you run all 3 initially)
- No load balancer yet (not needed <1000 users)
- No CDN for API (CloudFlare for static assets only)
- Direct database connection (no read replicas yet)

**When to Scale:**
- 1,000+ active users → Add load balancer, scale API servers
- 10,000+ stamps → Add read replicas for database
- Multi-state → Add validators in each region

---

## Phase 1: Blockchain Foundation (Weeks 1-3)

### Week 1: Cosmos SDK Setup

**Goals:**
- Install Cosmos SDK
- Create custom blockchain "stampledger-chain"
- Run local testnet (3 validators on your laptop)
- Understand basic concepts

**Tasks:**

#### Day 1-2: Environment Setup

```bash
# Install Go 1.21+
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
source ~/.bashrc

# Verify
go version  # Should show go1.21.6

# Install Ignite CLI (scaffolds Cosmos SDK chains)
curl https://get.ignite.com/cli! | bash

# Verify
ignite version  # Should show v0.27+
```

#### Day 3-4: Create Blockchain

```bash
# Create new chain
mkdir -p ~/projects/stampledger
cd ~/projects/stampledger
ignite scaffold chain stampledger-chain --address-prefix stamp

# This creates:
# - Complete Cosmos SDK chain
# - Tendermint consensus
# - Basic modules
# - CLI tools
# - API server

# Project structure:
stampledger-chain/
├── app/              # Application logic
├── cmd/              # CLI commands
├── proto/            # Protobuf definitions
├── x/                # Custom modules (we'll add stamp module here)
├── testutil/         # Testing utilities
├── config.yml        # Ignite config
└── go.mod            # Go dependencies
```

#### Day 5-7: Test Local Network

```bash
# Start chain locally (single validator)
cd stampledger-chain
ignite chain serve

# This starts:
# - Blockchain node
# - API server (http://localhost:1317)
# - RPC server (http://localhost:26657)
# - Creates test accounts with tokens

# In another terminal, interact with chain
stampledger-chaind status

# Create test account
stampledger-chaind keys add alice
stampledger-chaind keys add bob

# Check balance
stampledger-chaind query bank balances $(stampledger-chaind keys show alice -a)

# Send tokens (test transaction)
stampledger-chaind tx bank send alice $(stampledger-chaind keys show bob -a) 1000stake --yes

# Query transaction
stampledger-chaind query tx <TX_HASH>
```

**Deliverable:** Working local blockchain that you can send transactions to

---

### Week 2: Stamp Module

**Goals:**
- Create custom "stamp" module
- Implement CreateStamp transaction
- Implement QueryStamp query
- Store stamps on-chain

**Tasks:**

#### Day 8-9: Scaffold Stamp Module

```bash
cd stampledger-chain

# Create stamp module
ignite scaffold module stamp

# This creates:
# - x/stamp/ directory
# - Basic module structure
# - Registration in app/app.go

# Now add stamp message type
ignite scaffold message create-stamp \
  documentHash \
  pePublicKey \
  signature \
  jurisdictionId \
  --module stamp

# This generates:
# - Proto definitions
# - Message handlers
# - CLI commands
# - REST endpoints
```

#### Day 10-12: Implement Stamp Logic

Edit `x/stamp/keeper/msg_server_create_stamp.go`:

```go
package keeper

import (
    "context"
    "crypto/sha256"
    "encoding/hex"
    "fmt"

    sdk "github.com/cosmos/cosmos-sdk/types"
    "stampledger-chain/x/stamp/types"
)

func (k msgServer) CreateStamp(
    goCtx context.Context,
    msg *types.MsgCreateStamp,
) (*types.MsgCreateStampResponse, error) {
    ctx := sdk.UnwrapSDKContext(goCtx)

    // Generate stamp ID (hash of document + PE key)
    stampID := generateStampID(msg.DocumentHash, msg.PePublicKey)

    // Check if stamp already exists
    _, found := k.GetStamp(ctx, stampID)
    if found {
        return nil, fmt.Errorf("stamp already exists: %s", stampID)
    }

    // Verify signature (simplified for MVP)
    if !verifySignature(msg.DocumentHash, msg.Signature, msg.PePublicKey) {
        return nil, fmt.Errorf("invalid signature")
    }

    // Create stamp
    stamp := types.Stamp{
        Id:             stampID,
        DocumentHash:   msg.DocumentHash,
        PePublicKey:    msg.PePublicKey,
        Signature:      msg.Signature,
        JurisdictionId: msg.JurisdictionId,
        Timestamp:      ctx.BlockTime().Unix(),
        Creator:        msg.Creator,
        Revoked:        false,
    }

    // Store stamp
    k.SetStamp(ctx, stamp)

    // Emit event
    ctx.EventManager().EmitEvent(
        sdk.NewEvent(
            "stamp_created",
            sdk.NewAttribute("stamp_id", stampID),
            sdk.NewAttribute("creator", msg.Creator),
        ),
    )

    return &types.MsgCreateStampResponse{
        StampId: stampID,
    }, nil
}

func generateStampID(docHash, pubKey string) string {
    data := docHash + pubKey
    hash := sha256.Sum256([]byte(data))
    return hex.EncodeToString(hash[:])
}

func verifySignature(docHash, signature, pubKey string) bool {
    // TODO: Implement actual signature verification
    // For MVP, just check signature is not empty
    return len(signature) > 0
}
```

#### Define Stamp Storage

Edit `x/stamp/types/stamp.proto`:

```protobuf
syntax = "proto3";
package stampledgerchain.stamp;

option go_package = "stampledger-chain/x/stamp/types";

message Stamp {
  string id = 1;
  string document_hash = 2;
  string pe_public_key = 3;
  string signature = 4;
  string jurisdiction_id = 5;
  int64 timestamp = 6;
  string creator = 7;
  bool revoked = 8;
  int64 revoked_at = 9;
  string revoked_reason = 10;
}
```

#### Add Query Handler

Edit `x/stamp/keeper/grpc_query_stamp.go`:

```go
package keeper

import (
    "context"

    sdk "github.com/cosmos/cosmos-sdk/types"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    "stampledger-chain/x/stamp/types"
)

func (k Keeper) Stamp(
    goCtx context.Context,
    req *types.QueryStampRequest,
) (*types.QueryStampResponse, error) {
    if req == nil {
        return nil, status.Error(codes.InvalidArgument, "invalid request")
    }

    ctx := sdk.UnwrapSDKContext(goCtx)
    stamp, found := k.GetStamp(ctx, req.Id)
    if !found {
        return nil, status.Error(codes.NotFound, "stamp not found")
    }

    return &types.QueryStampResponse{Stamp: stamp}, nil
}
```

#### Test Stamp Module

```bash
# Rebuild chain
ignite chain serve

# Create stamp (different terminal)
stampledger-chaind tx stamp create-stamp \
  "sha256:abc123..." \
  "0x1a2b3c..." \
  "0xsignature..." \
  "appleton" \
  --from alice \
  --yes

# Query stamp
stampledger-chaind query stamp show <STAMP_ID>

# Should return stamp details
```

**Deliverable:** Working stamp module that creates and queries stamps

---

### Week 3: Multi-Validator Setup

**Goals:**
- Run 3 validators (simulate network)
- Understand consensus
- Deploy to AWS (testnet)

**Tasks:**

#### Day 13-14: Local Multi-Validator

```bash
# Stop single validator
# Edit config.yml to add 3 validators

# Create 3-validator testnet
ignite chain init

# Start validator 1
stampledger-chaind start --home ~/.stampledger-chain/validator1

# Start validator 2 (new terminal)
stampledger-chaind start --home ~/.stampledger-chain/validator2

# Start validator 3 (new terminal)
stampledger-chaind start --home ~/.stampledger-chain/validator3

# Test: Send transaction, verify all 3 validators see it
```

#### Day 15-17: AWS Deployment

**Launch 3 EC2 instances:**

```bash
# Terraform config
# infrastructure/terraform/validators.tf

resource "aws_instance" "validator" {
  count         = 3
  ami           = "ami-0c55b159cbfafe1f0" # Ubuntu 22.04
  instance_type = "t3.medium"
  
  vpc_security_group_ids = [aws_security_group.validator.id]
  subnet_id              = aws_subnet.public[count.index].id
  
  user_data = file("validator-init.sh")
  
  tags = {
    Name = "stampledger-validator-${count.index}"
  }
}

resource "aws_security_group" "validator" {
  name = "stampledger-validator-sg"
  
  # P2P port
  ingress {
    from_port   = 26656
    to_port     = 26656
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # RPC port (internal only)
  ingress {
    from_port   = 26657
    to_port     = 26657
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
  
  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["YOUR_IP/32"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

**validator-init.sh:**

```bash
#!/bin/bash
# Install Go
wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile

# Install stampledger-chaind
git clone https://github.com/your-org/stampledger-chain.git
cd stampledger-chain
make install

# Initialize validator
stampledger-chaind init validator-node --chain-id stampledger-1

# Copy genesis.json (from your repo or S3)
aws s3 cp s3://stampledger-config/genesis.json ~/.stampledger-chain/config/

# Start as systemd service
cat > /etc/systemd/system/stampledger.service << EOF
[Unit]
Description=StampLedger Validator
After=network.target

[Service]
User=ubuntu
ExecStart=/usr/local/bin/stampledger-chaind start
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl enable stampledger
systemctl start stampledger
```

**Deploy:**

```bash
cd infrastructure/terraform
terraform init
terraform apply

# Wait 5 minutes for validators to start

# Check they're synced
ssh ubuntu@<VALIDATOR_IP>
stampledger-chaind status
```

**Deliverable:** 3-validator testnet running on AWS

---

## Phase 2: API Server (Weeks 4-5)

### Week 4: Core API

**Goals:**
- Go API server with Gin
- Authentication (JWT)
- Database connection
- Basic CRUD for stamps

**Tasks:**

#### Day 18-19: Project Setup

```bash
mkdir -p ~/projects/stampledger-api
cd ~/projects/stampledger-api

# Initialize Go module
go mod init github.com/your-org/stampledger-api

# Install dependencies
go get github.com/gin-gonic/gin
go get github.com/lib/pq                  # PostgreSQL
go get github.com/golang-jwt/jwt/v5       # JWT
go get github.com/joho/godotenv           # Environment variables
go get golang.org/x/crypto/bcrypt         # Password hashing

# Project structure
mkdir -p {cmd/api,internal/{auth,database,handlers,middleware,models},pkg/blockchain}

# Directory tree:
stampledger-api/
├── cmd/
│   └── api/
│       └── main.go           # Entry point
├── internal/
│   ├── auth/                 # JWT logic
│   ├── database/             # DB connection
│   ├── handlers/             # HTTP handlers
│   ├── middleware/           # Auth middleware
│   └── models/               # Data models
├── pkg/
│   └── blockchain/           # Blockchain client
├── .env                      # Environment variables
├── go.mod
└── go.sum
```

#### Day 20: Database Setup

**Create database schema:**

```sql
-- Run this on your RDS instance
CREATE DATABASE stampledger;

\c stampledger

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'pe',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PE Licenses
CREATE TABLE pe_licenses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    license_number VARCHAR(50) NOT NULL,
    state VARCHAR(2) NOT NULL,
    pe_name VARCHAR(255) NOT NULL,
    license_status VARCHAR(50) DEFAULT 'active',
    disciplines TEXT[],
    UNIQUE(license_number, state)
);

-- Jurisdictions
CREATE TABLE jurisdictions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(2) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE
);

-- Stamps (off-chain metadata)
CREATE TABLE stamps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blockchain_id VARCHAR(66) NOT NULL UNIQUE,
    tx_hash VARCHAR(66),
    document_hash VARCHAR(64) NOT NULL,
    document_url TEXT,
    stamped_document_url TEXT,
    pe_license_id INTEGER REFERENCES pe_licenses(id),
    jurisdiction_id INTEGER REFERENCES jurisdictions(id),
    project_name VARCHAR(255),
    project_address TEXT,
    permit_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_stamps_blockchain ON stamps(blockchain_id);
CREATE INDEX idx_stamps_pe ON stamps(pe_license_id);
CREATE INDEX idx_stamps_jurisdiction ON stamps(jurisdiction_id);
```

#### Day 21: Database Connection

**internal/database/database.go:**

```go
package database

import (
    "database/sql"
    "fmt"
    "log"
    "os"

    _ "github.com/lib/pq"
)

var DB *sql.DB

func Connect() error {
    connStr := fmt.Sprintf(
        "host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
        os.Getenv("DB_HOST"),
        os.Getenv("DB_PORT"),
        os.Getenv("DB_USER"),
        os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_NAME"),
    )

    var err error
    DB, err = sql.Open("postgres", connStr)
    if err != nil {
        return err
    }

    // Test connection
    if err = DB.Ping(); err != nil {
        return err
    }

    log.Println("Database connected successfully")
    return nil
}

func Close() {
    if DB != nil {
        DB.Close()
    }
}
```

#### Day 22-24: API Handlers

**cmd/api/main.go:**

```go
package main

import (
    "log"
    "os"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "github.com/your-org/stampledger-api/internal/database"
    "github.com/your-org/stampledger-api/internal/handlers"
    "github.com/your-org/stampledger-api/internal/middleware"
)

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }

    // Connect to database
    if err := database.Connect(); err != nil {
        log.Fatal("Database connection failed:", err)
    }
    defer database.Close()

    // Create router
    r := gin.Default()

    // CORS middleware
    r.Use(middleware.CORS())

    // Public routes
    public := r.Group("/api/v1")
    {
        public.POST("/auth/register", handlers.Register)
        public.POST("/auth/login", handlers.Login)
        public.GET("/verify/:stamp_id", handlers.VerifyStamp)
    }

    // Protected routes
    protected := r.Group("/api/v1")
    protected.Use(middleware.AuthRequired())
    {
        protected.POST("/stamps", handlers.CreateStamp)
        protected.GET("/stamps", handlers.ListStamps)
        protected.GET("/stamps/:id", handlers.GetStamp)
        protected.POST("/stamps/:id/revoke", handlers.RevokeStamp)
    }

    // Start server
    port := os.Getenv("PORT")
    if port == "" {
        port = "8000"
    }

    log.Printf("Starting server on port %s", port)
    r.Run(":" + port)
}
```

**internal/handlers/auth.go:**

```go
package handlers

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
    "github.com/your-org/stampledger-api/internal/database"
    "github.com/your-org/stampledger-api/internal/models"
    "golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte("your-secret-key") // TODO: Move to env

func Register(c *gin.Context) {
    var input struct {
        Email    string `json:"email" binding:"required,email"`
        Password string `json:"password" binding:"required,min=8"`
        Name     string `json:"name" binding:"required"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Hash password
    hashedPassword, err := bcrypt.GenerateFromPassword(
        []byte(input.Password), 
        bcrypt.DefaultCost,
    )
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
        return
    }

    // Insert user
    var userID string
    err = database.DB.QueryRow(
        `INSERT INTO users (email, password_hash, name, role)
         VALUES ($1, $2, $3, 'pe')
         RETURNING id`,
        input.Email, string(hashedPassword), input.Name,
    ).Scan(&userID)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "user_id": userID,
        "message": "User created successfully",
    })
}

func Login(c *gin.Context) {
    var input struct {
        Email    string `json:"email" binding:"required"`
        Password string `json:"password" binding:"required"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Get user from database
    var user models.User
    err := database.DB.QueryRow(
        `SELECT id, email, password_hash, name, role FROM users WHERE email = $1`,
        input.Email,
    ).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role)

    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }

    // Verify password
    err = bcrypt.CompareHashAndPassword(
        []byte(user.PasswordHash), 
        []byte(input.Password),
    )
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }

    // Generate JWT
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id": user.ID,
        "email":   user.Email,
        "role":    user.Role,
        "exp":     time.Now().Add(time.Hour * 24).Unix(),
    })

    tokenString, err := token.SignedString(jwtSecret)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "token": tokenString,
        "user": gin.H{
            "id":    user.ID,
            "email": user.Email,
            "name":  user.Name,
            "role":  user.Role,
        },
    })
}
```

**internal/middleware/auth.go:**

```go
package middleware

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-secret-key") // Same as in handlers

func AuthRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get token from header
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "No authorization header"})
            c.Abort()
            return
        }

        // Extract token
        tokenString := strings.Replace(authHeader, "Bearer ", "", 1)

        // Parse token
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            return jwtSecret, nil
        })

        if err != nil || !token.Valid {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }

        // Set user info in context
        if claims, ok := token.Claims.(jwt.MapClaims); ok {
            c.Set("user_id", claims["user_id"])
            c.Set("user_email", claims["email"])
            c.Set("user_role", claims["role"])
        }

        c.Next()
    }
}
```

**Deliverable:** API server with auth working, can register/login

---

### Week 5: Stamp Endpoints

**Goals:**
- Create stamp (upload document, call blockchain, save to DB)
- Verify stamp (query blockchain, return details)
- List stamps (paginated)

**Tasks:**

#### Day 25-28: Stamp Handlers

**internal/handlers/stamps.go:**

```go
package handlers

import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "io"
    "net/http"
    "os"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/your-org/stampledger-api/internal/database"
    "github.com/your-org/stampledger-api/pkg/blockchain"
)

func CreateStamp(c *gin.Context) {
    // Get user from context
    userID := c.GetString("user_id")

    // Parse multipart form
    form, err := c.MultipartForm()
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
        return
    }

    // Get uploaded file
    files := form.File["document"]
    if len(files) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "No document uploaded"})
        return
    }

    file := files[0]

    // Open file
    src, err := file.Open()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open file"})
        return
    }
    defer src.Close()

    // Calculate hash
    hash := sha256.New()
    if _, err := io.Copy(hash, src); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash file"})
        return
    }
    documentHash := "sha256:" + hex.EncodeToString(hash.Sum(nil))

    // Reset file pointer
    src.Seek(0, 0)

    // Upload to S3
    s3Key := fmt.Sprintf("originals/%s/%s", uuid.New().String(), file.Filename)
    documentURL, err := uploadToS3(src, s3Key)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file"})
        return
    }

    // Get project details from form
    projectName := form.Value["project_name"][0]
    projectAddress := form.Value["project_address"][0]
    jurisdictionID := form.Value["jurisdiction_id"][0]

    // TODO: Get PE license, signature from form
    // For MVP, we'll simplify this

    // Create stamp on blockchain
    blockchainID, txHash, err := blockchain.CreateStamp(
        documentHash,
        "pe-public-key", // TODO: Get from PE
        "signature",     // TODO: Actual signature
        jurisdictionID,
    )
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create stamp on blockchain"})
        return
    }

    // Save to database
    var stampID string
    err = database.DB.QueryRow(
        `INSERT INTO stamps (
            blockchain_id, tx_hash, document_hash, document_url,
            project_name, project_address, jurisdiction_id, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        blockchainID, txHash, documentHash, documentURL,
        projectName, projectAddress, jurisdictionID, userID,
    ).Scan(&stampID)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save stamp"})
        return
    }

    // TODO: Generate QR code and stamped PDF

    c.JSON(http.StatusCreated, gin.H{
        "stamp_id":      stampID,
        "blockchain_id": blockchainID,
        "tx_hash":       txHash,
        "document_hash": documentHash,
    })
}

func VerifyStamp(c *gin.Context) {
    stampID := c.Param("stamp_id")

    // Query database
    var stamp struct {
        BlockchainID   string
        DocumentHash   string
        ProjectName    string
        ProjectAddress string
        Status         string
        CreatedAt      string
    }

    err := database.DB.QueryRow(
        `SELECT blockchain_id, document_hash, project_name, project_address, status, created_at
         FROM stamps WHERE id = $1`,
        stampID,
    ).Scan(
        &stamp.BlockchainID,
        &stamp.DocumentHash,
        &stamp.ProjectName,
        &stamp.ProjectAddress,
        &stamp.Status,
        &stamp.CreatedAt,
    )

    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Stamp not found"})
        return
    }

    // Verify on blockchain
    blockchainStamp, err := blockchain.QueryStamp(stamp.BlockchainID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify on blockchain"})
        return
    }

    // Compare hashes
    if blockchainStamp.DocumentHash != stamp.DocumentHash {
        c.JSON(http.StatusOK, gin.H{
            "status":  "invalid",
            "message": "Document hash mismatch",
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "status":          "valid",
        "stamp_id":        stampID,
        "blockchain_id":   stamp.BlockchainID,
        "document_hash":   stamp.DocumentHash,
        "project_name":    stamp.ProjectName,
        "project_address": stamp.ProjectAddress,
        "stamped_at":      stamp.CreatedAt,
        "blockchain_verified": true,
    })
}

func ListStamps(c *gin.Context) {
    userID := c.GetString("user_id")

    rows, err := database.DB.Query(
        `SELECT id, blockchain_id, project_name, project_address, status, created_at
         FROM stamps WHERE created_by = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        userID,
    )
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query stamps"})
        return
    }
    defer rows.Close()

    var stamps []gin.H
    for rows.Next() {
        var stamp struct {
            ID             string
            BlockchainID   string
            ProjectName    string
            ProjectAddress string
            Status         string
            CreatedAt      string
        }

        rows.Scan(
            &stamp.ID,
            &stamp.BlockchainID,
            &stamp.ProjectName,
            &stamp.ProjectAddress,
            &stamp.Status,
            &stamp.CreatedAt,
        )

        stamps = append(stamps, gin.H{
            "id":              stamp.ID,
            "blockchain_id":   stamp.BlockchainID,
            "project_name":    stamp.ProjectName,
            "project_address": stamp.ProjectAddress,
            "status":          stamp.Status,
            "created_at":      stamp.CreatedAt,
        })
    }

    c.JSON(http.StatusOK, gin.H{
        "stamps": stamps,
        "count":  len(stamps),
    })
}

func uploadToS3(file io.Reader, key string) (string, error) {
    // TODO: Implement S3 upload
    // For MVP, could just save to local disk
    return "https://s3.amazonaws.com/stampledger/" + key, nil
}
```

**pkg/blockchain/client.go:**

```go
package blockchain

import (
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "strings"
)

var rpcURL = os.Getenv("BLOCKCHAIN_RPC_URL") // http://validator-ip:26657

type Stamp struct {
    ID             string `json:"id"`
    DocumentHash   string `json:"document_hash"`
    PEPublicKey    string `json:"pe_public_key"`
    Signature      string `json:"signature"`
    JurisdictionID string `json:"jurisdiction_id"`
    Timestamp      int64  `json:"timestamp"`
    Revoked        bool   `json:"revoked"`
}

func CreateStamp(
    documentHash, pePublicKey, signature, jurisdictionID string,
) (string, string, error) {
    // Build transaction
    tx := map[string]interface{}{
        "type": "cosmos-sdk/StdTx",
        "value": map[string]interface{}{
            "msg": []map[string]interface{}{
                {
                    "type": "stamp/MsgCreateStamp",
                    "value": map[string]interface{}{
                        "document_hash":    documentHash,
                        "pe_public_key":    pePublicKey,
                        "signature":        signature,
                        "jurisdiction_id":  jurisdictionID,
                        "creator":          "stamp1...", // TODO: Get from PE account
                    },
                },
            },
        },
    }

    // Send to blockchain
    txBytes, _ := json.Marshal(tx)
    resp, err := http.Post(
        rpcURL+"/txs",
        "application/json",
        strings.NewReader(string(txBytes)),
    )
    if err != nil {
        return "", "", err
    }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)

    var result struct {
        TxHash string `json:"txhash"`
        Height string `json:"height"`
    }
    json.Unmarshal(body, &result)

    // Extract stamp ID from transaction result
    stampID := "generated-stamp-id" // TODO: Parse from tx result

    return stampID, result.TxHash, nil
}

func QueryStamp(stampID string) (*Stamp, error) {
    resp, err := http.Get(fmt.Sprintf(
        "%s/stamp/stamp/%s",
        rpcURL, stampID,
    ))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result struct {
        Stamp Stamp `json:"stamp"`
    }

    body, _ := io.ReadAll(resp.Body)
    json.Unmarshal(body, &result)

    return &result.Stamp, nil
}
```

**Deliverable:** API can create stamps (upload doc, store on blockchain, save to DB) and verify them

---

## Phase 3: Frontend (Weeks 6-8)

### Week 6: PE Portal (Web)

**Goals:**
- SvelteKit app
- Login/Register pages
- Create stamp flow
- View stamp history

**Tasks:**

#### Day 29-30: SvelteKit Setup

```bash
# Create SvelteKit project
npm create svelte@latest stampledger-portal
cd stampledger-portal

# Install dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npm install @sveltejs/adapter-vercel

# Initialize Tailwind
npx tailwindcss init -p

# Install additional packages
npm install axios
npm install qrcode
```

**Project structure:**

```
stampledger-portal/
├── src/
│   ├── routes/
│   │   ├── +page.svelte              # Landing page
│   │   ├── login/+page.svelte        # Login
│   │   ├── register/+page.svelte     # Register
│   │   ├── dashboard/
│   │   │   ├── +page.svelte          # Dashboard
│   │   │   └── stamps/
│   │   │       ├── +page.svelte      # List stamps
│   │   │       ├── new/+page.svelte  # Create stamp
│   │   │       └── [id]/+page.svelte # View stamp
│   ├── lib/
│   │   ├── api.ts                    # API client
│   │   └── stores.ts                 # Global state
│   └── app.css                       # Tailwind imports
├── static/                           # Static assets
└── svelte.config.js
```

#### Day 31-33: Core Pages

**src/routes/+page.svelte (Landing):**

```svelte
<script>
  import { goto } from '$app/navigation';
</script>

<div class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
  <nav class="container mx-auto px-4 py-6 flex justify-between items-center">
    <h1 class="text-2xl font-bold text-blue-900">StampLedger</h1>
    <div class="space-x-4">
      <a href="/login" class="text-blue-900 hover:text-blue-700">Login</a>
      <a href="/register" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Get Started
      </a>
    </div>
  </nav>

  <main class="container mx-auto px-4 py-20 text-center">
    <h2 class="text-5xl font-bold text-gray-900 mb-6">
      Verifiable Professional Credentials
    </h2>
    <p class="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
      Instantly verify professional engineer stamps. Prevent fraud. Save time.
      Blockchain-secured.
    </p>
    <div class="flex justify-center gap-4">
      <button 
        on:click={() => goto('/register')}
        class="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg hover:bg-blue-700"
      >
        Create Free Account
      </button>
      <button 
        class="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg hover:bg-blue-50"
      >
        Watch Demo
      </button>
    </div>

    <div class="mt-20 grid grid-cols-3 gap-8 max-w-4xl mx-auto">
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="text-4xl mb-4">🔒</div>
        <h3 class="font-bold mb-2">Unforgeable</h3>
        <p class="text-gray-600">Blockchain-verified stamps can't be faked</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="text-4xl mb-4">⚡</div>
        <h3 class="font-bold mb-2">Instant Verification</h3>
        <p class="text-gray-600">QR code scan verifies in 2 seconds</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="text-4xl mb-4">📜</div>
        <h3 class="font-bold mb-2">Audit Trail</h3>
        <p class="text-gray-600">Permanent record for insurance and courts</p>
      </div>
    </div>
  </main>
</div>
```

**src/routes/login/+page.svelte:**

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';
  import { token, user } from '$lib/stores';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleLogin() {
    loading = true;
    error = '';

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      // Save token and user
      $token = response.data.token;
      $user = response.data.user;

      // Redirect to dashboard
      goto('/dashboard');
    } catch (err) {
      error = 'Invalid email or password';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center">
  <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
    <h1 class="text-3xl font-bold text-center mb-8">Login to StampLedger</h1>

    {#if error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={handleLogin}>
      <div class="mb-4">
        <label class="block text-gray-700 mb-2">Email</label>
        <input
          type="email"
          bind:value={email}
          class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div class="mb-6">
        <label class="block text-gray-700 mb-2">Password</label>
        <input
          type="password"
          bind:value={password}
          class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        class="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>

    <p class="text-center mt-4 text-gray-600">
      Don't have an account? 
      <a href="/register" class="text-blue-600 hover:underline">Register</a>
    </p>
  </div>
</div>
```

**src/routes/dashboard/stamps/new/+page.svelte (Create Stamp):**

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';

  let file: File | null = null;
  let projectName = '';
  let projectAddress = '';
  let permitNumber = '';
  let jurisdictionId = '1'; // Default
  let loading = false;
  let error = '';

  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      file = target.files[0];
    }
  }

  async function handleSubmit() {
    if (!file) {
      error = 'Please select a document';
      return;
    }

    loading = true;
    error = '';

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('project_name', projectName);
      formData.append('project_address', projectAddress);
      formData.append('permit_number', permitNumber);
      formData.append('jurisdiction_id', jurisdictionId);

      const response = await api.post('/stamps', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Redirect to stamp detail
      goto(`/dashboard/stamps/${response.data.stamp_id}`);
    } catch (err) {
      error = 'Failed to create stamp. Please try again.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-2xl mx-auto py-8">
  <h1 class="text-3xl font-bold mb-8">Create New Stamp</h1>

  {#if error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}

  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <div>
      <label class="block text-gray-700 font-bold mb-2">Engineering Drawing</label>
      <input
        type="file"
        on:change={handleFileChange}
        accept=".pdf,.dwg"
        class="w-full px-4 py-2 border rounded"
        required
      />
      <p class="text-sm text-gray-500 mt-1">PDF or DWG format, max 50MB</p>
    </div>

    <div>
      <label class="block text-gray-700 font-bold mb-2">Project Name</label>
      <input
        type="text"
        bind:value={projectName}
        class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Smith Residence Addition"
        required
      />
    </div>

    <div>
      <label class="block text-gray-700 font-bold mb-2">Project Address</label>
      <input
        type="text"
        bind:value={projectAddress}
        class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="123 Main St, Appleton, WI 54911"
        required
      />
    </div>

    <div>
      <label class="block text-gray-700 font-bold mb-2">Permit Number</label>
      <input
        type="text"
        bind:value={permitNumber}
        class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="E-2026-1234"
      />
    </div>

    <div>
      <label class="block text-gray-700 font-bold mb-2">Jurisdiction</label>
      <select
        bind:value={jurisdictionId}
        class="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="1">City of Appleton</option>
        <option value="2">City of Green Bay</option>
        <option value="3">City of Oshkosh</option>
      </select>
    </div>

    <div class="flex gap-4">
      <button
        type="submit"
        class="flex-1 bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? 'Creating Stamp...' : 'Create Stamp'}
      </button>
      <a
        href="/dashboard/stamps"
        class="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded text-center hover:bg-gray-50"
      >
        Cancel
      </a>
    </div>
  </form>
</div>
```

**src/lib/api.ts:**

```typescript
import axios from 'axios';
import { token } from './stores';
import { get } from 'svelte/store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const authToken = get(token);
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      token.set('');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Deliverable:** Working web portal where PEs can create stamps

---

### Week 7-8: Mobile App (Inspector)

**Goals:**
- React Native app
- QR code scanner
- Stamp verification
- Offline mode (cache recent stamps)

**Tasks:**

#### Day 34-35: React Native Setup

```bash
# Create Expo project
npx create-expo-app stampledger-inspector
cd stampledger-inspector

# Install dependencies
npx expo install expo-camera expo-barcode-scanner
npm install axios
npm install @react-navigation/native @react-navigation/stack
npm install react-native-qrcode-svg
```

#### Day 36-40: Core Screens

**App.tsx:**

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import ScanScreen from './screens/ScanScreen';
import ResultScreen from './screens/ResultScreen';
import HistoryScreen from './screens/HistoryScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Scan" 
          component={ScanScreen}
          options={{ title: 'Scan PE Stamp' }}
        />
        <Stack.Screen 
          name="Result" 
          component={ResultScreen}
          options={{ title: 'Verification Result' }}
        />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ title: 'Scan History' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**screens/ScanScreen.tsx:**

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import axios from 'axios';

const API_URL = 'https://api.stampledger.com/v1';

export default function ScanScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);

    try {
      // Extract stamp ID from QR code URL
      // Format: https://stampledger.com/verify/{stamp_id}
      const stampId = data.split('/').pop();

      // Verify stamp
      const response = await axios.get(`${API_URL}/verify/${stampId}`);

      // Navigate to result screen
      navigation.navigate('Result', { 
        stampData: response.data,
        stampId 
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to verify stamp. Please try again.');
    } finally {
      setLoading(false);
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.overlay}>
        <Text style={styles.instructions}>
          Point camera at QR code on stamped drawing
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Verifying...</Text>
        </View>
      )}

      <View style={styles.bottomBar}>
        <Button 
          title="View History" 
          onPress={() => navigation.navigate('History')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 10,
  },
  instructions: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
});
```

**screens/ResultScreen.tsx:**

```typescript
import React from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

export default function ResultScreen({ route, navigation }) {
  const { stampData, stampId } = route.params;

  const isValid = stampData.status === 'valid';

  return (
    <ScrollView style={styles.container}>
      <View style={[
        styles.statusBanner, 
        isValid ? styles.validBanner : styles.invalidBanner
      ]}>
        <Text style={styles.statusText}>
          {isValid ? '✓ VALID STAMP' : '✗ INVALID STAMP'}
        </Text>
      </View>

      {isValid ? (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PE Information</Text>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{stampData.pe.name}</Text>
            <Text style={styles.label}>License:</Text>
            <Text style={styles.value}>{stampData.pe.license} ({stampData.pe.state})</Text>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{stampData.pe.license_status}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Information</Text>
            <Text style={styles.label}>Project:</Text>
            <Text style={styles.value}>{stampData.project.name}</Text>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{stampData.project.address}</Text>
            <Text style={styles.label}>Permit #:</Text>
            <Text style={styles.value}>{stampData.project.permit_number}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stamp Details</Text>
            <Text style={styles.label}>Stamped:</Text>
            <Text style={styles.value}>{new Date(stampData.stamp_info.stamped_at).toLocaleString()}</Text>
            <Text style={styles.label}>Document Type:</Text>
            <Text style={styles.value}>{stampData.stamp_info.document_type}</Text>
          </View>

          {stampData.verification.insurance_verified && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Insurance</Text>
              <Text style={styles.label}>Carrier:</Text>
              <Text style={styles.value}>{stampData.verification.insurance_carrier}</Text>
              <Text style={styles.label}>Coverage:</Text>
              <Text style={styles.value}>
                ${stampData.verification.insurance_coverage.toLocaleString()}
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.section}>
          <Text style={styles.errorText}>
            {stampData.message || 'This stamp could not be verified.'}
          </Text>
          {stampData.warnings && stampData.warnings.map((warning, i) => (
            <Text key={i} style={styles.warningText}>• {warning}</Text>
          ))}
        </View>
      )}

      <Button 
        title="Scan Another" 
        onPress={() => navigation.goBack()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusBanner: {
    padding: 20,
    alignItems: 'center',
  },
  validBanner: {
    backgroundColor: '#10b981',
  },
  invalidBanner: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    marginTop: 2,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  warningText: {
    fontSize: 14,
    color: '#f59e0b',
    marginTop: 8,
  },
});
```

**Deliverable:** Mobile app that scans QR codes and verifies stamps

---

## Phase 4: QR Codes & PDFs (Week 9)

### Generate QR Code and Stamped PDF

**Tasks:**

#### Day 41-43: QR Code Generation

Add to `internal/handlers/stamps.go`:

```go
import (
    "github.com/skip2/go-qrcode"
)

func generateQRCode(stampID string) (string, error) {
    // QR code contains verification URL
    verificationURL := fmt.Sprintf("https://stampledger.com/verify/%s", stampID)

    // Generate QR code
    qr, err := qrcode.New(verificationURL, qrcode.Medium)
    if err != nil {
        return "", err
    }

    // Save to S3
    qrBytes, err := qr.PNG(256)
    if err != nil {
        return "", err
    }

    s3Key := fmt.Sprintf("qr-codes/%s.png", stampID)
    qrURL, err := uploadBytesToS3(qrBytes, s3Key)
    if err != nil {
        return "", err
    }

    return qrURL, nil
}
```

#### Day 44-45: PDF Stamping

```go
import (
    "github.com/pdfcpu/pdfcpu/pkg/api"
    "github.com/pdfcpu/pdfcpu/pkg/pdfcpu"
)

func stampPDF(originalPDFPath, qrCodePath, outputPath string) error {
    // Load original PDF
    // Add QR code as watermark in bottom-right corner
    // Add text: "Verified by StampLedger"
    // Save stamped PDF

    watermark := &pdfcpu.Watermark{
        Image: qrCodePath,
        Pos:   pdfcpu.BottomRight,
        Scale: 0.3,
    }

    err := api.AddWatermarksFile(originalPDFPath, outputPath, nil, watermark, nil)
    return err
}
```

**Deliverable:** System generates QR code, overlays on PDF, returns stamped PDF to PE

---

## Phase 5: Payment & Deploy (Week 10-12)

### Week 10: Stripe Integration

**Goals:**
- PE subscriptions (Free, Pro $99/mo, Firm $499/mo)
- Payment processing
- Usage tracking

**Tasks:**

#### Day 46-48: Stripe Setup

```bash
# Install Stripe
go get github.com/stripe/stripe-go/v76
```

**internal/handlers/billing.go:**

```go
package handlers

import (
    "net/http"
    "os"

    "github.com/gin-gonic/gin"
    "github.com/stripe/stripe-go/v76"
    "github.com/stripe/stripe-go/v76/customer"
    "github.com/stripe/stripe-go/v76/subscription"
)

func init() {
    stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
}

func CreateSubscription(c *gin.Context) {
    userID := c.GetString("user_id")
    userEmail := c.GetString("user_email")

    var input struct {
        Plan        string `json:"plan"` // "pro" or "firm"
        PaymentMethod string `json:"payment_method"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // Create Stripe customer
    customerParams := &stripe.CustomerParams{
        Email: stripe.String(userEmail),
        PaymentMethod: stripe.String(input.PaymentMethod),
        InvoiceSettings: &stripe.CustomerInvoiceSettingsParams{
            DefaultPaymentMethod: stripe.String(input.PaymentMethod),
        },
    }
    stripeCustomer, err := customer.New(customerParams)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create customer"})
        return
    }

    // Create subscription
    var priceID string
    if input.Plan == "pro" {
        priceID = os.Getenv("STRIPE_PRO_PRICE_ID")
    } else {
        priceID = os.Getenv("STRIPE_FIRM_PRICE_ID")
    }

    subscriptionParams := &stripe.SubscriptionParams{
        Customer: stripe.String(stripeCustomer.ID),
        Items: []*stripe.SubscriptionItemsParams{
            {
                Price: stripe.String(priceID),
            },
        },
    }
    stripeSub, err := subscription.New(subscriptionParams)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create subscription"})
        return
    }

    // Save to database
    _, err = database.DB.Exec(
        `INSERT INTO subscriptions (user_id, plan, status, stripe_customer_id, stripe_subscription_id)
         VALUES ($1, $2, 'active', $3, $4)`,
        userID, input.Plan, stripeCustomer.ID, stripeSub.ID,
    )
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save subscription"})
        return
    }

    c.JSON(http.StatusCreated, gin.H{
        "subscription_id": stripeSub.ID,
        "status": stripeSub.Status,
    })
}
```

**Deliverable:** Stripe integration working, can subscribe to paid plans

---

### Week 11: Production Deploy

**Goals:**
- Deploy to AWS
- SSL certificates
- Monitoring

**Tasks:**

#### Day 49-52: Deploy Everything

**Deploy Blockchain:**
```bash
# Already done in Week 3
# Ensure 3 validators are running
```

**Deploy API:**
```bash
# Build Docker image
docker build -t stampledger-api .

# Push to ECR
aws ecr create-repository --repository-name stampledger-api
docker tag stampledger-api:latest <ECR_URL>
docker push <ECR_URL>

# Deploy to ECS or EC2
# (Use Terraform from Week 3)
```

**Deploy Frontend:**
```bash
# PE Portal
cd stampledger-portal
npm run build
vercel --prod

# Point stampledger.com to Vercel
```

**Mobile App:**
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store / Play Store
```

#### Day 53-55: SSL & Monitoring

**SSL:**
- CloudFlare handles SSL for domain
- API: Use AWS Certificate Manager
- Load balancer terminates SSL

**Monitoring:**
```bash
# Install Prometheus + Grafana on monitoring server
# Scrape metrics from API servers and validators
# Create dashboards for:
# - API request rate
# - Database connections
# - Blockchain block height
# - Error rates
```

**Deliverable:** Fully deployed production system

---

### Week 12: Testing & Polish

**Goals:**
- End-to-end testing
- Bug fixes
- Performance optimization
- Documentation

**Tasks:**

#### Day 56-60: Testing

**Test scenarios:**
1. Register user → Create stamp → Verify stamp
2. Mobile app scan → Verify valid stamp
3. Mobile app scan → Detect invalid stamp
4. Payment flow → Subscribe to Pro plan
5. Load test → 100 stamps created simultaneously

**Performance testing:**
```bash
# Use k6 for load testing
k6 run load-test.js

# Target: 100 req/s for 5 minutes
# Success if: <2% error rate, p95 latency <500ms
```

**Bug fixes:**
- Fix any issues found during testing
- Improve error messages
- Add loading states

**Documentation:**
- API documentation (OpenAPI spec)
- User guide (how to create stamp, verify stamp)
- Admin guide (how to add municipality)

**Deliverable:** Polished, tested MVP ready for pilot

---

## Success Criteria

### Technical

- [ ] Stamp creation works end-to-end (upload → blockchain → PDF)
- [ ] Verification works (QR scan → display result in <2 seconds)
- [ ] Payment works (Stripe subscription)
- [ ] No critical bugs
- [ ] 99% uptime during pilot
- [ ] p95 latency <500ms

### Business

- [ ] 3 municipalities signed up (pilot agreements)
- [ ] 20 PEs registered and creating stamps
- [ ] 100 stamps created
- [ ] 500 verifications performed
- [ ] NPS >40

### Learning

- [ ] Validated: Municipalities want this
- [ ] Validated: PEs will use it
- [ ] Validated: Works in real permit workflow
- [ ] Identified: Top 3 pain points to fix
- [ ] Decided: Should we continue? (YES!)

---

## Cost Summary

**Total MVP Development Cost:**

**Infrastructure (4 months):**
- $520/mo × 4 = $2,080

**Your Time:**
- 4 months × 160 hours = 640 hours
- @ $0/hour (you're building it) = $0

**Optional Contractors:**
- None needed (you can build it all)

**One-Time:**
- Domain: $12
- Logo: $500 (Fiverr)
- Legal (LLC): $2,000

**Total: $4,592**

**Break-even:** Month 10 with 30 PEs or 2 municipalities

---

## Timeline Summary

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Cosmos SDK Setup | Local blockchain running |
| 2 | Stamp Module | Can create and query stamps on-chain |
| 3 | Multi-Validator | 3 validators running on AWS |
| 4 | API Core | Auth + database working |
| 5 | Stamp API | Create/verify stamps via API |
| 6 | PE Portal | Web app for PEs |
| 7-8 | Mobile App | Inspector app with QR scanner |
| 9 | QR & PDF | Generate QR codes, stamped PDFs |
| 10 | Payments | Stripe integration |
| 11 | Deploy | Production deployment |
| 12 | Polish | Testing, bug fixes |

**Total: 12 weeks (3 months)**

**Buffer: +1 month for unknowns = 4 months total**

---

## Next Steps

**This week:**
1. Set up development environment (Go, Cosmos SDK)
2. Create local blockchain
3. Test basic transactions

**Next week:**
1. Build stamp module
2. Implement create/query stamps
3. Test on local network

**Week 3:**
1. Deploy to AWS
2. Run multi-validator network
3. Verify consensus works

Then continue following the weekly plan above.

---

**You have everything you need to build this. Let's go!** 🚀


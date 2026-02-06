# StampLedger Backend API - Claude Code Specification

**Project:** StampLedger Application Server  
**Purpose:** REST API that sits between users and MunicipalChain blockchain  
**Language:** Go  
**Framework:** Gin (HTTP router)  
**Timeline:** 3-4 weeks

---

## Project Overview

Build the application layer that:
- **PE Engineers** use to create and manage stamps
- **Municipalities** use to verify stamps
- **Administrators** use to manage the platform
- Connects to MunicipalChain blockchain for permanent storage
- Provides rich metadata beyond what's stored on-chain

---

## Tech Stack

```json
{
  "language": "Go 1.21+",
  "framework": "Gin (HTTP router)",
  "database": "PostgreSQL 15",
  "cache": "Redis 7",
  "storage": "AWS S3 / MinIO",
  "queue": "none initially (add later if needed)",
  "auth": "JWT (golang-jwt/jwt)",
  "blockchain": "MunicipalChain (gRPC client)",
  "email": "Resend API",
  "monitoring": "Prometheus + Grafana"
}
```

---

## Project Structure

```
stampledger-api/
├── cmd/
│   └── api/
│       └── main.go                    # Entry point
├── internal/
│   ├── api/                           # HTTP handlers
│   │   ├── middleware/
│   │   │   ├── auth.go
│   │   │   ├── cors.go
│   │   │   └── logger.go
│   │   ├── handlers/
│   │   │   ├── auth.go               # Login, register
│   │   │   ├── stamps.go             # Stamp CRUD
│   │   │   ├── verification.go      # Verify stamps
│   │   │   ├── users.go              # User management
│   │   │   ├── jurisdictions.go     # Municipality management
│   │   │   └── analytics.go         # Stats, dashboards
│   │   └── router.go                 # Route setup
│   ├── blockchain/                    # Blockchain client
│   │   ├── client.go                 # gRPC client to MunicipalChain
│   │   ├── stamps.go                 # Stamp operations
│   │   └── queries.go                # Query operations
│   ├── database/                      # PostgreSQL
│   │   ├── db.go                     # Connection pool
│   │   ├── migrations/               # SQL migrations
│   │   └── queries/                  # SQL queries (sqlc generated)
│   ├── models/                        # Data models
│   │   ├── user.go
│   │   ├── stamp.go
│   │   ├── jurisdiction.go
│   │   └── pe_license.go
│   ├── services/                      # Business logic
│   │   ├── auth.go
│   │   ├── stamp.go
│   │   ├── verification.go
│   │   ├── license_check.go         # External API calls to state boards
│   │   ├── insurance_check.go       # Insurance verification
│   │   └── email.go                  # Email notifications
│   ├── storage/                       # File storage (S3)
│   │   ├── s3.go
│   │   └── documents.go
│   └── config/
│       └── config.go                  # Configuration loading
├── pkg/                               # Shared packages
│   ├── crypto/
│   │   ├── hash.go                   # SHA-256 hashing
│   │   └── signature.go              # Digital signatures
│   ├── pdf/
│   │   ├── stamper.go                # Overlay QR code on PDF
│   │   └── qrcode.go                 # QR code generation
│   └── utils/
│       ├── errors.go
│       └── response.go
├── tests/
│   ├── integration/
│   └── unit/
├── scripts/
│   ├── migrate.sh                     # Run DB migrations
│   └── seed.sh                        # Seed test data
├── docs/
│   ├── api.md                         # API documentation
│   └── architecture.md
├── Dockerfile
├── docker-compose.yml                 # Local development
├── .env.example
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

---

## Database Schema (PostgreSQL)

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- 'pe', 'inspector', 'admin'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### PE Profiles Table
```sql
CREATE TABLE pe_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) NOT NULL,
    state VARCHAR(2) NOT NULL,
    disciplines TEXT[], -- ['electrical', 'structural', etc.]
    license_expiry DATE,
    insurance_carrier VARCHAR(255),
    insurance_policy VARCHAR(100),
    insurance_amount DECIMAL(12,2),
    insurance_expiry DATE,
    public_key TEXT, -- For digital signatures
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(license_number, state)
);
CREATE INDEX idx_pe_license ON pe_profiles(license_number, state);
```

### Jurisdictions Table
```sql
CREATE TABLE jurisdictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    state VARCHAR(2) NOT NULL,
    county VARCHAR(100),
    population INTEGER,
    tier VARCHAR(20), -- 'tier1', 'tier2', 'tier3', 'tier4'
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    enabled BOOLEAN DEFAULT TRUE,
    subscription_status VARCHAR(50) DEFAULT 'trial', -- 'trial', 'active', 'suspended'
    subscription_start DATE,
    subscription_end DATE,
    annual_fee DECIMAL(10,2),
    api_key_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_jurisdictions_state ON jurisdictions(state);
CREATE INDEX idx_jurisdictions_enabled ON jurisdictions(enabled);
```

### Stamps Table (Rich Metadata - Blockchain Mirrors Here)
```sql
CREATE TABLE stamps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Blockchain reference
    blockchain_id VARCHAR(66) NOT NULL UNIQUE, -- On-chain stamp ID
    tx_hash VARCHAR(66), -- Blockchain transaction hash
    block_height BIGINT,
    
    -- User who created it
    user_id UUID REFERENCES users(id),
    pe_profile_id UUID REFERENCES pe_profiles(id),
    
    -- Document info
    document_hash VARCHAR(64) NOT NULL,
    document_url TEXT, -- S3 URL to stamped PDF
    original_filename VARCHAR(255),
    document_type VARCHAR(50), -- 'electrical_plans', 'structural_calcs', etc.
    
    -- Project info
    project_name VARCHAR(255),
    project_address TEXT,
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    permit_number VARCHAR(100),
    
    -- Verification snapshots (at time of stamping)
    license_verified_at TIMESTAMP,
    license_status VARCHAR(50),
    insurance_verified_at TIMESTAMP,
    insurance_status VARCHAR(50),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'revoked', 'expired'
    revoked_reason TEXT,
    revoked_at TIMESTAMP,
    revoked_by UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    INDEX idx_stamps_user (user_id),
    INDEX idx_stamps_pe (pe_profile_id),
    INDEX idx_stamps_jurisdiction (jurisdiction_id),
    INDEX idx_stamps_document_hash (document_hash),
    INDEX idx_stamps_blockchain_id (blockchain_id),
    INDEX idx_stamps_status (status),
    INDEX idx_stamps_created (created_at DESC)
);
```

### Verifications Table (Audit Log)
```sql
CREATE TABLE verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stamp_id UUID REFERENCES stamps(id),
    verified_by UUID REFERENCES users(id), -- Inspector who verified
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    ip_address INET,
    user_agent TEXT,
    result VARCHAR(50), -- 'valid', 'invalid', 'revoked', 'not_found'
    verified_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_verifications_stamp ON verifications(stamp_id);
CREATE INDEX idx_verifications_user ON verifications(verified_by);
CREATE INDEX idx_verifications_jurisdiction ON verifications(jurisdiction_id);
CREATE INDEX idx_verifications_date ON verifications(verified_at DESC);
```

### API Keys Table
```sql
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    jurisdiction_id UUID REFERENCES jurisdictions(id),
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(10), -- First 8 chars (for display)
    name VARCHAR(255),
    scopes TEXT[], -- ['stamps:create', 'stamps:verify', etc.]
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    revoked BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
```

---

## API Endpoints

### Authentication

```
POST   /api/v1/auth/register          # Register new user
POST   /api/v1/auth/login             # Login (returns JWT)
POST   /api/v1/auth/logout            # Logout
POST   /api/v1/auth/refresh           # Refresh JWT token
POST   /api/v1/auth/forgot-password   # Request password reset
POST   /api/v1/auth/reset-password    # Reset password with token
GET    /api/v1/auth/verify-email/:token # Verify email address
```

### Users

```
GET    /api/v1/users/me               # Get current user profile
PATCH  /api/v1/users/me               # Update profile
POST   /api/v1/users/me/pe-profile    # Create/update PE profile
GET    /api/v1/users/me/stamps        # List my stamps
GET    /api/v1/users/me/verifications # List stamps I've verified
```

### Stamps

```
POST   /api/v1/stamps                 # Create new stamp
GET    /api/v1/stamps                 # List stamps (paginated)
GET    /api/v1/stamps/:id             # Get stamp details
PATCH  /api/v1/stamps/:id             # Update stamp metadata
DELETE /api/v1/stamps/:id             # Revoke stamp
POST   /api/v1/stamps/:id/revoke      # Revoke with reason
GET    /api/v1/stamps/:id/download    # Download stamped PDF
```

### Verification

```
POST   /api/v1/verify                 # Verify by document hash or stamp ID
GET    /api/v1/verify/:stamp_id       # Quick verification (public)
POST   /api/v1/verify/qr              # Verify by QR code data
GET    /api/v1/verify/bulk            # Bulk verification (CSV upload)
```

### Jurisdictions (Admin)

```
GET    /api/v1/jurisdictions          # List all jurisdictions
POST   /api/v1/jurisdictions          # Create jurisdiction
GET    /api/v1/jurisdictions/:id      # Get jurisdiction details
PATCH  /api/v1/jurisdictions/:id      # Update jurisdiction
DELETE /api/v1/jurisdictions/:id      # Delete jurisdiction
GET    /api/v1/jurisdictions/:id/stamps # All stamps in jurisdiction
GET    /api/v1/jurisdictions/:id/stats  # Analytics for jurisdiction
```

### Analytics

```
GET    /api/v1/analytics/dashboard    # Dashboard stats (role-specific)
GET    /api/v1/analytics/stamps       # Stamp creation trends
GET    /api/v1/analytics/verifications # Verification activity
GET    /api/v1/analytics/jurisdictions # Per-jurisdiction stats
```

### Admin

```
GET    /api/v1/admin/users            # List all users
PATCH  /api/v1/admin/users/:id        # Update user (change role, etc.)
DELETE /api/v1/admin/users/:id        # Delete user
GET    /api/v1/admin/stamps           # All stamps (admin view)
POST   /api/v1/admin/stamps/:id/force-revoke # Force revoke
GET    /api/v1/admin/system/health    # System health check
GET    /api/v1/admin/system/metrics   # Prometheus metrics
```

---

## Implementation Examples

### Main Entry Point

**File:** `cmd/api/main.go`

```go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
    
    "github.com/stampledger/api/internal/api"
    "github.com/stampledger/api/internal/blockchain"
    "github.com/stampledger/api/internal/config"
    "github.com/stampledger/api/internal/database"
)

func main() {
    // Load configuration
    cfg, err := config.Load()
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }
    
    // Connect to database
    db, err := database.New(cfg.DatabaseURL)
    if err != nil {
        log.Fatalf("Failed to connect to database: %v", err)
    }
    defer db.Close()
    
    // Connect to blockchain
    bcClient, err := blockchain.NewClient(cfg.BlockchainGRPC)
    if err != nil {
        log.Fatalf("Failed to connect to blockchain: %v", err)
    }
    defer bcClient.Close()
    
    // Setup HTTP router
    router := api.NewRouter(db, bcClient, cfg)
    
    // Start server
    srv := &http.Server{
        Addr:         ":" + cfg.Port,
        Handler:      router,
        ReadTimeout:  15 * time.Second,
        WriteTimeout: 15 * time.Second,
        IdleTimeout:  60 * time.Second,
    }
    
    // Graceful shutdown
    go func() {
        log.Printf("Server starting on port %s", cfg.Port)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server failed: %v", err)
        }
    }()
    
    // Wait for interrupt signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit
    
    log.Println("Shutting down server...")
    
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
    
    log.Println("Server exited")
}
```

---

### Router Setup

**File:** `internal/api/router.go`

```go
package api

import (
    "github.com/gin-gonic/gin"
    "github.com/stampledger/api/internal/api/handlers"
    "github.com/stampledger/api/internal/api/middleware"
    "github.com/stampledger/api/internal/blockchain"
    "github.com/stampledger/api/internal/config"
    "github.com/stampledger/api/internal/database"
)

func NewRouter(db *database.DB, bc *blockchain.Client, cfg *config.Config) *gin.Engine {
    // Set Gin mode
    if cfg.Environment == "production" {
        gin.SetMode(gin.ReleaseMode)
    }
    
    r := gin.New()
    
    // Global middleware
    r.Use(middleware.Logger())
    r.Use(middleware.CORS())
    r.Use(gin.Recovery())
    
    // Health check (no auth required)
    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })
    
    // API v1 routes
    v1 := r.Group("/api/v1")
    {
        // Auth routes (no auth required)
        auth := v1.Group("/auth")
        {
            authHandler := handlers.NewAuthHandler(db, cfg)
            auth.POST("/register", authHandler.Register)
            auth.POST("/login", authHandler.Login)
            auth.POST("/logout", authHandler.Logout)
            auth.POST("/refresh", authHandler.RefreshToken)
            auth.POST("/forgot-password", authHandler.ForgotPassword)
            auth.POST("/reset-password", authHandler.ResetPassword)
            auth.GET("/verify-email/:token", authHandler.VerifyEmail)
        }
        
        // Public verification (no auth required)
        v1.GET("/verify/:stamp_id", handlers.NewVerificationHandler(db, bc).QuickVerify)
        
        // Protected routes (require JWT)
        protected := v1.Group("")
        protected.Use(middleware.AuthRequired(cfg.JWTSecret))
        {
            // User routes
            users := protected.Group("/users")
            {
                userHandler := handlers.NewUserHandler(db)
                users.GET("/me", userHandler.GetMe)
                users.PATCH("/me", userHandler.UpdateMe)
                users.POST("/me/pe-profile", userHandler.UpdatePEProfile)
                users.GET("/me/stamps", userHandler.GetMyStamps)
            }
            
            // Stamp routes
            stamps := protected.Group("/stamps")
            {
                stampHandler := handlers.NewStampHandler(db, bc, cfg)
                stamps.POST("", stampHandler.CreateStamp)
                stamps.GET("", stampHandler.ListStamps)
                stamps.GET("/:id", stampHandler.GetStamp)
                stamps.PATCH("/:id", stampHandler.UpdateStamp)
                stamps.POST("/:id/revoke", stampHandler.RevokeStamp)
                stamps.GET("/:id/download", stampHandler.DownloadStamp)
            }
            
            // Verification routes
            verify := protected.Group("/verify")
            {
                verifyHandler := handlers.NewVerificationHandler(db, bc)
                verify.POST("", verifyHandler.Verify)
                verify.POST("/qr", verifyHandler.VerifyQR)
                verify.POST("/bulk", verifyHandler.BulkVerify)
            }
            
            // Analytics routes
            analytics := protected.Group("/analytics")
            {
                analyticsHandler := handlers.NewAnalyticsHandler(db)
                analytics.GET("/dashboard", analyticsHandler.Dashboard)
                analytics.GET("/stamps", analyticsHandler.StampTrends)
                analytics.GET("/verifications", analyticsHandler.VerificationActivity)
            }
            
            // Admin routes (require admin role)
            admin := protected.Group("/admin")
            admin.Use(middleware.RequireRole("admin"))
            {
                adminHandler := handlers.NewAdminHandler(db, bc)
                admin.GET("/users", adminHandler.ListUsers)
                admin.PATCH("/users/:id", adminHandler.UpdateUser)
                admin.DELETE("/users/:id", adminHandler.DeleteUser)
                admin.GET("/stamps", adminHandler.ListAllStamps)
                admin.POST("/stamps/:id/force-revoke", adminHandler.ForceRevokeStamp)
                admin.GET("/system/health", adminHandler.SystemHealth)
                admin.GET("/system/metrics", adminHandler.SystemMetrics)
                
                // Jurisdiction management
                jurisdictions := admin.Group("/jurisdictions")
                {
                    jurisdictions.GET("", adminHandler.ListJurisdictions)
                    jurisdictions.POST("", adminHandler.CreateJurisdiction)
                    jurisdictions.GET("/:id", adminHandler.GetJurisdiction)
                    jurisdictions.PATCH("/:id", adminHandler.UpdateJurisdiction)
                    jurisdictions.DELETE("/:id", adminHandler.DeleteJurisdiction)
                }
            }
        }
    }
    
    return r
}
```

---

### Stamp Creation Handler

**File:** `internal/api/handlers/stamps.go`

```go
package handlers

import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "io"
    "net/http"
    
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    
    "github.com/stampledger/api/internal/blockchain"
    "github.com/stampledger/api/internal/config"
    "github.com/stampledger/api/internal/database"
    "github.com/stampledger/api/internal/models"
    "github.com/stampledger/api/pkg/crypto"
    "github.com/stampledger/api/pkg/pdf"
)

type StampHandler struct {
    db     *database.DB
    bc     *blockchain.Client
    config *config.Config
}

func NewStampHandler(db *database.DB, bc *blockchain.Client, cfg *config.Config) *StampHandler {
    return &StampHandler{db: db, bc: bc, config: cfg}
}

type CreateStampRequest struct {
    ProjectName    string `json:"project_name" binding:"required"`
    ProjectAddress string `json:"project_address" binding:"required"`
    JurisdictionID string `json:"jurisdiction_id" binding:"required,uuid"`
    PermitNumber   string `json:"permit_number"`
    DocumentType   string `json:"document_type" binding:"required"`
    // File upload handled separately via multipart form
}

func (h *StampHandler) CreateStamp(c *gin.Context) {
    // Get authenticated user
    userID := c.GetString("user_id") // Set by auth middleware
    
    // Parse form data
    var req CreateStampRequest
    if err := c.ShouldBind(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Get uploaded file
    file, header, err := c.Request.FormFile("document")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "No document uploaded"})
        return
    }
    defer file.Close()
    
    // Read file content
    fileContent, err := io.ReadAll(file)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
        return
    }
    
    // Compute document hash
    hash := sha256.Sum256(fileContent)
    documentHash := hex.EncodeToString(hash[:])
    
    // Get user's PE profile
    peProfile, err := h.db.GetPEProfileByUserID(c.Request.Context(), userID)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "PE profile not found"})
        return
    }
    
    // Verify PE license (call external API)
    licenseValid, err := h.verifyPELicense(peProfile.LicenseNumber, peProfile.State)
    if err != nil || !licenseValid {
        c.JSON(http.StatusBadRequest, gin.H{"error": "PE license could not be verified"})
        return
    }
    
    // Verify insurance (call external API or check stored data)
    insuranceValid := h.verifyInsurance(peProfile)
    
    // Create stamp on blockchain
    blockchainStamp, err := h.bc.CreateStamp(c.Request.Context(), blockchain.CreateStampParams{
        DocumentHash:   documentHash,
        LicenseNumber:  peProfile.LicenseNumber,
        State:          peProfile.State,
        ProjectName:    req.ProjectName,
        ProjectAddress: req.ProjectAddress,
        JurisdictionID: req.JurisdictionID,
        PermitNumber:   req.PermitNumber,
        DocumentType:   req.DocumentType,
        LicenseValid:   licenseValid,
        InsuranceValid: insuranceValid,
        // ... other fields
    })
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create stamp on blockchain"})
        return
    }
    
    // Generate QR code for verification
    qrCode, err := pdf.GenerateQRCode(blockchainStamp.ID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate QR code"})
        return
    }
    
    // Overlay QR code on PDF
    stampedPDF, err := pdf.OverlayStampOnPDF(fileContent, qrCode, peProfile)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to stamp PDF"})
        return
    }
    
    // Upload stamped PDF to S3
    documentURL, err := h.uploadToS3(stampedPDF, header.Filename)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload document"})
        return
    }
    
    // Store stamp metadata in database
    stamp := &models.Stamp{
        ID:              uuid.New(),
        BlockchainID:    blockchainStamp.ID,
        TxHash:          blockchainStamp.TxHash,
        BlockHeight:     blockchainStamp.BlockHeight,
        UserID:          uuid.MustParse(userID),
        PEProfileID:     peProfile.ID,
        DocumentHash:    documentHash,
        DocumentURL:     documentURL,
        OriginalFilename: header.Filename,
        DocumentType:    req.DocumentType,
        ProjectName:     req.ProjectName,
        ProjectAddress:  req.ProjectAddress,
        JurisdictionID:  uuid.MustParse(req.JurisdictionID),
        PermitNumber:    req.PermitNumber,
        Status:          "active",
    }
    
    if err := h.db.CreateStamp(c.Request.Context(), stamp); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save stamp"})
        return
    }
    
    // Return success
    c.JSON(http.StatusCreated, gin.H{
        "stamp_id":      stamp.ID,
        "blockchain_id": blockchainStamp.ID,
        "document_hash": documentHash,
        "document_url":  documentURL,
        "status":        "active",
        "created_at":    stamp.CreatedAt,
    })
}

func (h *StampHandler) verifyPELicense(licenseNumber, state string) (bool, error) {
    // TODO: Call actual state board API
    // For now, just return true if license number is non-empty
    return licenseNumber != "", nil
}

func (h *StampHandler) verifyInsurance(profile *models.PEProfile) bool {
    // TODO: Call insurance verification API
    // For now, check if insurance data exists
    return profile.InsuranceCarrier != "" && profile.InsurancePolicy != ""
}

func (h *StampHandler) uploadToS3(fileContent []byte, filename string) (string, error) {
    // TODO: Implement S3 upload
    // Return placeholder URL for now
    return fmt.Sprintf("https://stampledger-documents.s3.amazonaws.com/%s", filename), nil
}
```

---

### Verification Handler

**File:** `internal/api/handlers/verification.go`

```go
package handlers

import (
    "net/http"
    
    "github.com/gin-gonic/gin"
    "github.com/stampledger/api/internal/blockchain"
    "github.com/stampledger/api/internal/database"
)

type VerificationHandler struct {
    db *database.DB
    bc *blockchain.Client
}

func NewVerificationHandler(db *database.DB, bc *blockchain.Client) *VerificationHandler {
    return &VerificationHandler{db: db, bc: bc}
}

// QuickVerify is a public endpoint (no auth) for quick verification by stamp ID
func (h *VerificationHandler) QuickVerify(c *gin.Context) {
    stampID := c.Param("stamp_id")
    
    // Query blockchain
    bcStamp, err := h.bc.GetStamp(c.Request.Context(), stampID)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "valid":   false,
            "message": "Stamp not found",
        })
        return
    }
    
    // Check status
    valid := bcStamp.Status == "active"
    
    // Get rich metadata from database
    dbStamp, err := h.db.GetStampByBlockchainID(c.Request.Context(), stampID)
    if err != nil {
        // Stamp exists on blockchain but not in our DB (shouldn't happen)
        c.JSON(http.StatusOK, gin.H{
            "valid":   valid,
            "stamp":   bcStamp,
            "message": "Stamp verified on blockchain",
        })
        return
    }
    
    // Record verification (for analytics)
    h.db.RecordVerification(c.Request.Context(), dbStamp.ID, c.ClientIP())
    
    // Return detailed info
    c.JSON(http.StatusOK, gin.H{
        "valid":   valid,
        "stamp":   mapStampResponse(dbStamp, bcStamp),
        "message": getMessage(bcStamp.Status),
    })
}

type VerifyRequest struct {
    DocumentHash *string `json:"document_hash"`
    StampID      *string `json:"stamp_id"`
}

func (h *VerificationHandler) Verify(c *gin.Context) {
    var req VerifyRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    if req.DocumentHash != nil {
        // Verify by document hash
        h.verifyByDocumentHash(c, *req.DocumentHash)
    } else if req.StampID != nil {
        // Verify by stamp ID
        h.verifyByStampID(c, *req.StampID)
    } else {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Must provide document_hash or stamp_id"})
    }
}

func (h *VerificationHandler) verifyByDocumentHash(c *gin.Context, documentHash string) {
    // Query blockchain
    result, err := h.bc.VerifyDocumentHash(c.Request.Context(), documentHash)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Verification failed"})
        return
    }
    
    if !result.Exists {
        c.JSON(http.StatusOK, gin.H{
            "valid":   false,
            "message": "No stamp found for this document",
        })
        return
    }
    
    // Get rich metadata
    dbStamp, _ := h.db.GetStampByBlockchainID(c.Request.Context(), result.Stamp.ID)
    
    c.JSON(http.StatusOK, gin.H{
        "valid":   result.Valid,
        "stamp":   mapStampResponse(dbStamp, result.Stamp),
        "message": result.Message,
    })
}

func (h *VerificationHandler) verifyByStampID(c *gin.Context, stampID string) {
    // Same as QuickVerify but returns more detail
    h.QuickVerify(c)
}

func getMessage(status string) string {
    switch status {
    case "active":
        return "Stamp is valid and active"
    case "revoked":
        return "Stamp has been revoked"
    case "expired":
        return "Stamp has expired"
    default:
        return "Unknown status"
    }
}

func mapStampResponse(dbStamp *models.Stamp, bcStamp *blockchain.Stamp) map[string]interface{} {
    // Combine data from database and blockchain
    return map[string]interface{}{
        "stamp_id":         dbStamp.ID,
        "blockchain_id":    bcStamp.ID,
        "document_hash":    bcStamp.DocumentHash,
        "pe_info": map[string]string{
            "license_number": bcStamp.PEInfo.LicenseNumber,
            "state":          bcStamp.PEInfo.State,
        },
        "project_info": map[string]string{
            "name":    dbStamp.ProjectName,
            "address": dbStamp.ProjectAddress,
        },
        "status":     bcStamp.Status,
        "created_at": bcStamp.CreatedAt,
        // Don't expose sensitive info like insurance details to public endpoint
    }
}
```

---

## Environment Variables

**File:** `.env.example`

```bash
# Application
ENV=development
PORT=8000
APP_NAME=StampLedger API

# Database
DATABASE_URL=postgres://stampledger:password@localhost:5432/stampledger?sslmode=disable

# Blockchain
BLOCKCHAIN_GRPC=localhost:9090
BLOCKCHAIN_REST=http://localhost:1317

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24h

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379/0

# S3 / Storage
S3_BUCKET=stampledger-documents
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Email (Resend)
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=hello@stampledger.com

# External APIs
WI_LICENSE_API_URL=https://api.wisconsin.gov/licenses
WI_LICENSE_API_KEY=xxx

# Monitoring
PROMETHEUS_ENABLED=true
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Testing

**File:** `tests/integration/stamps_test.go`

```go
package integration

import (
    "bytes"
    "encoding/json"
    "mime/multipart"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stampledger/api/internal/api"
)

func TestCreateStamp(t *testing.T) {
    // Setup test database and router
    db := setupTestDB(t)
    defer db.Close()
    
    bc := setupTestBlockchain(t)
    defer bc.Close()
    
    router := api.NewRouter(db, bc, testConfig())
    
    // Create test user and login
    token := createTestUserAndLogin(t, router, "pe")
    
    // Prepare multipart form
    body := &bytes.Buffer{}
    writer := multipart.NewWriter(body)
    
    // Add form fields
    writer.WriteField("project_name", "Test Project")
    writer.WriteField("project_address", "123 Test St")
    writer.WriteField("jurisdiction_id", "test-jurisdiction-uuid")
    writer.WriteField("document_type", "electrical_plans")
    
    // Add file
    part, _ := writer.CreateFormFile("document", "test.pdf")
    part.Write([]byte("fake pdf content"))
    writer.Close()
    
    // Make request
    req := httptest.NewRequest("POST", "/api/v1/stamps", body)
    req.Header.Set("Content-Type", writer.FormDataContentType())
    req.Header.Set("Authorization", "Bearer "+token)
    
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    // Assert
    assert.Equal(t, http.StatusCreated, w.Code)
    
    var response map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &response)
    
    assert.NotEmpty(t, response["stamp_id"])
    assert.NotEmpty(t, response["blockchain_id"])
    assert.Equal(t, "active", response["status"])
}

func TestVerifyStamp(t *testing.T) {
    // Setup
    db := setupTestDB(t)
    defer db.Close()
    
    bc := setupTestBlockchain(t)
    defer bc.Close()
    
    router := api.NewRouter(db, bc, testConfig())
    
    // Create a test stamp first
    stampID := createTestStamp(t, router)
    
    // Verify stamp (public endpoint, no auth)
    req := httptest.NewRequest("GET", "/api/v1/verify/"+stampID, nil)
    w := httptest.NewRecorder()
    router.ServeHTTP(w, req)
    
    // Assert
    assert.Equal(t, http.StatusOK, w.Code)
    
    var response map[string]interface{}
    json.Unmarshal(w.Body.Bytes(), &response)
    
    assert.True(t, response["valid"].(bool))
    assert.Equal(t, "Stamp is valid and active", response["message"])
}
```

---

## Success Criteria

**The API is complete when:**

✅ All endpoints implemented and tested  
✅ Authentication works (JWT)  
✅ PE can create stamp (end-to-end)  
✅ Inspector can verify stamp  
✅ Stamp recorded on blockchain  
✅ PDF stamping works (QR code overlay)  
✅ S3 upload works  
✅ Database migrations run cleanly  
✅ Integration tests pass  
✅ API documentation generated (Swagger)  
✅ Can deploy to staging environment  

---

## Deployment

**Docker Compose for Local Development:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: stampledger
      POSTGRES_PASSWORD: password
      POSTGRES_DB: stampledger
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
  
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://stampledger:password@postgres:5432/stampledger?sslmode=disable
      - REDIS_URL=redis://redis:6379/0
      - BLOCKCHAIN_GRPC=blockchain:9090
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app

volumes:
  postgres_data:
```

---

## Next Steps

1. **License Verification Integration** - Connect to real state board APIs
2. **Insurance Verification** - Partner with insurance carriers
3. **Email Notifications** - Resend integration for confirmations
4. **Webhooks** - Alert municipalities when stamps created in their jurisdiction
5. **Rate Limiting** - Prevent API abuse
6. **Caching** - Redis for frequently accessed stamps
7. **Search** - Elasticsearch for advanced stamp search
8. **Mobile App** - React Native app for inspectors

---

## Notes for Claude Code

**When building this:**

1. **Use sqlc for database queries** - Type-safe SQL
2. **Use golang-migrate for migrations** - Version controlled schema changes
3. **Comprehensive error handling** - Don't swallow errors
4. **Structured logging** - Use zerolog or zap
5. **Graceful degradation** - If blockchain is down, queue operations
6. **Idempotency** - Stamp creation should be idempotent (check document hash first)
7. **Rate limiting** - Per user, per IP
8. **API versioning** - /api/v1, /api/v2 for future changes

This is the glue between users and the blockchain. Make it robust!


# StampLedger Extensions — Bluebeam Revu & Adobe Acrobat
## Detailed Technical Specification — February 2026

---

## EXECUTIVE SUMMARY

Engineers live in Bluebeam Revu and Adobe Acrobat. Making them leave these tools to stamp or verify documents in a separate web portal adds friction that kills adoption. The StampLedger extensions bring stamping and verification directly into the tools engineers already use, reducing the workflow to a single click within their existing environment.

Two extensions, one API. The Bluebeam integration operates through their Studio API and webhooks for automated, background verification. The Adobe integration operates through Acrobat's JavaScript API for interactive stamp creation and verification. Both connect to the same StampLedger REST API that powers the web portal.

**Dependency:** Both extensions require the StampLedger API and QR Verification System to be production-ready. Build those first. These extensions are the distribution layer, not the core product.

---

## PART 1: BLUEBEAM REVU INTEGRATION

### Why Bluebeam First

Bluebeam Revu is the dominant PDF tool in AEC (Architecture, Engineering, Construction). Over 2 million users. Every engineering firm in the Fox Valley uses it. When engineers review plans, do takeoffs, or collaborate on submittals, they're in Bluebeam. Bluebeam Studio Sessions are how multi-firm teams review documents together in real time.

Bluebeam's developer platform offers REST APIs for Studio (Sessions and Projects), webhooks for event-driven automation, and JavaScript within PDFs for document-level scripting. There is no native plugin SDK for adding toolbar buttons or panels — Bluebeam controls the application UI. The integration must work through their sanctioned extension points.

### Integration Architecture

```
┌──────────────────────┐         ┌─────────────────────┐         ┌──────────────┐
│    BLUEBEAM REVU     │         │  STAMPLEDGER BACKEND │         │  BLOCKCHAIN  │
│                      │         │                     │         │              │
│  Studio Sessions ────┼────────▶│  Webhook Receiver    │────────▶│  Stamp       │
│  Studio Projects ────┼────────▶│  Document Hasher     │         │  Module      │
│                      │         │  QR Embedder         │         │              │
│  User uploads PDF    │         │  Verification API    │         │              │
│  User finalizes docs │         │                     │         │              │
│  User closes session │         │  Studio API Client   │────────▶│              │
│                      │◀────────┼  (push back results) │         │              │
│  Stamped PDF appears │         │                     │         │              │
│  in Studio Project   │         │                     │         │              │
└──────────────────────┘         └─────────────────────┘         └──────────────┘
```

### Integration Modes

#### Mode 1: Automated Background Stamping (Primary)

This is the flagship integration. The engineer doesn't do anything differently. They use Bluebeam Studio as they always have. StampLedger operates invisibly in the background.

**Setup (one-time, per organization):**
1. Organization admin connects StampLedger to Bluebeam via OAuth 2.0 in the StampLedger portal
2. Admin configures which Studio Projects should be monitored
3. Admin configures stamping rules:
   - Auto-stamp all documents uploaded by verified PEs
   - Auto-stamp only when documents are moved to a "Final" folder
   - Auto-stamp when a Studio Session is closed/finalized
   - Manual trigger only (PE clicks "Stamp" in portal, StampLedger pulls from Bluebeam)

**Automated Flow:**

1. PE uploads finalized electrical plans to Bluebeam Studio Project → "PS-047 Westheimer/Final Documents/"
2. Bluebeam webhook fires: `document.uploaded` event with project ID, document ID, uploader identity
3. StampLedger webhook receiver processes event:
   a. Verifies uploader is a registered PE with active license and tokens
   b. Downloads document from Bluebeam Studio via API
   c. Computes SHA-256 hash
   d. Records stamp on blockchain
   e. Generates QR code
   f. Embeds QR in PDF
   g. Uploads stamped PDF back to the Studio Project, replacing the original (or alongside, per configuration)
   h. Adds a Bluebeam markup/annotation to the document noting the stamp details
   i. Deducts stamp token
4. PE sees the stamped document in Bluebeam with StampLedger verification QR embedded
5. Anyone who accesses the document in the Studio Project gets the stamped version

**Webhook Events to Subscribe:**

| Bluebeam Event | StampLedger Action |
|---------------|-------------------|
| `document.uploaded` | Check if auto-stamp rules match, stamp if yes |
| `document.updated` | Re-hash and verify against original stamp, alert if modified |
| `session.finalized` | Stamp all documents in session that haven't been stamped |
| `session.closed` | Final integrity check on all stamped documents |
| `markup.status_changed` | Track review status for compliance timeline |

#### Mode 2: On-Demand Verification via Markup

For inspectors or reviewers using Bluebeam to review submitted plans:

1. Reviewer opens a stamped PDF in Bluebeam
2. Reviewer sees the StampLedger QR code on the document
3. Reviewer right-clicks the QR area → opens verification URL in browser
4. Alternatively, reviewer uses Bluebeam's built-in "Links" feature to click the verification URL embedded as a PDF link annotation

**Enhancement:** When StampLedger embeds the QR code in the PDF, it also embeds a clickable PDF link annotation over the QR area. Clicking it in any PDF viewer (including Bluebeam) opens the verification page. This works without any Bluebeam-specific integration — it's standard PDF link behavior.

#### Mode 3: Studio Session Integrity Monitoring

For bid document management and construction document control:

1. Municipality creates a Bluebeam Studio Project for a bid solicitation
2. StampLedger monitors the project via webhook
3. When bid documents are posted, StampLedger hashes each document and records it on-chain
4. If any document is modified after posting (detected via `document.updated` webhook), StampLedger:
   a. Alerts the project admin
   b. Records the modification event on-chain (who, when, what changed)
   c. Optionally locks the document if configured for bid integrity mode
5. At bid opening, the municipality can generate a StampLedger integrity report showing the complete chain of custody for every document in the project

### Bluebeam Developer Portal Requirements

To build this integration, you need:

1. **Bluebeam Developer Account:** Register at developers.bluebeam.com
2. **OAuth 2.0 App Registration:** Create an app with the following scopes:
   - `studio.projects.read` — list and access Studio Projects
   - `studio.projects.write` — upload stamped documents back
   - `studio.sessions.read` — access Session data
   - `studio.documents.read` — download documents for hashing
   - `studio.documents.write` — upload stamped versions
   - `studio.markups.read` — read markup/review status
   - `studio.webhooks.manage` — subscribe to events
3. **Webhook Endpoint:** Public HTTPS endpoint on StampLedger backend to receive Bluebeam webhook events
4. **API Region:** Select the correct Bluebeam API instance for your region (US)

### Bluebeam API Interactions

**Authentication:**
```
POST https://authserver.bluebeam.com/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={auth_code}
&client_id={client_id}
&client_secret={client_secret}
&redirect_uri={redirect_uri}
```

Token refresh:
```
POST https://authserver.bluebeam.com/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token={refresh_token}
&client_id={client_id}
&client_secret={client_secret}
```

Tokens expire after 1 hour. Store refresh tokens securely per organization. Token rotation required.

**List Studio Projects:**
```
GET https://studioapi.bluebeam.com/publicapi/v1/projects
Authorization: Bearer {access_token}
```

**Download Document from Project:**
```
GET https://studioapi.bluebeam.com/publicapi/v1/projects/{project_id}/files/{file_id}/download
Authorization: Bearer {access_token}
```

**Upload Stamped Document:**
```
POST https://studioapi.bluebeam.com/publicapi/v1/projects/{project_id}/files
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: <stamped PDF binary>
folder: /Final Documents/Stamped/
```

**Subscribe to Webhook:**
```
POST https://studioapi.bluebeam.com/publicapi/v1/webhooks
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "url": "https://api.stampledger.com/webhooks/bluebeam",
  "events": ["document.uploaded", "document.updated", "session.finalized"],
  "project_id": "{project_id}",
  "secret": "{webhook_signing_secret}"
}
```

### Bluebeam Integration — Portal Configuration UI

New section in StampLedger portal under Settings or as a top-level nav item:

**Integrations → Bluebeam**

```
┌─────────────────────────────────────────────┐
│ Bluebeam Integration                        │
│                                             │
│ Status: ✅ Connected                        │
│ Account: engineering@acmegroup.com          │
│ Connected: Jan 15, 2026                     │
│                                             │
│ [Disconnect]  [Refresh Connection]          │
│                                             │
│ ─── Monitored Projects ──────────────────── │
│                                             │
│ ☑ PS-047 Westheimer Pump Station            │
│   Rule: Auto-stamp on upload to /Final/     │
│   Stamps created: 3                         │
│                                             │
│ ☑ PS-103 Heights Water Treatment            │
│   Rule: Auto-stamp on session close         │
│   Stamps created: 0                         │
│                                             │
│ ☐ General Documents (not monitored)         │
│                                             │
│ [+ Add Project]                             │
│                                             │
│ ─── Auto-Stamp Rules ───────────────────── │
│                                             │
│ Default rule: Auto-stamp when uploaded      │
│ to folder named "Final" by verified PE      │
│                                             │
│ ☑ Replace original with stamped version     │
│ ☐ Keep original, add stamped copy           │
│ ☑ Add markup annotation with stamp details  │
│ ☑ Send notification to PE on stamp creation │
│                                             │
│ [Save Settings]                             │
└─────────────────────────────────────────────┘
```

### Bluebeam — Edge Cases and Error Handling

| Scenario | Handling |
|----------|---------|
| PE uploads document but isn't registered in StampLedger | Skip auto-stamp, log event, optionally notify org admin |
| PE has no remaining stamp tokens | Skip auto-stamp, notify PE via email, log event |
| PE's license has expired since last check | Skip auto-stamp, alert PE and org admin, flag for review |
| Document upload fails hash computation (corrupted PDF) | Skip, notify PE, log error |
| Bluebeam API rate limit hit | Queue and retry with exponential backoff |
| Webhook delivery fails | Bluebeam retries (per their retry policy), StampLedger processes idempotently |
| Same document uploaded twice | Check hash against existing stamps, skip if already stamped, log duplicate |
| Document modified after stamping | Alert PE and org admin, record modification event on-chain, flag in portal |
| Bluebeam OAuth token expires | Auto-refresh using stored refresh token, re-authenticate if refresh fails |
| Organization disconnects Bluebeam | Stop all webhook processing, archive connection data, stamps remain valid |

---

## PART 2: ADOBE ACROBAT INTEGRATION

### Why Adobe Acrobat

Adobe Acrobat (Pro and Standard) is ubiquitous. While Bluebeam dominates AEC specifically, Acrobat is everywhere — municipalities, inspectors, contractors, legal departments, and the 60% of engineering-adjacent professionals who don't have Bluebeam licenses. The Adobe extension ensures StampLedger verification works for everyone in the document chain, not just the engineers creating stamps.

### Integration Approach

Adobe offers three extension paths: C/C++ plugins (.api files), JavaScript extensions, and IAC (inter-application communication). The JavaScript path is the right choice for StampLedger because it's cross-platform (Windows + Mac), doesn't require Adobe's certification process, can be distributed as a simple folder/file install, and can make HTTP requests to the StampLedger API.

Adobe Acrobat JavaScript extensions are `.js` files placed in Acrobat's `JavaScripts` folder. They run at application startup and can add menu items, toolbar buttons, and respond to document events.

### Extension Architecture

```
┌────────────────────────────────────┐       ┌─────────────────────┐
│        ADOBE ACROBAT               │       │  STAMPLEDGER API    │
│                                    │       │                     │
│  ┌──────────────────────────────┐  │       │                     │
│  │  StampLedger.js              │  │       │                     │
│  │  (Folder-level JavaScript)   │  │       │                     │
│  │                              │  │       │                     │
│  │  Menu: StampLedger           │  │       │                     │
│  │    ├── Stamp This Document   │──┼──────▶│  POST /v1/stamps    │
│  │    ├── Verify This Document  │──┼──────▶│  POST /v1/verify/   │
│  │    ├── Check Stamp Status    │──┼──────▶│  GET /v1/verify/    │
│  │    ├── View Stamp History    │──┼──────▶│  GET /v1/stamps/    │
│  │    ├── Settings              │  │       │     my/history      │
│  │    └── About StampLedger     │  │       │                     │
│  │                              │  │       │                     │
│  │  Toolbar: [SL] button        │  │       │                     │
│  │  Context menu: right-click   │  │       │                     │
│  └──────────────────────────────┘  │       │                     │
│                                    │       │                     │
│  Document opens → check for        │       │                     │
│  StampLedger QR → show status bar  │       │                     │
└────────────────────────────────────┘       └─────────────────────┘
```

### Folder-Level JavaScript Extension

The extension is a single JavaScript file installed in Acrobat's JavaScripts folder:

**Windows:** `C:\Program Files\Adobe\Acrobat DC\Acrobat\JavaScripts\StampLedger.js`
**Mac:** `/Library/Application Support/Adobe/Acrobat/DC/JavaScripts/StampLedger.js`

Per-user installation (no admin required):
**Windows:** `%APPDATA%\Adobe\Acrobat\DC\JavaScripts\StampLedger.js`
**Mac:** `~/Library/Application Support/Adobe/Acrobat/DC/JavaScripts/StampLedger.js`

### Extension Features

#### Feature 1: Stamp This Document

PE opens a finalized PDF in Acrobat → StampLedger menu → "Stamp This Document"

**Flow:**

1. Extension checks if user is authenticated (stored API token in Acrobat's persistent JavaScript global)
2. If not authenticated, opens browser to `portal.stampledger.com/auth/acrobat` for OAuth login
3. Auth page generates a short-lived token, user copies it back into Acrobat dialog
4. Extension computes document hash locally (using Acrobat's `security.getDocHash()` or by reading document bytes)
5. Extension sends hash + document metadata to StampLedger API
6. API creates blockchain stamp, generates QR, returns stamp details
7. Extension downloads the QR image and embeds it in the document (using Acrobat's annotation/stamp API)
8. Extension saves the stamped document
9. Success dialog shows stamp ID, verification URL, and tokens remaining

**Implementation — Acrobat JavaScript:**

```javascript
// StampLedger.js — Folder-level script

// Add menu
app.addMenuItem({
    cName: "StampLedger-Stamp",
    cParent: "StampLedger",
    cExec: "StampLedger_StampDocument()",
    cEnable: "event.rc = (app.doc != null)",
    nPos: 0
});

app.addMenuItem({
    cName: "StampLedger-Verify",
    cParent: "StampLedger",
    cExec: "StampLedger_VerifyDocument()",
    cEnable: "event.rc = (app.doc != null)",
    nPos: 1
});

app.addMenuItem({
    cName: "StampLedger-Settings",
    cParent: "StampLedger",
    cExec: "StampLedger_Settings()",
    nPos: 2
});

// Add toolbar button
app.addToolButton({
    cName: "StampLedger-TB",
    cLabel: "StampLedger",
    cTooltext: "Stamp or verify this document with StampLedger",
    cExec: "StampLedger_QuickAction()",
    cEnable: "event.rc = (app.doc != null)",
    nPos: 0
});

// Global configuration
var StampLedger = {
    apiBase: "https://api.stampledger.com/v1",
    portalBase: "https://portal.stampledger.com",
    token: global.StampLedgerToken || null,
    
    setToken: function(token) {
        this.token = token;
        global.StampLedgerToken = token;
        global.setPersistent("StampLedgerToken", true);
    }
};

function StampLedger_StampDocument() {
    if (!StampLedger.token) {
        StampLedger_Authenticate();
        return;
    }
    
    var doc = app.activeDocs[0];
    if (!doc) {
        app.alert("No document is open.");
        return;
    }
    
    // Confirm action
    var confirm = app.alert({
        cMsg: "Stamp this document with your PE seal?\n\n" +
              "File: " + doc.documentFileName + "\n" +
              "Pages: " + doc.numPages + "\n\n" +
              "This will:\n" +
              "- Create an immutable blockchain record\n" +
              "- Embed a verification QR code\n" +
              "- Use 1 stamp token",
        nIcon: 2,
        nType: 1,
        cTitle: "StampLedger — Create Stamp"
    });
    
    if (confirm !== 1) return;
    
    // Get document data stream for hashing
    // Note: Acrobat JS has limited binary access
    // Alternative: save temp file, read via Net.HTTP upload
    
    // Open portal in browser for document upload
    // (Acrobat JS cannot reliably compute SHA-256 of binary PDF)
    app.launchURL(
        StampLedger.portalBase + "/stamp/quick" +
        "?filename=" + encodeURIComponent(doc.documentFileName) +
        "&pages=" + doc.numPages +
        "&source=acrobat-extension" +
        "&token=" + StampLedger.token
    );
    
    // TODO: For deeper integration, use SOAP/IAC to upload
    // document directly via Net.HTTP.request (requires 
    // Acrobat Pro and may hit security restrictions)
}

function StampLedger_VerifyDocument() {
    var doc = app.activeDocs[0];
    if (!doc) {
        app.alert("No document is open.");
        return;
    }
    
    // Check for StampLedger QR annotation or metadata
    var stampId = null;
    
    // Check document metadata for StampLedger stamp ID
    if (doc.info.StampLedgerID) {
        stampId = doc.info.StampLedgerID;
    }
    
    // Check document-level JavaScript for embedded stamp data
    if (!stampId && doc.getDataObjectContents) {
        try {
            var slData = doc.getDataObjectContents("StampLedgerData");
            if (slData) {
                var parsed = JSON.parse(util.stringFromStream(slData));
                stampId = parsed.stamp_id;
            }
        } catch(e) {}
    }
    
    if (stampId) {
        // Open verification page
        app.launchURL(StampLedger.portalBase.replace("portal.", "") + 
                      "/verify/" + stampId);
    } else {
        // No stamp found — offer to search
        var search = app.alert({
            cMsg: "No StampLedger stamp detected in this document.\n\n" +
                  "Would you like to:\n" +
                  "- Upload this document to check if it matches any existing stamp\n" +
                  "- Search by stamp ID manually",
            nIcon: 2,
            nType: 2,
            cTitle: "StampLedger — Verify"
        });
        
        if (search === 4) { // Yes
            app.launchURL(StampLedger.portalBase.replace("portal.", "") + 
                          "/verify?upload=true&source=acrobat-extension");
        }
    }
}

function StampLedger_Authenticate() {
    // Option 1: Open browser for OAuth
    app.launchURL(StampLedger.portalBase + "/auth/acrobat");
    
    // Prompt for token after browser auth
    var token = app.response({
        cQuestion: "Enter your StampLedger API token.\n\n" +
                   "1. A browser window has opened\n" +
                   "2. Log in to your StampLedger account\n" +
                   "3. Copy the API token shown\n" +
                   "4. Paste it below",
        cTitle: "StampLedger — Authentication",
        cLabel: "API Token:"
    });
    
    if (token) {
        StampLedger.setToken(token);
        app.alert("StampLedger connected successfully!", 3);
    }
}

function StampLedger_Settings() {
    var dialog = {
        description: {
            name: "StampLedger Settings",
            elements: [
                { type: "view", elements: [
                    { name: "Connected:", type: "static_text" },
                    { name: StampLedger.token ? "Yes ✓" : "No", 
                      type: "static_text" },
                ]},
                { name: "Login / Reconnect", type: "button",
                  item_id: "auth" },
                { name: "Logout", type: "button",
                  item_id: "lout" },
                { name: "Open StampLedger Portal", type: "button",
                  item_id: "port" },
            ]
        },
        auth: function() { StampLedger_Authenticate(); },
        lout: function() { 
            StampLedger.token = null;
            delete global.StampLedgerToken;
        },
        port: function() { 
            app.launchURL(StampLedger.portalBase); 
        }
    };
    app.execDialog(dialog);
}

function StampLedger_QuickAction() {
    // Toolbar button: detect if document has stamp, show verify
    // If no stamp, show stamp option
    var doc = app.activeDocs[0];
    if (doc && doc.info.StampLedgerID) {
        StampLedger_VerifyDocument();
    } else {
        StampLedger_StampDocument();
    }
}

// Auto-detect stamped documents on open
var StampLedger_DocOpen = app.trustedFunction(function(doc) {
    if (doc.info.StampLedgerID) {
        // Show console message (non-intrusive)
        console.println("StampLedger: This document has stamp " + 
                        doc.info.StampLedgerID);
    }
});
```

### Acrobat JavaScript Limitations and Workarounds

| Limitation | Workaround |
|-----------|-----------|
| Cannot compute SHA-256 of binary PDF | Delegate hashing to the API — upload document to `/v1/stamps` endpoint, server computes hash |
| `Net.HTTP` requests may be blocked by Acrobat security settings | Use `app.launchURL()` to open portal in browser for operations requiring data upload |
| Cannot embed images programmatically in all Acrobat versions | Use PDF annotations/stamps with the Acrobat stamp tool, or delegate QR embedding to server-side |
| Persistent storage limited to `global` variables | Store only API token; all other data comes from API |
| Dialogs are basic (no web views) | Keep UI simple; complex interactions happen in browser via `app.launchURL()` |
| Reader has restricted API access | Extension works in Acrobat Pro/Standard only; Reader users use QR code scanning (no extension needed) |
| Cross-platform path differences | Use Acrobat's app.getPath() for platform-agnostic paths |

### Enhanced Integration: IAC (Inter-Application Communication)

For deeper integration on Windows, a companion application can communicate with Acrobat via OLE/DDE:

**StampLedger Desktop Companion** (optional, enhances Acrobat integration):

- Small system tray application (Electron or native Windows app)
- Communicates with Acrobat via OLE Automation
- Can access the full PDF binary for local hashing
- Can embed QR codes directly into the PDF using pdf-lib (bypassing Acrobat's limited JavaScript)
- Provides right-click context menu on PDF files: "Stamp with StampLedger" / "Verify with StampLedger"
- Works alongside the JavaScript extension or independently

**Desktop Companion Architecture:**
```
┌───────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  System Tray App  │◀───▶│  Adobe Acrobat     │     │ StampLedger API  │
│                   │ OLE │  (open document)   │     │                  │
│  - Hash PDF       │     │                   │     │                  │
│  - Embed QR       │────────────────────────────▶│  POST /v1/stamps │
│  - Context menu   │     │                   │◀────│  Return stamp    │
│  - Token mgmt     │     │  Reloads document │     │                  │
└───────────────────┘     └───────────────────┘     └──────────────────┘
```

This is the "Layer 2" approach discussed earlier — it works with Bluebeam, Adobe, Foxit, or any PDF viewer because it operates at the file system level.

---

## PART 3: SHARED API LAYER

Both extensions connect to the same StampLedger API. The extensions add these API requirements beyond what the QR Verification spec defines:

### Extension-Specific Endpoints

**POST /v1/auth/extension-token**

Generate a long-lived API token for use in desktop extensions (Acrobat JS, Desktop Companion).

Request:
```json
{
  "grant_type": "extension",
  "user_token": "{short-lived token from browser OAuth}",
  "extension_type": "acrobat|bluebeam|desktop",
  "device_name": "Alex's MacBook Pro"
}
```

Response:
```json
{
  "api_token": "sl_ext_a7b3c9d4e5f6...",
  "expires_at": "2026-08-05T00:00:00Z",
  "user": {
    "name": "Alex Thompson",
    "email": "alex@acmeengineering.com",
    "organization": "Acme Engineering Group",
    "tokens_remaining": 47
  }
}
```

Extension tokens expire every 6 months and can be revoked from the portal. They have the same permissions as the user's portal session but are scoped to stamp creation and verification operations.

**POST /v1/stamps/from-hash**

Create a stamp from a pre-computed hash (for Desktop Companion which hashes locally):

```json
{
  "document_hash": "45df36ba121a4cff...a42c1c4db34c2a47",
  "hash_algorithm": "sha256",
  "filename": "Electrical Plans - PS-047.pdf",
  "page_count": 24,
  "file_size_bytes": 4582912,
  "project_id": "PS-047",
  "source": "desktop-companion",
  "qr_placement": "bottom_right_first_page"
}
```

Response includes the QR code image (base64) for the Desktop Companion to embed locally, avoiding a round-trip of the full PDF to the server.

**GET /v1/stamps/check-hash/{hash}**

Quick check if a document hash matches any existing stamp. Used by extensions to detect if a document is already stamped without needing to parse QR codes.

**GET /v1/user/tokens**

Check remaining stamp tokens. Extensions display this in their UI.

**POST /v1/webhooks/bluebeam**

Webhook receiver for Bluebeam Studio events. Validates webhook signature, processes events asynchronously.

---

## PART 4: DISTRIBUTION AND INSTALLATION

### Bluebeam Integration

**Distribution:** No client-side installation needed. The integration is entirely server-side (webhooks + API). Configuration happens in the StampLedger portal.

**Onboarding flow:**
1. PE logs into StampLedger portal
2. Goes to Settings → Integrations → Bluebeam
3. Clicks "Connect Bluebeam Account"
4. OAuth redirect to Bluebeam → authorize → redirect back
5. Select which Studio Projects to monitor
6. Configure auto-stamp rules
7. Done — stamps happen automatically from this point

### Adobe Acrobat Extension

**Distribution options:**

1. **Direct download from portal:**
   - User logs into StampLedger portal
   - Goes to Settings → Integrations → Adobe Acrobat
   - Downloads `StampLedger.js` file
   - Copies to JavaScripts folder (instructions provided per OS)
   - Restarts Acrobat

2. **One-click installer:**
   - Download `.exe` (Windows) or `.pkg` (Mac) from portal
   - Installer copies `StampLedger.js` to correct location
   - Detects Acrobat version and adjusts path accordingly
   - Includes Desktop Companion installation option

3. **Enterprise deployment (MSI/SCCM):**
   - Provide MSI package for IT departments
   - Silent install via Group Policy or SCCM
   - Pre-configured with organization API endpoint
   - Token provisioning via admin console

### Desktop Companion

**Distribution:** Separate download from portal or bundled with Acrobat extension installer.

**Supported platforms:**
- Windows 10/11 (x64) — Electron or .NET native
- macOS 12+ (Universal) — Electron or Swift native

**Auto-update:** Built-in update mechanism (Squirrel for Electron, Sparkle for native Mac).

---

## PART 5: IMPLEMENTATION ROADMAP

### Phase 1: Bluebeam Studio Integration (Weeks 1-4)

**Week 1: Foundation**
- [ ] Register on Bluebeam Developer Portal
- [ ] Create OAuth 2.0 application
- [ ] Build OAuth flow in StampLedger portal (connect/disconnect)
- [ ] Build token storage and refresh logic

**Week 2: Webhook Infrastructure**
- [ ] Build webhook receiver endpoint
- [ ] Implement webhook signature validation
- [ ] Handle `document.uploaded` event
- [ ] Implement document download from Bluebeam Studio API

**Week 3: Stamping Pipeline**
- [ ] Connect webhook to existing stamp creation flow
- [ ] Build auto-stamp rule engine (folder-based, session-based, manual)
- [ ] Build stamped PDF upload back to Bluebeam Studio
- [ ] Implement duplicate detection (same hash = skip)

**Week 4: Configuration UI and Testing**
- [ ] Build Integrations → Bluebeam settings page in portal
- [ ] Project selection and monitoring configuration
- [ ] Auto-stamp rule configuration
- [ ] End-to-end testing with real Bluebeam Studio account
- [ ] Error handling and notification flow

### Phase 2: Adobe Acrobat JavaScript Extension (Weeks 5-7)

**Week 5: Core Extension**
- [ ] Write StampLedger.js with menu items and toolbar button
- [ ] Implement authentication flow (browser OAuth + token paste)
- [ ] Implement "Verify This Document" (metadata check + launchURL)
- [ ] Implement "Stamp This Document" (redirect to portal quick-stamp page)
- [ ] Test on Acrobat Pro DC (Windows + Mac)

**Week 6: Quick-Stamp Portal Page**
- [ ] Build `/stamp/quick` page in portal optimized for extension redirect flow
- [ ] Accept pre-authenticated token from extension
- [ ] File upload + immediate stamping + download stamped version
- [ ] Return control to Acrobat (reopen stamped document)

**Week 7: Polish and Distribution**
- [ ] Build download page in portal with per-OS instructions
- [ ] Build one-click installer (Windows .exe, Mac .pkg)
- [ ] Test installation on clean machines
- [ ] Write user documentation

### Phase 3: Desktop Companion (Weeks 8-10)

**Week 8: Core Application**
- [ ] Build system tray application (Electron)
- [ ] Implement local SHA-256 hashing of PDF files
- [ ] Implement StampLedger API integration (stamp from hash, verify)
- [ ] Build right-click context menu integration (Windows shell extension)

**Week 9: QR Embedding and Acrobat Communication**
- [ ] Implement local QR code embedding using pdf-lib
- [ ] Build OLE/DDE communication with Acrobat (Windows)
- [ ] Build AppleScript communication with Acrobat (Mac)
- [ ] Auto-reload document in Acrobat after stamping

**Week 10: Installer and Auto-Update**
- [ ] Build combined installer (Extension + Companion)
- [ ] Implement auto-update mechanism
- [ ] Test on Windows 10, Windows 11, macOS 12+, macOS 14+
- [ ] Build enterprise MSI package

### Phase 4: Advanced Features (Weeks 11-12)

- [ ] Bluebeam Session integrity monitoring (bid document control)
- [ ] Verification analytics integration (track verifications from extensions)
- [ ] Batch stamping from Desktop Companion (select multiple PDFs, stamp all)
- [ ] Organization-wide deployment dashboard (admin sees which users have extensions installed)
- [ ] Bluebeam markup annotation with stamp details (visible in Bluebeam's markup list)

---

## PART 6: COMPETITIVE POSITIONING

### What Exists Today

**Adobe Sign / DocuSign:** Digital signatures, not PE stamp verification. They prove WHO signed, not that the DOCUMENT hasn't been altered since signing. No blockchain, no license verification, no insurance check, no multi-jurisdiction support.

**Bluebeam Digital Signatures:** Built-in PKI-based signatures. Prove document integrity within Bluebeam's ecosystem. Don't verify PE license status, don't check insurance, aren't queryable by inspectors in the field, and don't provide a public verification endpoint.

**State Board Websites:** Manual lookup of PE license status. No document-level verification. No integration with any tools. 2-3 day response time for formal verification requests.

### StampLedger's Advantage

1. **Stamps + License + Insurance in one verification.** Nobody else does this. DocuSign tells you who signed. StampLedger tells you who signed, that their license was active when they signed, that they had professional liability insurance when they signed, and that the document hasn't been modified since they signed. One scan.

2. **Works where the documents already are.** Bluebeam integration means engineers don't change their workflow. Adobe extension means reviewers don't change their workflow. QR codes mean inspectors don't need any software at all.

3. **Blockchain immutability is the unlock for government trust.** Municipalities care about auditability and legal defensibility. A blockchain record that can't be altered or backdated is categorically different from a database entry that could theoretically be modified. The court-admissible claim on the landing page is the value proposition for government buyers.

4. **Token model aligns incentives.** Engineers pay per stamp (like they pay for their PE seal). Municipalities pay nothing to verify (removes adoption friction on the verification side). The network effect is built in — every PE who stamps creates value for every inspector who verifies.

---

## COST ESTIMATES

| Component | Estimated Cost | Notes |
|-----------|---------------|-------|
| Bluebeam Developer Portal access | Free | Requires partner application |
| Bluebeam integration development | 80-120 hours | OAuth, webhooks, API integration |
| Adobe JS extension development | 40-60 hours | JavaScript, installer, testing |
| Desktop Companion development | 60-80 hours | Electron app, shell integration |
| Combined installer/distribution | 20-30 hours | Platform-specific packaging |
| Adobe Acrobat Pro license (dev) | $240/year | For testing |
| Bluebeam Revu license (dev) | $300/year | For testing |
| Total development time | 200-290 hours | Approximately 5-7 weeks full-time |
| Total external costs | ~$600/year | Dev licenses only |

---

## SUCCESS METRICS

- **Bluebeam:** Number of organizations connected, documents auto-stamped per month, webhook processing latency < 30 seconds
- **Adobe:** Extension downloads, active installations (phone-home on launch for count), stamps created via extension
- **Desktop Companion:** Installations, daily active users, stamps created via context menu
- **Overall:** Percentage of stamps created through extensions vs. portal (target: 60% via extensions within 6 months of launch)

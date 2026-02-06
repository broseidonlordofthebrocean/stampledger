# StampLedger QR Verification System
## Detailed Technical Specification — February 2026

---

## EXECUTIVE SUMMARY

The QR Verification System is StampLedger's primary verification mechanism — the fastest path from "stamped document" to "verified document" with zero software installation required. An engineer stamps a document through the StampLedger portal, a QR code is embedded in the PDF, and any inspector anywhere can scan it with their phone camera to get an instant verification result. No app download. No account creation. No training. Point, scan, verified.

This system must be production-ready before the Bluebeam/Adobe extensions because it works universally — any PDF viewer, any device, any jurisdiction.

---

## SYSTEM ARCHITECTURE

### Overview

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   PE STAMPS DOC     │     │   STAMPLEDGER API     │     │  INSPECTOR VERIFIES │
│                     │     │                      │     │                     │
│ 1. Upload PDF       │────▶│ 3. Hash document     │     │ 7. Scan QR code     │
│ 2. Sign digitally   │     │ 4. Record on chain   │     │ 8. GET /verify/{id} │
│                     │     │ 5. Generate QR       │◀────│ 9. See result       │
│                     │◀────│ 6. Embed QR in PDF   │     │                     │
│ Download stamped PDF│     │    Return stamped PDF │     │                     │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
```

### Components

**1. Document Hashing Service**
- Accepts PDF upload from portal (existing Create Stamp flow)
- Computes SHA-256 hash of the entire PDF binary
- Stores hash in StampLedger blockchain via Stamp Module
- Returns stamp ID, transaction hash, and timestamp

**2. QR Code Generator**
- Generates QR code containing verification URL: `https://stampledger.com/verify/{stamp_id}`
- QR must encode enough data for offline-capable verification (see Offline Mode below)
- QR size: minimum 1.5" x 1.5" at 300 DPI for reliable scanning
- Error correction level: H (30% — highest, survives partial damage/printing artifacts)
- Color: Black on white background with StampLedger shield icon in center (logo insertion uses the 30% error correction headroom)

**3. PDF Embedder**
- Inserts QR code into the stamped PDF
- Placement options (configurable per organization):
  - Bottom-right corner of first page (default)
  - Bottom-right corner of every page
  - Dedicated stamp page appended to document
  - Custom location (x,y coordinates specified by PE)
- Adjacent to QR code, embed human-readable text:
  - "Verified by StampLedger"
  - Stamp ID (short form): `SL-2026-00047`
  - PE Name and License #
  - Timestamp
  - `stampledger.com/verify/SL-2026-00047`
- The QR block must not obscure existing document content — if the target area contains content, shift to next available position or append a stamp page

**4. Verification Endpoint**
- Public REST endpoint: `GET https://api.stampledger.com/v1/verify/{stamp_id}`
- No authentication required (this is the whole point — anyone can verify)
- Rate limited: 100 requests/minute per IP (prevent abuse without blocking legitimate use)
- Returns verification result (see Response Schema below)

**5. Verification Web Page**
- `https://stampledger.com/verify/{stamp_id}`
- Mobile-optimized landing page showing verification result
- Loads in under 2 seconds on 3G connection
- No JavaScript required for basic result display (server-rendered HTML)
- Shows: Valid/Invalid/Expired/Revoked status, PE details, license status, insurance status, blockchain transaction, timestamp, document hash

---

## DETAILED FLOWS

### Flow 1: Stamping a Document (PE Side)

**Preconditions:** PE has active StampLedger account, verified license, stamp tokens available.

1. PE navigates to portal → Create Stamp (or Batch Stamp)
2. PE uploads PDF document(s) — accepts PDF, DWG converted to PDF, images converted to PDF
3. Portal displays document preview with proposed QR placement
4. PE selects project association (existing project or create new)
5. PE selects specification linkage (if applicable)
6. PE confirms stamp — this triggers:
   a. Document is hashed (SHA-256 of binary PDF content)
   b. Hash is submitted to StampLedger blockchain as a `MsgCreateStamp` transaction
   c. Transaction includes: document hash, PE's public key, license number, jurisdiction, timestamp
   d. Blockchain returns transaction hash and block height
   e. QR code is generated encoding the verification URL + stamp metadata
   f. QR code is embedded in the PDF at specified location
   g. The stamped PDF (with QR) is re-hashed and this final hash is stored as the canonical document hash
   h. Stamp token is deducted from PE's balance
   i. Stamped PDF is available for download and stored in Documents section
7. PE downloads stamped PDF and delivers to municipality/client

**Critical detail on step 6g:** The canonical hash must be of the FINAL PDF that includes the QR code. If you hash the original PDF and then modify it to add the QR code, the hash no longer matches the document. The flow is: upload original → embed QR → hash the QR-embedded version → record that hash on chain. The verification endpoint compares against this final hash.

### Flow 2: Verifying a Document (Inspector Side)

**Preconditions:** Inspector has a smartphone with a camera. That's it.

1. Inspector receives stamped PDF (email, plan room, Bluebeam session, paper printout)
2. Inspector opens phone camera and points at QR code
3. Phone recognizes URL and opens `stampledger.com/verify/{stamp_id}`
4. Verification page loads and displays:

**If VALID:**
```
✅ VALID STAMP

PE Name:        John Smith, PE
License #:      WI-12345
State:          Wisconsin
Status:         Active
Insurance:      Verified (expires 12/2026)
Stamped:        Feb 5, 2026 at 11:18 PM CST
Document:       PS-047 Westheimer Pump Station - Electrical Plans
Project:        PS-047 Westheimer Pump Station
Blockchain TX:  0x45df36ba121a4cff...a42c1c4db34c2a47
Block:          #14,892

[View Full Certificate]  [Download Verification PDF]
```

**If INVALID:**
```
❌ INVALID STAMP

This stamp could not be verified. Possible reasons:
- The document has been modified after stamping
- The stamp ID does not exist in the StampLedger network
- The QR code has been copied from another document

Contact StampLedger support if you believe this is an error.
Reference: SL-ERR-2026-00891
```

**If REVOKED:**
```
⚠️ REVOKED STAMP

This stamp was revoked by the issuing PE.

PE Name:        John Smith, PE
License #:      WI-12345
Revoked:        Feb 10, 2026 at 3:45 PM CST
Reason:         Design revision supersedes this document
Original Stamp: Feb 5, 2026 at 11:18 PM CST

This document should NOT be used for construction or permitting.
```

**If LICENSE EXPIRED/SUSPENDED:**
```
⚠️ STAMP VALID — LICENSE ALERT

The stamp was valid when created, but the PE's license status has changed.

PE Name:        John Smith, PE
License #:      WI-12345
Stamp Status:   Valid (created Feb 5, 2026)
License Status: EXPIRED (expired Jan 31, 2026)

The document was stamped while the license was active.
Current license status should be verified with the state board.
```

### Flow 3: Document Integrity Verification (Re-verification)

This flow handles the case where someone wants to verify not just that a stamp exists, but that the specific document they have hasn't been altered.

1. Inspector/reviewer navigates to `stampledger.com/verify`
2. Uploads the PDF they have in their possession
3. System computes SHA-256 hash of the uploaded PDF
4. System compares against the canonical hash stored on-chain for the stamp ID embedded in the QR
5. If hashes match: "This document is identical to the original stamped version"
6. If hashes don't match: "This document has been modified since it was stamped. The stamp is no longer valid for this version."

This is the tamper-detection feature that makes StampLedger fundamentally different from a wet signature or a simple digital signature — you can prove the document hasn't been altered by a single byte since it was stamped.

---

## API SPECIFICATION

### Public Endpoints (No Auth Required)

**GET /v1/verify/{stamp_id}**

Verify a stamp by its ID.

Response (200):
```json
{
  "stamp_id": "SL-2026-00047",
  "status": "valid",
  "pe": {
    "name": "John Smith, PE",
    "license_number": "WI-12345",
    "state": "WI",
    "license_status": "active",
    "license_expiry": "2027-06-30",
    "disciplines": ["civil", "environmental"],
    "insurance_status": "verified",
    "insurance_expiry": "2026-12-31"
  },
  "document": {
    "title": "Electrical Plans - PS-047",
    "hash": "45df36ba121a4cff...a42c1c4db34c2a47",
    "hash_algorithm": "sha256",
    "stamped_at": "2026-02-05T23:18:00Z",
    "file_type": "application/pdf",
    "page_count": 24
  },
  "blockchain": {
    "network": "stampledger-mainnet-1",
    "tx_hash": "0x45df36ba121a4cff...a42c1c4db34c2a47",
    "block_height": 14892,
    "block_time": "2026-02-05T23:18:05Z",
    "validator": "stampledger-validator-1"
  },
  "project": {
    "name": "PS-047 Westheimer Pump Station",
    "project_id": "PS-047",
    "organization": "Acme Engineering Group"
  },
  "verification_url": "https://stampledger.com/verify/SL-2026-00047",
  "certificate_url": "https://stampledger.com/verify/SL-2026-00047/certificate.pdf"
}
```

Response (404):
```json
{
  "error": "stamp_not_found",
  "message": "No stamp found with ID SL-2026-99999",
  "reference": "SL-ERR-2026-00891"
}
```

**POST /v1/verify/document**

Verify a document by uploading it and comparing its hash.

Request: `multipart/form-data` with PDF file
Response (200):
```json
{
  "document_hash": "45df36ba121a4cff...a42c1c4db34c2a47",
  "match": true,
  "stamp": { /* same as GET response above */ },
  "integrity": "Document is identical to the original stamped version"
}
```

Response (200, no match):
```json
{
  "document_hash": "99ab12cd34ef56gh...different_hash",
  "match": false,
  "closest_stamp": {
    "stamp_id": "SL-2026-00047",
    "original_hash": "45df36ba121a4cff...a42c1c4db34c2a47",
    "stamped_at": "2026-02-05T23:18:00Z"
  },
  "integrity": "Document has been modified since stamping. The embedded stamp is no longer valid for this version."
}
```

### Authenticated Endpoints (PE/Organization)

**POST /v1/stamps**

Create a new stamp. Requires valid auth token.

Request:
```json
{
  "document": "<base64 encoded PDF or multipart upload>",
  "project_id": "PS-047",
  "specification_ids": ["SP-E-001"],
  "qr_placement": "bottom_right_first_page",
  "qr_custom_position": null,
  "discipline": "electrical",
  "notes": "Electrical plans for pump station rehabilitation"
}
```

Response (201):
```json
{
  "stamp_id": "SL-2026-00048",
  "status": "valid",
  "document_hash": "...",
  "tx_hash": "0x...",
  "block_height": 14893,
  "stamped_pdf_url": "https://portal.stampledger.com/documents/SL-2026-00048.pdf",
  "tokens_remaining": 46,
  "tokens_used": 1
}
```

**POST /v1/stamps/batch**

Batch stamp multiple documents. Uses Batch Stamp flow from portal.

**POST /v1/stamps/{stamp_id}/revoke**

Revoke a stamp. Only the issuing PE or organization admin can revoke.

```json
{
  "reason": "Design revision supersedes this document",
  "superseded_by": "SL-2026-00052"
}
```

---

## QR CODE SPECIFICATION

### Data Encoding

The QR code encodes a URL with embedded verification data:

```
https://stampledger.com/v/SL2026047?h=45df36ba&s=a7b3c9
```

Breakdown:
- `/v/` — short verification path (saves QR density)
- `SL2026047` — compact stamp ID
- `h=45df36ba` — first 8 characters of document hash (quick check)
- `s=a7b3c9` — HMAC signature of the stamp ID (prevents forged QR codes pointing to valid stamps for different documents)

The short hash `h` parameter enables a quick client-side check: if the document hash doesn't start with `45df36ba`, the document has been modified — no server roundtrip needed. The full verification still hits the API for comprehensive checking.

### QR Visual Design

```
┌─────────────────────────────────────────┐
│                                         │
│   ┌───────────────┐                     │
│   │               │  Verified by        │
│   │   QR CODE     │  StampLedger        │
│   │   with logo   │                     │
│   │   center      │  SL-2026-00047      │
│   │               │  John Smith, PE     │
│   └───────────────┘  WI-12345           │
│                      Feb 5, 2026        │
│                                         │
│   stampledger.com/verify/SL-2026-00047  │
│                                         │
└─────────────────────────────────────────┘
```

- QR code: 1.5" x 1.5" minimum
- Total stamp block: approximately 3.5" x 2"
- Border: 1px solid #1a3a4a (StampLedger dark blue)
- Background: white
- Text: 8pt for details, 6pt for URL
- The block must include human-readable information for cases where QR scanning isn't possible (phone dead, paper copy in a filing cabinet, etc.)

### QR Generation Library

Use `qrcode` (Python) or `qrcode-generator` (Node.js) with:
- Error correction: `ERROR_CORRECT_H` (30%)
- Module size: minimum 4px at 300 DPI
- Quiet zone: 4 modules (standard)
- Center logo: StampLedger shield, max 20% of QR area

### PDF Embedding

Use `pdf-lib` (Node.js) or `PyPDF2`/`reportlab` (Python) to embed the QR block:

1. Load the original PDF
2. Get page dimensions of target page
3. Calculate QR block position based on placement setting
4. Check for existing content at target position (basic check — if page has content below y=100pt, append stamp page instead)
5. Draw QR image + text block
6. Save modified PDF
7. Compute SHA-256 of final PDF
8. This hash becomes the canonical document hash

---

## OFFLINE VERIFICATION MODE

For inspectors in areas without cell service (construction sites, rural municipalities):

### Approach: Signed QR Data

Encode enough data in the QR code itself to perform basic verification without an internet connection:

```
stampledger://v1/SL2026047/45df36ba121a4cff/WI-12345/JohnSmithPE/20260205T231800Z/ACTIVE/sig=a7b3c9d4e5f6
```

This contains:
- Stamp ID
- Document hash (full)
- License number
- PE name (URL encoded)
- Timestamp
- License status at time of stamping
- ECDSA signature of all fields using StampLedger's signing key

A mobile app (or even a progressive web app cached for offline use) can:
1. Scan the QR code
2. Parse the embedded data
3. Verify the ECDSA signature against StampLedger's public key (embedded in the app)
4. Display the stamp details with a note: "Verified offline — connect to internet for real-time license status"

The signature prevents forgery — you can't create a valid QR code without StampLedger's private signing key, even if you know the data format.

### Limitations of Offline Mode
- Cannot verify current license status (may have been suspended since stamping)
- Cannot verify current insurance status
- Cannot verify document integrity (would need the full document hash comparison)
- Signature verification proves the QR was generated by StampLedger, not that the document hasn't been swapped

Offline mode should always display: "For full verification including document integrity and current license status, scan again when connected to the internet."

---

## VERIFICATION CERTIFICATE

When a verification is performed, the system can generate a PDF certificate suitable for inclusion in project files:

**Verification Certificate Contents:**
- StampLedger header and branding
- "Certificate of Stamp Verification"
- Unique certificate ID
- Stamp details (all fields from verification result)
- Date and time of verification
- IP address or device identifier of verifier (for audit trail)
- QR code linking back to the live verification page
- Statement: "This certificate confirms that the referenced document was verified against the StampLedger blockchain on [date]. This verification is a point-in-time check — verify again for current status."
- Digital signature of the certificate itself

This certificate can be attached to permit applications, filed with construction documents, or included in project close-out packages.

---

## SECURITY CONSIDERATIONS

### QR Code Forgery Prevention
- The HMAC signature parameter (`s=`) in the QR URL prevents creating QR codes that point to valid stamps for different documents
- Even if someone extracts a valid QR code and pastes it onto a different document, the document integrity check (Flow 3) will fail because the hashes won't match
- The offline signature uses ECDSA with StampLedger's private key — cannot be forged without key compromise

### Document Hash Integrity
- SHA-256 is collision-resistant — finding two documents with the same hash is computationally infeasible
- The hash is of the complete PDF binary, not just the visible content — metadata changes, annotation additions, or any byte-level modification will produce a different hash
- This means printing a stamped PDF and scanning it back will NOT verify — the hash will be different. This is a feature, not a bug: the integrity guarantee only applies to the original digital file

### Rate Limiting
- Public verification endpoint: 100 requests/minute per IP
- Document upload verification: 10 requests/minute per IP (compute-intensive)
- Authenticated stamp creation: governed by token balance
- All rate limits return 429 with `Retry-After` header

### Privacy
- The public verification endpoint reveals PE name, license number, and project name — this is intentional, as PE stamps are public records
- Document content is never exposed through the verification endpoint — only the hash
- Organization details are visible only to the extent the organization has configured public visibility

---

## INTEGRATION WITH EXISTING PORTAL

### Changes to Current Create Stamp Flow

The existing portal Create Stamp flow (visible in screenshots) needs these additions:

1. **After stamp creation:** Add QR generation and PDF embedding step
2. **Document download:** Stamped PDF with embedded QR replaces original in Documents section
3. **Stamp detail view:** Show QR code preview and verification URL
4. **Stamps list:** Add "Copy Verification Link" action per stamp

### Changes to Current Dashboard

1. **New metric card:** "Verifications This Month" — how many times stamps have been scanned
2. **Recent Activity:** Include verification events ("PS-047 Electrical Plans verified by [IP/location]")
3. **Compliance Attention:** Alert if a stamp has been verified against a modified document (potential tampering)

### New Portal Pages

**Verification Analytics** (under Dashboard → View all metrics):
- Total verifications by time period
- Verifications by project
- Verifications by stamp
- Geographic distribution of verifications (by IP geolocation)
- Failed verifications (potential tampering attempts)
- Average time between stamping and first verification

---

## IMPLEMENTATION PLAN

### Phase 1: Core QR System (Week 1-2)

- [ ] Build QR code generation service (input: stamp data, output: QR image)
- [ ] Build PDF embedding service (input: PDF + QR image + placement config, output: stamped PDF)
- [ ] Build public verification API endpoint (`GET /v1/verify/{stamp_id}`)
- [ ] Build verification web page (mobile-optimized, server-rendered)
- [ ] Integrate QR generation into existing Create Stamp flow
- [ ] Update Documents section to serve stamped PDFs with QR

### Phase 2: Document Integrity (Week 3)

- [ ] Build document upload verification endpoint (`POST /v1/verify/document`)
- [ ] Build document upload UI on verification page
- [ ] Implement hash comparison logic with clear pass/fail messaging
- [ ] Add "Verify Document Integrity" option to portal for existing stamps

### Phase 3: Certificates and Analytics (Week 4)

- [ ] Build verification certificate PDF generator
- [ ] Add verification analytics to portal dashboard
- [ ] Implement verification event logging
- [ ] Add "Copy Verification Link" to stamps list
- [ ] Add verification counter to stamp detail view

### Phase 4: Offline Mode (Week 5-6)

- [ ] Implement ECDSA signing for QR data
- [ ] Build extended QR encoding with embedded verification data
- [ ] Build progressive web app for offline QR scanning
- [ ] Test offline verification flow on iOS and Android

### Phase 5: Batch and Advanced (Week 7-8)

- [ ] Batch stamp QR embedding (multiple documents in one operation)
- [ ] Custom QR placement configuration per organization
- [ ] API documentation and developer portal page
- [ ] Webhook notifications for verification events (notify PE when their stamps are verified)

---

## TECHNOLOGY CHOICES

| Component | Technology | Reason |
|-----------|-----------|--------|
| QR Generation | `qrcode` (Python) or `qr-code-styling` (Node.js) | Logo embedding, high error correction, fast |
| PDF Manipulation | `pdf-lib` (Node.js) or `reportlab` + `PyPDF2` (Python) | Page manipulation without re-rendering |
| Verification Page | Server-rendered HTML (Go templates or Next.js SSR) | Fast load on 3G, no client JS required |
| Hashing | Native `crypto` (SHA-256) | Standard, fast, no dependencies |
| Offline Signing | ECDSA P-256 | Web Crypto API compatible, compact signatures |
| Certificate PDF | `reportlab` (Python) or `pdf-lib` (Node.js) | Professional layout with branding |

---

## SUCCESS METRICS

- **Time to verify:** < 3 seconds from scan to result (target on landing page)
- **Verification page load:** < 2 seconds on 3G
- **QR scan success rate:** > 95% on first attempt (adequate size + error correction)
- **Adoption metric:** > 50% of stamps are verified at least once within 30 days
- **Integrity catches:** Track any document integrity failures (potential fraud detection)

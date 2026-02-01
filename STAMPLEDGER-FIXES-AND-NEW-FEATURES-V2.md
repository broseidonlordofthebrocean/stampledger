# STAMPLEDGER — FIXES & NEW FEATURES SPEC v2
## Claude Code Implementation Guide

**Date:** January 31, 2026  
**Based on:** Actual source code from uploaded zip  
**Replaces:** Previous spec (which was written from memory — this one has exact line references)

---

# WHAT'S IN THIS ZIP (actual structure)

```
/
├── .claude/settings.local.json          ← Claude Code permissions (pe-portal + stampledger-api paths)
├── landing/                             ← Next.js 14 marketing site (deployed to stampledger.com)
│   ├── app/
│   │   ├── page.tsx                     ← Homepage (370 lines)
│   │   ├── about/page.tsx
│   │   ├── for-engineers/page.tsx
│   │   ├── for-municipalities/page.tsx
│   │   ├── how-it-works/page.tsx
│   │   ├── pricing/page.tsx
│   │   └── api/subscribe/route.ts       ← Email capture backend
│   ├── package.json                     ← Next 14.1, Resend, Lucide, CVA (NO shadcn)
│   └── wrangler.toml                    ← Deployed on Cloudflare Pages
├── chain/                               ← Cosmos SDK blockchain node
│   ├── app/app.go                       ← StampledgerchainKeeper IS registered
│   ├── app/app_config.go                ← stampledgerchain module IS in depinject config
│   ├── docker-compose.yml               ← Chain + cloudflared tunnel
│   ├── cloudflare-tunnel.yml            ← Routes: rpc/api/grpc.stampledger.com
│   └── config.yml                       ← Ignite chain config (3 validators, sovereign)
├── api gateway/                         ← Cloudflare Worker (TypeScript)
│   └── src/index.ts                     ← CORS proxy to chain RPC
├── docs/                                ← All spec docs
├── marketing/website/                   ← Original landing page Claude Code spec
└── scripts/                             ← Deploy scripts for all 3 components
```

**NOT in this zip (lives on your WSL machine per .claude/settings.local.json):**
- `~/projects/pe-portal/` — SvelteKit app (has register + verify routes)
- `~/projects/stampledger-api/` — Go API server (has handlers/stamps.go, blockchain/client.go)
- `~/projects/stampledger-chain/x/stampledgerchain/` — The actual module source

---

# PART 1: EXACT ISSUES & FIXES (with line numbers)

---

## Issue 1: Broken footer links

The layout imports a Footer component (not in this zip, lives in `components/Footer.tsx` on disk). That footer links to `/privacy`, `/terms`, `/docs`, and `/api` — none of which have pages. Also: Next.js reserves `/api/` for API routes, so the footer link to `/api` needs to become `/api-reference`.

**Fix:** Create 3 new pages + update the footer link. See Task 1 below.

---

## Issue 2: Email signup silently swallows failures

**File:** `landing/app/api/subscribe/route.ts`

The route checks `if (process.env.RESEND_API_KEY)` — if that env var is missing on Cloudflare Pages, it falls through to a `console.log()` and returns `{ success: true }`. The user sees a thank you. Nothing is actually stored or sent.

**Fix:** Replace the else block. Exact target:

```typescript
// FIND (this exact block):
    } else {
      // Log to console if no email service configured
      console.log('New signup:', { email, org, role, timestamp: new Date().toISOString() })
    }

// REPLACE WITH:
    } else {
      return NextResponse.json(
        { error: 'Email service not configured. Please contact hello@stampledger.com directly.' },
        { status: 503 }
      )
    }
```

Also: confirm `RESEND_API_KEY` and `RESEND_AUDIENCE_ID` are actually set in your Cloudflare Pages environment variables. The `.env.example` has placeholders (`re_xxxxx`) — if those made it to production that's the problem.

---

## Issue 3: False claims — exact locations

### 3A: "SOC 2 Type II certified" — appears in TWO files

**File 1:** `landing/app/page.tsx` line 264
```typescript
// FIND:
                SOC 2 Type II certified. GDPR compliant. Ready for government
                contracts and procurement requirements.
// REPLACE WITH:
                Designed for SOC 2 compliance. GDPR compliant. Built to meet
                government contracts and procurement requirements.
```

**File 1 again:** `landing/app/page.tsx` line 355 (trust badges row)
```typescript
// FIND:
              <span className="font-medium">SOC 2 Compliant</span>
// REPLACE WITH:
              <span className="font-medium">SOC 2 Ready</span>
```

**File 2:** `landing/app/how-it-works/page.tsx` line 274
```typescript
// FIND:
                  <span>SOC 2 Type II certified</span>
// REPLACE WITH:
                  <span>SOC 2 ready</span>
```

### 3B: "99.9% Uptime" — no product running yet

**File:** `landing/app/page.tsx` line 363
```typescript
// FIND:
              <span className="font-medium">99.9% Uptime</span>
// REPLACE WITH:
              <span className="font-medium">High Availability</span>
```

### 3C: "iOS and Android apps... Works offline"

**File:** `landing/app/page.tsx` line 280
```typescript
// FIND:
                iOS and Android apps for field verification. Works offline
                with cached recent stamps.
// REPLACE WITH:
                Mobile-first verification for inspectors. Apps coming Q3 2026.
```

### 3D: "Limited pilot spots available" scarcity badge

**File:** `landing/app/for-municipalities/page.tsx` lines 266–268
```typescript
// FIND (delete this entire div):
              <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                Limited pilot spots available
              </div>
// DELETE IT — remove all 4 lines
```

---

## Issue 4: No stamp upload exists anywhere

The marketing site describes a 4-step flow (upload → details → sign → download). The pe-portal on your machine has `/register` and `/verify` but no stamp creation flow. This is the main missing product functionality. See Task 2.

---

## Issue 5: Chain module is registered but source not in zip

`app.go` imports `stampledger-chain/x/stampledgerchain/keeper` and `app_config.go` registers it in depinject. The module scaffold exists on your machine but wasn't included here. The API gateway's `/stamps` route already points to `/abci_query?path="/stampledgerchain/stamps"` — so if the module has the keeper implemented, the query path is correct. If it's still boilerplate from `ignite scaffold`, those queries will return empty.

---

## Issue 6: API gateway has no auth, no document endpoints, no spec endpoints

**File:** `api gateway/src/index.ts`

The gateway currently handles:
- `/health` — health check
- `/rpc/*` — proxy to chain Tendermint RPC
- `/chain/status` — proxy to `/status`
- `/query/*` — proxy to `/abci_query`
- `/tx/broadcast` — proxy to `/broadcast_tx_sync`
- `/stamps` or `/stamps/*` — proxy to stampledgerchain module queries

Missing entirely:
- No `/auth/*` routes (login/register handled by the Go API directly, not through this gateway — that's fine)
- No `/documents/*` routes (needed for IPFS upload)
- No `/specs/*` routes (needed for spec tracker)
- Rate limiting is declared in wrangler.toml comments but not implemented in the code

The Go API (`stampledger-api`) is the right place for auth + document upload + spec tracking since it needs server-side logic. The Cloudflare Worker gateway is just for proxying to the chain RPC. That architecture is correct — don't try to put document upload logic in the Worker.

---

# PART 2: NEW PAGE CODE FOR CLAUDE CODE

---

## Task 1: Landing site fixes (Next.js — `landing/`)

### 1A: Create `landing/app/privacy/page.tsx`

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | StampLedger',
  description: 'How StampLedger collects, uses, and protects your data.',
}

export default function Privacy() {
  return (
    <div>
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-primary mb-4">Privacy Policy</h1>
            <p className="text-gray-500 text-sm">Last updated: January 31, 2026</p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto space-y-8 text-gray-700">

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">What We Collect</h2>
              <p className="mb-3">
                When you sign up for our beta waitlist, we collect your email address,
                organization name (optional), and role (optional). When using the
                StampLedger platform, we collect data necessary to create and verify
                PE stamps — document hashes, digital signatures, and professional
                license information. We never store full document contents on our
                servers. Only cryptographic hashes are recorded.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">How We Use It</h2>
              <p>
                We use collected data to send launch updates, communicate about the
                beta program, improve the product based on feedback, and provide the
                stamp verification service. We do not sell your data or share it with
                third parties except as required to operate the service (e.g., Resend
                for email delivery).
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">Data Storage & Security</h2>
              <p>
                Waitlist signups are stored via Resend, a GDPR-compliant email
                service. PE stamp records are stored on a permissioned blockchain —
                this data is immutable by design and contains no personally
                identifiable information beyond what is necessary for professional
                verification. All data in transit is protected by TLS 1.3. Data at
                rest is encrypted with AES-256.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">Your Rights</h2>
              <p className="mb-3">
                You can request a copy of your data, request removal from our
                waitlist, or unsubscribe via the link in any email we send. Note:
                blockchain records are immutable and cannot be deleted, but they
                contain no PII. To exercise these rights, email{' '}
                <a href="mailto:privacy@stampledger.com" className="text-secondary hover:underline">
                  privacy@stampledger.com
                </a>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">Cookies</h2>
              <p>
                We use minimal cookies for analytics only. No tracking cookies or
                third-party ad networks. You can disable cookies in your browser
                without affecting site functionality.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">Changes</h2>
              <p>
                If we update this policy, we'll notify waitlist subscribers via email.
                The date at the top of this page reflects the most recent version.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">Contact</h2>
              <p>
                Questions?{' '}
                <a href="mailto:privacy@stampledger.com" className="text-secondary hover:underline">
                  privacy@stampledger.com
                </a>
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
```

### 1B: Create `landing/app/terms/page.tsx`

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | StampLedger',
  description: 'StampLedger terms of service and usage agreement.',
}

export default function Terms() {
  return (
    <div>
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-primary mb-4">Terms of Service</h1>
            <p className="text-gray-500 text-sm">Last updated: January 31, 2026</p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto space-y-8 text-gray-700">

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">1. Acceptance</h2>
              <p>
                By using StampLedger or signing up for our waitlist, you agree to
                these terms. If you don't agree, don't use the service.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">2. What We Provide</h2>
              <p>
                A blockchain-based platform for creating and verifying professional
                engineer stamps, including digital stamp creation for licensed PEs,
                instant verification for municipalities, document storage, version
                tracking, and QR code generation.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">3. Your Responsibilities</h2>
              <p>
                You must hold a valid, active PE license in the relevant jurisdiction
                to create stamps. You are responsible for the accuracy of all
                documents you stamp. You must not use StampLedger to create stamps
                for documents you have not personally reviewed. You must not attempt
                to forge another PE's credentials. You must maintain the security of
                your account and private keys.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">4. Intellectual Property</h2>
              <p>
                StampLedger and all associated logos and marks are our intellectual
                property. Documents you upload remain yours. Blockchain records are
                public and immutable.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">5. Limitation of Liability</h2>
              <p>
                StampLedger is a verification tool, not a substitute for legal advice
                or engineering review. Professional responsibility remains with the
                licensed engineer. To the extent permitted by law, we are not liable
                for indirect, incidental, or consequential damages.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">6. Termination</h2>
              <p>
                We may suspend your account for terms violations. You may cancel
                anytime. Blockchain records created during your use are permanent.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">7. Governing Law</h2>
              <p>
                These terms are governed by Wisconsin law. Disputes resolved in
                Wisconsin courts.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-primary mb-3">8. Contact</h2>
              <p>
                Questions?{' '}
                <a href="mailto:legal@stampledger.com" className="text-secondary hover:underline">
                  legal@stampledger.com
                </a>
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
```

### 1C: Create `landing/app/docs/page.tsx`

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText, Mail, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Documentation | StampLedger',
  description: 'StampLedger developer documentation and integration guides.',
}

export default function Docs() {
  return (
    <div>
      <section className="bg-gradient-to-b from-primary-50 to-white section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">Documentation</h1>
            <p className="text-xl text-gray-600">
              Developer guides, API references, and integration tutorials.
            </p>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-3">Documentation Coming Soon</h2>
              <p className="text-gray-600 mb-6">
                Full developer documentation will be available at launch. In the
                meantime, we're happy to answer technical questions directly.
              </p>
              <Link
                href="mailto:developers@stampledger.com"
                className="inline-flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg hover:bg-secondary-dark font-medium"
              >
                <Mail className="w-4 h-4" />
                Email Us a Question
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
```

### 1D: Create `landing/app/api-reference/page.tsx`

(Can't use `/api/` — Next.js reserves that for API routes)

```tsx
import { redirect } from 'next/navigation'

export default function ApiReference() {
  redirect('/docs')
}
```

**Then update Footer.tsx** — change the `/api` link to `/api-reference`.

---

## Task 2: PE Portal — Stamp Creation Flow (SvelteKit — `pe-portal/`)

This goes in `~/projects/pe-portal/src/routes/`. The portal already has `register` and `verify`. These are the missing routes.

### 2A: `src/routes/login/+page.svelte`

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleLogin() {
    loading = true;
    error = '';

    try {
      const res = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        error = data.error || 'Login failed';
        return;
      }

      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      goto('/dashboard');
    } catch (e) {
      error = 'Network error. Is the API running on :8080?';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center">
  <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-primary">StampLedger</h1>
      <p class="text-gray-600 mt-1">Sign in to your PE account</p>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <p class="text-red-700 text-sm">{error}</p>
      </div>
    {/if}

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          bind:value={email}
          placeholder="you@email.com"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          required
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input
          type="password"
          bind:value={password}
          placeholder="••••••••"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          required
        />
      </div>
      <button
        on:click={handleLogin}
        disabled={loading}
        class="w-full bg-secondary text-white py-2 rounded-lg hover:bg-secondary-dark disabled:opacity-50 font-medium"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </div>

    <p class="text-center text-sm text-gray-600 mt-6">
      Don't have an account?
      <a href="/register" class="text-secondary hover:underline ml-1">Sign up</a>
    </p>
  </div>
</div>
```

### 2B: `src/routes/dashboard/+page.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let user = null;
  let stamps = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    const token = localStorage.getItem('token');
    if (!token) { goto('/login'); return; }

    try {
      const userRes = await fetch('http://localhost:8080/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!userRes.ok) { goto('/login'); return; }
      user = await userRes.json();

      const stampsRes = await fetch('http://localhost:8080/stamps', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      stamps = await stampsRes.json();
    } catch (e) {
      error = 'Failed to load dashboard';
    } finally {
      loading = false;
    }
  });

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    goto('/login');
  }
</script>

{#if loading}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">Loading...</p>
  </div>

{:else if error}
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <p class="text-red-600">{error}</p>
      <button on:click={() => goto('/login')} class="text-secondary mt-2 hover:underline">Back to login</button>
    </div>
  </div>

{:else}
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
      <h1 class="text-lg font-bold text-primary">StampLedger</h1>
      <div class="flex items-center gap-6">
        <a href="/stamps/create" class="bg-secondary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-secondary-dark">+ New Stamp</a>
        <nav class="flex gap-4 text-sm">
          <a href="/dashboard" class="text-secondary font-medium">Dashboard</a>
          <a href="/specs" class="text-gray-500 hover:text-gray-700">Spec Tracker</a>
          <a href="/documents" class="text-gray-500 hover:text-gray-700">Documents</a>
        </nav>
        <span class="text-sm text-gray-500">{user?.email}</span>
        <button on:click={logout} class="text-sm text-gray-400 hover:text-gray-600">Logout</button>
      </div>
    </nav>

    <div class="max-w-5xl mx-auto p-6">
      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="bg-white rounded-xl p-5 border border-gray-200">
          <div class="text-3xl font-bold text-primary">{stamps.length}</div>
          <div class="text-sm text-gray-500">Total Stamps</div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-200">
          <div class="text-3xl font-bold text-secondary">{stamps.filter(s => !s.revoked).length}</div>
          <div class="text-sm text-gray-500">Active</div>
        </div>
        <div class="bg-white rounded-xl p-5 border border-gray-200">
          <div class="text-3xl font-bold text-accent">{stamps.filter(s => s.revoked).length}</div>
          <div class="text-sm text-gray-500">Revoked</div>
        </div>
      </div>

      <!-- Stamp list -->
      {#if stamps.length === 0}
        <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p class="text-gray-500 mb-4">No stamps yet.</p>
          <a href="/stamps/create" class="text-secondary hover:underline font-medium">Create your first stamp →</a>
        </div>
      {:else}
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Project</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Jurisdiction</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Created</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                <th class="text-left px-4 py-3 text-sm font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody>
              {#each stamps as stamp}
                <tr class="border-b border-gray-100 last:border-0">
                  <td class="px-4 py-3 text-sm text-gray-700">{stamp.project_name || 'Untitled'}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">{stamp.jurisdiction_id}</td>
                  <td class="px-4 py-3 text-sm text-gray-500">{new Date(stamp.created_at * 1000).toLocaleDateString()}</td>
                  <td class="px-4 py-3">
                    {#if stamp.revoked}
                      <span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Revoked</span>
                    {:else}
                      <span class="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Active</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    <a href="/stamps/{stamp.id}" class="text-secondary text-sm hover:underline">View</a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
{/if}
```

### 2C: `src/routes/stamps/create/+page.svelte` — THE STAMP UPLOAD FLOW

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let step = 1;        // 1=upload, 2=details, 3=review, 4=success
  let loading = false;
  let error = '';
  let token = '';

  // Step 1
  let file = null;
  let filePreview = null;
  let documentHash = '';

  // Step 2
  let projectName = '';
  let jurisdiction = '';
  let permitNumber = '';
  let notes = '';

  // Step 4
  let stampId = '';
  let qrCodeUrl = '';
  let txHash = '';

  onMount(() => {
    token = localStorage.getItem('token');
    if (!token) goto('/login');
  });

  // ── STEP 1: Upload + client-side SHA-256 hash ──
  async function handleFileUpload(event) {
    file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.dwg')) {
      error = 'Only PDF and DWG files are supported';
      file = null;
      return;
    }

    error = '';
    loading = true;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      documentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      filePreview = {
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        hash: documentHash
      };
    } catch (e) {
      error = 'Failed to process file';
    } finally {
      loading = false;
    }
  }

  // ── STEP 3: Sign & Submit ──
  async function submitStamp() {
    loading = true;
    error = '';

    try {
      // 1. Upload to IPFS via Go API (document storage feature)
      let ipfsHash = '';
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('http://localhost:8080/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        ipfsHash = uploadData.ipfs_hash;
      }
      // IPFS failure is non-fatal — stamp still works without it

      // 2. Create stamp via Go API → blockchain
      const stampRes = await fetch('http://localhost:8080/stamps', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_hash: documentHash,
          jurisdiction_id: jurisdiction,
          project_name: projectName,
          permit_number: permitNumber,
          notes: notes,
          document_ipfs_hash: ipfsHash,
          document_filename: file.name,
          document_size: file.size
        })
      });

      if (!stampRes.ok) {
        const errData = await stampRes.json();
        error = errData.error || 'Failed to create stamp';
        return;
      }

      const stampData = await stampRes.json();
      stampId = stampData.stamp_id;
      txHash = stampData.tx_hash;
      qrCodeUrl = stampData.qr_code;
      step = 4;
    } catch (e) {
      error = 'Network error. Is the API running on :8080?';
    } finally {
      loading = false;
    }
  }

  function next() { step++; }
  function back() { step--; }
</script>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
    <a href="/dashboard" class="text-lg font-bold text-primary">StampLedger</a>
    <a href="/dashboard" class="text-sm text-gray-500 hover:text-gray-700">← Dashboard</a>
  </nav>

  <div class="max-w-3xl mx-auto p-6">

    <!-- Progress bar -->
    <div class="flex items-center justify-center mb-10">
      {#each ['Upload', 'Details', 'Review', 'Done'] as label, i}
        <div class="flex items-center">
          <div class="flex flex-col items-center">
            <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm {step > i+1 ? 'bg-accent text-white' : step === i+1 ? 'bg-secondary text-white' : 'bg-gray-200 text-gray-500'}">
              {step > i+1 ? '✓' : i+1}
            </div>
            <span class="text-xs text-gray-500 mt-1">{label}</span>
          </div>
          {#if i < 3}<div class="w-16 h-0.5 {step > i+1 ? 'bg-accent' : 'bg-gray-200'} mx-1 mb-5"></div>{/if}
        </div>
      {/each}
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
        <p class="text-red-700 text-sm">{error}</p>
      </div>
    {/if}

    <!-- STEP 1 -->
    {#if step === 1}
      <div class="bg-white rounded-xl border border-gray-200 p-8">
        <h2 class="text-xl font-bold text-primary mb-2">Upload Your Drawing</h2>
        <p class="text-gray-600 mb-6">The document hash is computed in your browser — we never see the file contents until you confirm upload.</p>

        {#if !filePreview}
          <label class="block border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-secondary transition-colors">
            <p class="text-gray-600 font-medium">Click to upload or drag & drop</p>
            <p class="text-gray-400 text-sm mt-1">PDF or DWG files</p>
            <input type="file" accept=".pdf,.dwg" on:change={handleFileUpload} class="hidden" />
          </label>
        {:else}
          <div class="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-700">{filePreview.name}</p>
              <p class="text-sm text-gray-500">{filePreview.size}</p>
              <p class="text-xs text-gray-400 font-mono mt-1">SHA-256: {filePreview.hash.slice(0,16)}...{filePreview.hash.slice(-8)}</p>
            </div>
            <button on:click={() => { file = null; filePreview = null; documentHash = ''; }} class="text-sm text-red-500 hover:text-red-700">Remove</button>
          </div>
        {/if}

        <div class="flex justify-end mt-8">
          <button on:click={next} disabled={!filePreview || loading} class="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-secondary-dark disabled:opacity-50 font-medium">
            {loading ? 'Processing...' : 'Continue →'}
          </button>
        </div>
      </div>
    {/if}

    <!-- STEP 2 -->
    {#if step === 2}
      <div class="bg-white rounded-xl border border-gray-200 p-8">
        <h2 class="text-xl font-bold text-primary mb-2">Project Details</h2>
        <p class="text-gray-600 mb-6">This metadata is stored alongside your stamp on the blockchain.</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input type="text" bind:value={projectName} placeholder="e.g. Fox Valley Community Center"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Jurisdiction <span class="text-red-500">*</span></label>
            <select bind:value={jurisdiction} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary" required>
              <option value="">Select jurisdiction...</option>
              <option value="wisconsin">Wisconsin (statewide)</option>
              <option value="wisconsin_appleton">City of Appleton</option>
              <option value="wisconsin_oshkosh">City of Oshkosh</option>
              <option value="wisconsin_neenah">City of Neenah</option>
              <option value="wisconsin_kaukauna">City of Kaukauna</option>
              <option value="wisconsin_menasha">City of Menasha</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Permit Number (optional)</label>
            <input type="text" bind:value={permitNumber} placeholder="e.g. BP-2026-00142"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea bind:value={notes} placeholder="Any additional context..." rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"></textarea>
          </div>
        </div>

        <div class="flex justify-between mt-8">
          <button on:click={back} class="text-gray-600 hover:text-gray-800 font-medium">← Back</button>
          <button on:click={next} disabled={!jurisdiction} class="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-secondary-dark disabled:opacity-50 font-medium">Continue →</button>
        </div>
      </div>
    {/if}

    <!-- STEP 3 -->
    {#if step === 3}
      <div class="bg-white rounded-xl border border-gray-200 p-8">
        <h2 class="text-xl font-bold text-primary mb-2">Review & Sign</h2>
        <p class="text-gray-600 mb-6">Once submitted, this record is permanent on the blockchain.</p>

        <div class="bg-gray-50 rounded-lg border border-gray-200 p-6 space-y-3 mb-6">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Document</span>
            <span class="text-gray-700 font-medium">{filePreview.name}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Hash</span>
            <span class="text-gray-700 font-mono">{documentHash.slice(0,16)}...{documentHash.slice(-8)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Project</span>
            <span class="text-gray-700 font-medium">{projectName || '—'}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Jurisdiction</span>
            <span class="text-gray-700 font-medium">{jurisdiction}</span>
          </div>
          {#if permitNumber}
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Permit #</span>
              <span class="text-gray-700 font-medium">{permitNumber}</span>
            </div>
          {/if}
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Document Storage</span>
            <span class="text-green-600 font-medium">IPFS upload on submit</span>
          </div>
        </div>

        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p class="text-yellow-800 text-sm">
            <strong>This is permanent.</strong> The stamp record and document will be stored on the blockchain and IPFS. Neither can be altered or deleted.
          </p>
        </div>

        <div class="flex justify-between">
          <button on:click={back} class="text-gray-600 hover:text-gray-800 font-medium">← Back</button>
          <button on:click={submitStamp} disabled={loading} class="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-secondary-dark disabled:opacity-50 font-medium">
            {loading ? 'Submitting to blockchain...' : 'Sign & Submit'}
          </button>
        </div>
      </div>
    {/if}

    <!-- STEP 4 -->
    {#if step === 4}
      <div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-green-600 text-2xl">✓</span>
        </div>
        <h2 class="text-2xl font-bold text-primary mb-2">Stamp Created</h2>
        <p class="text-gray-600 mb-6">Recorded on the blockchain.</p>

        {#if qrCodeUrl}
          <div class="mb-6">
            <p class="text-sm text-gray-500 mb-2">Verification QR code</p>
            <img src={qrCodeUrl} alt="QR" class="w-48 h-48 mx-auto" />
          </div>
        {/if}

        <div class="bg-gray-50 rounded-lg p-4 text-left space-y-2 mb-6 max-w-sm mx-auto">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Stamp ID</span>
            <span class="text-gray-700 font-mono">{stampId?.slice(0,12)}...</span>
          </div>
          {#if txHash}
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">TX Hash</span>
              <span class="text-gray-700 font-mono">{txHash.slice(0,16)}...</span>
            </div>
          {/if}
        </div>

        <a href="/dashboard" class="inline-block bg-secondary text-white px-6 py-2 rounded-lg hover:bg-secondary-dark font-medium">
          Back to Dashboard
        </a>
      </div>
    {/if}

  </div>
</div>
```

---

## Task 3: Spec Tracker (SvelteKit — `pe-portal/`)

### 3A: `src/routes/specs/+page.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let token = '';
  let projects = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    token = localStorage.getItem('token');
    if (!token) { goto('/login'); return; }

    try {
      const res = await fetch('http://localhost:8080/specs/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      projects = await res.json();
    } catch (e) {
      error = 'Failed to load projects';
    } finally {
      loading = false;
    }
  });
</script>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
    <a href="/dashboard" class="text-lg font-bold text-primary">StampLedger</a>
    <nav class="flex gap-4 text-sm">
      <a href="/dashboard" class="text-gray-500 hover:text-gray-700">Dashboard</a>
      <a href="/specs" class="text-secondary font-medium">Spec Tracker</a>
      <a href="/documents" class="text-gray-500 hover:text-gray-700">Documents</a>
    </nav>
  </nav>

  <div class="max-w-5xl mx-auto p-6">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-primary">Specification Tracker</h1>
        <p class="text-gray-500 text-sm">Blockchain-verified version control for project specs</p>
      </div>
      <a href="/specs/new" class="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary-dark font-medium">+ New Project</a>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4"><p class="text-red-700">{error}</p></div>
    {:else if loading}
      <p class="text-gray-500">Loading...</p>
    {:else if projects.length === 0}
      <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p class="text-gray-500 mb-2">No projects yet.</p>
        <p class="text-gray-400 text-sm mb-4">Track specification versions with immutable blockchain records.</p>
        <a href="/specs/new" class="text-secondary hover:underline font-medium">Create your first project →</a>
      </div>
    {:else}
      <div class="space-y-3">
        {#each projects as project}
          <a href="/specs/{project.id}" class="block bg-white rounded-xl border border-gray-200 p-5 hover:border-secondary transition-colors">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="font-semibold text-gray-800">{project.name}</h3>
                <p class="text-sm text-gray-500 mt-0.5">{project.version_count} version{project.version_count !== 1 ? 's' : ''} · Latest: v{project.latest_version}</p>
              </div>
              <span class="text-secondary text-sm font-medium">View History →</span>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
```

### 3B: `src/routes/specs/[projectId]/+page.svelte` — Version History

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let token = '';
  let projectId = '';
  let versions = [];
  let loading = true;
  let error = '';

  $: projectId = $page.params.projectId;

  onMount(async () => {
    token = localStorage.getItem('token');
    if (!token) { goto('/login'); return; }

    try {
      const res = await fetch(`http://localhost:8080/specs/projects/${projectId}/versions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      versions = await res.json();
    } catch (e) {
      error = 'Failed to load versions';
    } finally {
      loading = false;
    }
  });
</script>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
    <a href="/dashboard" class="text-lg font-bold text-primary">StampLedger</a>
    <a href="/specs" class="text-sm text-gray-500 hover:text-gray-700">← All Projects</a>
  </nav>

  <div class="max-w-3xl mx-auto p-6">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-bold text-primary">Version History</h1>
      <a href="/specs/{projectId}/new-version" class="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary-dark font-medium">+ New Version</a>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4"><p class="text-red-700">{error}</p></div>
    {:else if loading}
      <p class="text-gray-500">Loading...</p>
    {:else}
      <div class="relative">
        <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div class="space-y-4">
          {#each versions as version, i}
            <div class="relative pl-10">
              <div class="absolute left-2.5 top-4 w-3 h-3 rounded-full {i === 0 ? 'bg-secondary' : 'bg-gray-300'} border-2 border-white"></div>
              <div class="bg-white rounded-xl border border-gray-200 p-5">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-primary">v{version.version}</span>
                      {#if i === 0}<span class="bg-secondary text-white text-xs px-2 py-0.5 rounded-full">Latest</span>{/if}
                    </div>
                    <p class="text-sm text-gray-500 mt-0.5">{new Date(version.created_at * 1000).toLocaleDateString()} · {version.created_by}</p>
                  </div>
                  {#if version.ipfs_url}
                    <a href={version.ipfs_url} target="_blank" rel="noopener noreferrer" class="text-sm text-secondary hover:underline">IPFS →</a>
                  {/if}
                </div>
                {#if version.changelog}
                  <p class="text-gray-600 text-sm mt-3 border-t border-gray-100 pt-3">{version.changelog}</p>
                {/if}
                <div class="mt-3 flex items-center gap-2">
                  <span class="text-accent text-xs">●</span>
                  <span class="text-xs text-gray-400 font-mono">Hash: {version.spec_hash.slice(0,24)}...</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
```

### 3C: `src/routes/specs/[projectId]/new-version/+page.svelte`

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let token = '';
  let projectId = '';
  let version = '';
  let changelog = '';
  let file = null;
  let specHash = '';
  let loading = false;
  let error = '';

  $: projectId = $page.params.projectId;

  onMount(() => {
    token = localStorage.getItem('token');
    if (!token) goto('/login');
  });

  async function handleFileUpload(event) {
    file = event.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    specHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function submit() {
    if (!file || !version || !specHash) return;
    loading = true;
    error = '';

    try {
      // Upload to IPFS
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('http://localhost:8080/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      let ipfsHash = '';
      if (uploadRes.ok) {
        ipfsHash = (await uploadRes.json()).ipfs_hash;
      }

      // Create spec version
      const res = await fetch('http://localhost:8080/specs/versions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, version, spec_hash: specHash, spec_ipfs: ipfsHash, changelog })
      });

      if (!res.ok) {
        error = (await res.json()).error || 'Failed';
        return;
      }
      goto(`/specs/${projectId}`);
    } catch (e) {
      error = 'Network error';
    } finally {
      loading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
    <a href="/dashboard" class="text-lg font-bold text-primary">StampLedger</a>
    <a href="/specs/{projectId}" class="text-sm text-gray-500 hover:text-gray-700">← Back</a>
  </nav>

  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-bold text-primary mb-6">New Spec Version</h1>

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><p class="text-red-700 text-sm">{error}</p></div>
    {/if}

    <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Version <span class="text-red-500">*</span></label>
        <input type="text" bind:value={version} placeholder="e.g. 1.2.0"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Spec Document <span class="text-red-500">*</span></label>
        <label class="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-secondary transition-colors">
          {#if file}
            <p class="text-gray-700 font-medium">{file.name}</p>
            <p class="text-gray-400 text-sm">Click to replace</p>
          {:else}
            <p class="text-gray-600">Click to upload</p>
            <p class="text-gray-400 text-sm">PDF, DOCX, or MD</p>
          {/if}
          <input type="file" accept=".pdf,.docx,.md,.txt" on:change={handleFileUpload} class="hidden" />
        </label>
        {#if specHash}
          <p class="text-xs text-gray-400 font-mono mt-1">Hash: {specHash.slice(0,32)}...</p>
        {/if}
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Changelog</label>
        <textarea bind:value={changelog} placeholder="What changed?" rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"></textarea>
      </div>

      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p class="text-yellow-800 text-sm"><strong>Permanent.</strong> This version is hashed and recorded on the blockchain. It cannot be edited or deleted.</p>
      </div>

      <div class="flex justify-end">
        <button on:click={submit} disabled={!file || !version || loading}
          class="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-secondary-dark disabled:opacity-50 font-medium">
          {loading ? 'Recording...' : 'Submit Version'}
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## Task 4: Document Storage (SvelteKit — `pe-portal/`)

### `src/routes/documents/+page.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let token = '';
  let documents = [];
  let loading = true;
  let uploading = false;
  let error = '';

  onMount(async () => {
    token = localStorage.getItem('token');
    if (!token) { goto('/login'); return; }
    await loadDocuments();
  });

  async function loadDocuments() {
    try {
      const res = await fetch('http://localhost:8080/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      documents = await res.json();
    } catch (e) {
      error = 'Failed to load documents';
    } finally {
      loading = false;
    }
  }

  async function uploadDocument(event) {
    const file = event.target.files[0];
    if (!file) return;
    uploading = true;
    error = '';

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8080/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!res.ok) { error = (await res.json()).error || 'Upload failed'; return; }
      await loadDocuments();
    } catch (e) {
      error = 'Upload failed — network error';
    } finally {
      uploading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center">
    <a href="/dashboard" class="text-lg font-bold text-primary">StampLedger</a>
    <nav class="flex gap-4 text-sm">
      <a href="/dashboard" class="text-gray-500 hover:text-gray-700">Dashboard</a>
      <a href="/specs" class="text-gray-500 hover:text-gray-700">Spec Tracker</a>
      <a href="/documents" class="text-secondary font-medium">Documents</a>
    </nav>
  </nav>

  <div class="max-w-5xl mx-auto p-6">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-primary">Document Storage</h1>
        <p class="text-gray-500 text-sm">Permanent, immutable storage on IPFS with blockchain verification.</p>
      </div>
      <label class="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-secondary-dark font-medium cursor-pointer">
        {uploading ? 'Uploading...' : '+ Upload'}
        <input type="file" accept=".pdf,.dwg,.docx" on:change={uploadDocument} class="hidden" />
      </label>
    </div>

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"><p class="text-red-700 text-sm">{error}</p></div>
    {/if}

    {#if loading}
      <p class="text-gray-500">Loading...</p>
    {:else if documents.length === 0}
      <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p class="text-gray-500 mb-2">No documents stored yet.</p>
        <p class="text-gray-400 text-sm">Upload documents to store them permanently.</p>
      </div>
    {:else}
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Filename</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Size</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Uploaded</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">IPFS</th>
              <th class="text-left px-4 py-3 text-sm font-medium text-gray-600">Linked Stamp</th>
            </tr>
          </thead>
          <tbody>
            {#each documents as doc}
              <tr class="border-b border-gray-100 last:border-0">
                <td class="px-4 py-3 text-sm text-gray-700 font-medium">{doc.filename}</td>
                <td class="px-4 py-3 text-sm text-gray-500">{(doc.size / 1024).toFixed(1)} KB</td>
                <td class="px-4 py-3 text-sm text-gray-500">{new Date(doc.uploaded_at * 1000).toLocaleDateString()}</td>
                <td class="px-4 py-3">
                  <a href={`https://ipfs.io/ipfs/${doc.ipfs_hash}`} target="_blank" rel="noopener noreferrer" class="text-secondary text-sm hover:underline font-mono">
                    {doc.ipfs_hash.slice(0,12)}...
                  </a>
                </td>
                <td class="px-4 py-3">
                  {#if doc.stamp_id}
                    <a href="/stamps/{doc.stamp_id}" class="text-secondary text-sm hover:underline">View Stamp</a>
                  {:else}
                    <span class="text-gray-400 text-sm">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
```

---

# PART 3: GO API ENDPOINTS NEEDED

The pe-portal calls `http://localhost:8080`. These endpoints need to exist in `~/projects/stampledger-api/`:

```
Auth (may already exist — check handlers/):
  POST   /auth/register
  POST   /auth/login
  GET    /auth/me

Stamps (partially exists per stamps.go):
  POST   /stamps              ← create stamp, submit tx to chain
  GET    /stamps              ← list current user's stamps
  GET    /stamps/:id          ← single stamp detail + QR code URL

Documents (new):
  POST   /documents/upload    ← receive file, pin to IPFS, record hash, return { ipfs_hash }
  GET    /documents           ← list current user's stored documents

Specs (new):
  POST   /specs/projects      ← create a tracked project
  GET    /specs/projects      ← list user's projects
  GET    /specs/projects/:id/versions  ← version history for a project
  POST   /specs/versions      ← upload new spec version, pin to IPFS, record hash on chain
```

The blockchain client (`internal/blockchain/client.go`) already bridges to `stampledger-chaind`. The new endpoints just need to call the right Cosmos SDK message types — `MsgCreateStamp`, `MsgStoreDocument`, `MsgCreateSpecVersion` — which were defined in the blockchain spec from earlier in this thread.

---

# DEPLOYMENT NOTES

The zip includes deploy scripts for all 3 components. The landing page deploys to Cloudflare Pages via `wrangler pages deploy`. The API gateway deploys to Cloudflare Workers. The chain runs in Docker with a cloudflare tunnel for `rpc.stampledger.com`, `api.stampledger.com`, and `grpc.stampledger.com`.

The pe-portal and Go API are currently local-only (localhost:5173 and localhost:8080). Those stay local until you're ready to deploy the actual product — right now they're just for development and demo.

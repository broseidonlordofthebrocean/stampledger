# StampLedger Landing Page - Claude Code Specification

**Project:** StampLedger Marketing Website  
**Framework:** Next.js 14 (App Router)  
**Deployment:** Vercel  
**Domain:** stampledger.com  
**Timeline:** 2-3 days

---

## Project Overview

Build a professional landing page for StampLedger that:
- Explains the product to municipalities and PE engineers
- Captures email leads for beta program
- Establishes credibility and trust
- SEO optimized for "PE stamp verification" and related terms

---

## Tech Stack

```json
{
  "framework": "Next.js 14",
  "styling": "Tailwind CSS",
  "ui": "shadcn/ui components",
  "email": "Resend (resend.com API)",
  "analytics": "Vercel Analytics",
  "deployment": "Vercel",
  "language": "TypeScript"
}
```

---

## Project Structure

```
stampledger-landing/
├── app/
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Home page
│   ├── for-municipalities/
│   │   └── page.tsx              # Municipalities page
│   ├── for-engineers/
│   │   └── page.tsx              # PE Engineers page
│   ├── how-it-works/
│   │   └── page.tsx              # How it works
│   ├── pricing/
│   │   └── page.tsx              # Pricing page
│   ├── about/
│   │   └── page.tsx              # About/team
│   └── api/
│       └── subscribe/
│           └── route.ts          # Email capture API
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── Header.tsx                 # Navigation
│   ├── Footer.tsx                 # Footer with links
│   ├── Hero.tsx                   # Hero section
│   ├── Features.tsx               # Feature grid
│   ├── HowItWorks.tsx            # Process steps
│   ├── Testimonials.tsx          # Customer quotes (future)
│   ├── EmailCapture.tsx          # Email signup form
│   ├── PricingTable.tsx          # Pricing cards
│   └── CTASection.tsx            # Call-to-action
├── lib/
│   ├── resend.ts                 # Email service client
│   └── utils.ts                  # Utility functions
├── public/
│   ├── logo.svg                  # StampLedger logo
│   └── images/                   # Marketing images
├── styles/
│   └── globals.css               # Global styles
├── .env.local                    # Environment variables
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Page Specifications

### 1. Home Page (`app/page.tsx`)

**Purpose:** Primary landing page for all visitors

**Sections:**

#### Hero Section
```typescript
// Visual: Large headline with illustration/screenshot
{
  headline: "Instantly Verify Professional Engineer Stamps",
  subheadline: "StampLedger is the secure digital ledger that municipalities use to verify PE stamps in seconds, not days.",
  cta_primary: "Request Demo",
  cta_secondary: "How It Works",
  visual: "Dashboard screenshot or illustration"
}
```

#### Problem Statement
```typescript
{
  title: "The PE Stamp Verification Problem",
  problems: [
    {
      icon: "Clock",
      title: "Slow Verification",
      description: "Building inspectors wait 2-3 days to verify PE stamps with state boards"
    },
    {
      icon: "AlertTriangle",
      title: "Fraud Risk",
      description: "Fake PE stamps cost municipalities millions in liability"
    },
    {
      icon: "FileX",
      title: "Manual Process",
      description: "Paper-based verification is error-prone and inefficient"
    }
  ]
}
```

#### Solution (How StampLedger Works)
```typescript
{
  title: "How StampLedger Works",
  steps: [
    {
      number: "01",
      title: "PE Creates Digital Stamp",
      description: "Engineer uploads document, signs digitally, creates blockchain record",
      icon: "Upload"
    },
    {
      number: "02",
      title: "Stamp Recorded on Blockchain",
      description: "Immutable record created with timestamp, license verification, insurance check",
      icon: "Database"
    },
    {
      number: "03",
      title: "Inspector Verifies Instantly",
      description: "Scan QR code or search database, see verification in under 3 seconds",
      icon: "CheckCircle"
    }
  ]
}
```

#### Features Grid
```typescript
{
  title: "Built for Government",
  features: [
    {
      icon: "Shield",
      title: "Blockchain Security",
      description: "Immutable records prevent tampering and fraud"
    },
    {
      icon: "Zap",
      title: "Instant Verification",
      description: "3-second verification vs 2-3 day wait time"
    },
    {
      icon: "Lock",
      title: "Compliance Ready",
      description: "SOC 2, GDPR compliant, ready for government contracts"
    },
    {
      icon: "Users",
      title: "Multi-Jurisdiction",
      description: "Works across city, county, and state boundaries"
    },
    {
      icon: "Smartphone",
      title: "Mobile Inspector App",
      description: "Verify stamps on-site with smartphone"
    },
    {
      icon: "TrendingDown",
      title: "Reduce Liability",
      description: "Blockchain proof protects municipalities from lawsuits"
    }
  ]
}
```

#### Social Proof (Initially placeholder, replace with real data)
```typescript
{
  stats: [
    { number: "3 sec", label: "Average verification time" },
    { number: "100%", label: "Fraud prevention rate" },
    { number: "5", label: "Wisconsin municipalities (pilot)" }
  ]
}
```

#### Email Capture CTA
```typescript
{
  title: "Join the Beta Program",
  description: "We're launching in Wisconsin Q2 2026. Be the first to modernize your permit process.",
  form: {
    fields: ["email", "organization", "role"],
    roles: ["Building Inspector", "IT Director", "City Administrator", "PE Engineer", "Other"],
    submit_text: "Request Beta Access"
  }
}
```

#### Footer
```typescript
{
  company: {
    name: "StampLedger, Inc.",
    tagline: "Verifiable Professional Credentials",
    description: "Blockchain-secured verification for professional engineer stamps"
  },
  links: {
    product: ["How It Works", "Pricing", "For Municipalities", "For Engineers"],
    company: ["About", "Contact", "Privacy", "Terms"],
    resources: ["Documentation", "API", "Support"]
  },
  contact: "hello@stampledger.com",
  social: ["Twitter", "LinkedIn", "GitHub"]
}
```

---

### 2. For Municipalities Page (`app/for-municipalities/page.tsx`)

**Target Audience:** Building departments, city IT, municipal administrators

**Content:**

#### Hero
```typescript
{
  headline: "Modernize PE Stamp Verification",
  subheadline: "Save time, reduce fraud, protect your municipality",
  cta: "Schedule Demo"
}
```

#### Pain Points (Specific to Municipalities)
- Manual verification wastes inspector time
- Liability exposure from accepting fake stamps
- Outdated paper-based processes
- No audit trail for permit approvals

#### Features for Municipalities
```typescript
{
  features: [
    {
      title: "API Integration",
      description: "Integrate with existing permit software (Accela, CityView, etc.)",
      benefit: "No workflow disruption"
    },
    {
      title: "Mobile Inspection App",
      description: "Inspectors verify stamps on-site via smartphone",
      benefit: "Field verification without office trip"
    },
    {
      title: "Dashboard Analytics",
      description: "Track all PE stamps submitted in your jurisdiction",
      benefit: "Oversight and reporting"
    },
    {
      title: "Automatic License Checks",
      description: "Real-time verification with state licensing boards",
      benefit: "Catch expired/revoked licenses"
    }
  ]
}
```

#### Pricing Preview
- Tiered by population
- Annual contracts
- Free pilot program mention

#### Case Study (Placeholder for Future)
```
"City of Appleton reduced permit processing time by 40% with StampLedger"
```

---

### 3. For Engineers Page (`app/for-engineers/page.tsx`)

**Target Audience:** Professional Engineers (electrical, structural, civil, etc.)

**Content:**

#### Hero
```typescript
{
  headline: "Digital PE Stamps in Seconds",
  subheadline: "Create blockchain-verified stamps that municipalities accept instantly",
  cta: "Try Free (10 stamps/month)"
}
```

#### Benefits for PEs
```typescript
{
  benefits: [
    {
      title: "Faster Approvals",
      description: "Municipalities verify your stamps instantly, speeding permit approval",
      icon: "Clock"
    },
    {
      title: "Reduced Liability",
      description: "Blockchain proof of what you stamped and when, protects against disputes",
      icon: "Shield"
    },
    {
      title: "Professional Image",
      description: "QR code verification looks modern and trustworthy to clients",
      icon: "Award"
    },
    {
      title: "Audit Trail",
      description: "Complete history of all stamps for insurance claims and legal defense",
      icon: "FileText"
    }
  ]
}
```

#### How to Create a Stamp (Step-by-Step)
1. Upload your drawing (PDF, DWG)
2. Enter project details (address, permit number)
3. Review and digitally sign
4. Download stamped PDF with QR code
5. Submit to municipality

#### Pricing for PEs
- Free: 10 stamps/month
- Pro: $99/month unlimited
- Firm: $499/month for teams

---

### 4. How It Works Page (`app/how-it-works/page.tsx`)

**Purpose:** Technical explanation for both audiences

**Sections:**

#### Visual Diagram
```
[PE Engineer] → [StampLedger Platform] → [Blockchain] → [Municipality Verification]
```

#### For Non-Technical Readers
- Simple analogy: "Like a digital notary with permanent record-keeping"
- No blockchain jargon
- Focus on benefits

#### For Technical Readers
- Blockchain architecture (expandable section)
- Security model
- API documentation link
- Integration options

#### Trust & Security
```typescript
{
  security: [
    "256-bit encryption",
    "Multi-signature verification",
    "Decentralized validators (municipalities)",
    "SOC 2 Type II certified",
    "GDPR compliant"
  ]
}
```

---

### 5. Pricing Page (`app/pricing/page.tsx`)

**Two Pricing Tables:** Municipalities and PE Engineers

#### Municipalities Pricing
```typescript
{
  tiers: [
    {
      name: "Tier 1",
      population: "Under 10,000",
      price: "$2,500/year",
      features: [
        "Unlimited verifications",
        "Mobile inspector app",
        "Basic support",
        "Dashboard access"
      ]
    },
    {
      name: "Tier 2",
      population: "10,000 - 50,000",
      price: "$7,500/year",
      features: [
        "Everything in Tier 1",
        "API access",
        "Priority support",
        "Custom integrations"
      ]
    },
    {
      name: "Tier 3",
      population: "50,000 - 200,000",
      price: "$15,000/year",
      features: [
        "Everything in Tier 2",
        "Blockchain validator node",
        "Dedicated account manager",
        "Training sessions"
      ]
    },
    {
      name: "Tier 4",
      population: "200,000+",
      price: "$25,000/year",
      features: [
        "Everything in Tier 3",
        "White-label option",
        "SLA guarantee",
        "On-premise deployment option"
      ]
    }
  ],
  note: "Free pilot program available for Wisconsin municipalities in 2026"
}
```

#### PE Engineers Pricing
```typescript
{
  tiers: [
    {
      name: "Free",
      price: "$0/month",
      features: [
        "10 stamps per month",
        "Basic verification",
        "Email support",
        "Community access"
      ],
      cta: "Start Free"
    },
    {
      name: "Pro",
      price: "$99/month",
      popular: true,
      features: [
        "Unlimited stamps",
        "Priority verification",
        "Phone support",
        "Analytics dashboard",
        "API access"
      ],
      cta: "Start Trial"
    },
    {
      name: "Firm",
      price: "$499/month",
      features: [
        "Everything in Pro",
        "10+ engineer accounts",
        "Team management",
        "Dedicated support",
        "Custom integrations",
        "White-label PDFs"
      ],
      cta: "Contact Sales"
    }
  ]
}
```

---

## Component Specifications

### EmailCapture Component

**File:** `components/EmailCapture.tsx`

**Functionality:**
```typescript
interface EmailCaptureProps {
  title?: string;
  description?: string;
  showRoleField?: boolean;
  showOrgField?: boolean;
  ctaText?: string;
}

// Features:
// - Email validation
// - Loading state during submission
// - Success message
// - Error handling
// - Optional organization and role fields
// - Sends to Resend API for email collection
```

**Implementation:**
```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export function EmailCapture({
  title = "Join the Beta Program",
  description = "Be the first to know when we launch.",
  showRoleField = true,
  showOrgField = true,
  ctaText = "Request Access"
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, org, role })
      });

      if (res.ok) {
        setStatus('success');
        setMessage('Thanks! We\'ll be in touch soon.');
        setEmail('');
        setOrg('');
        setRole('');
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <p className="text-green-800 font-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
        />
        
        {showOrgField && (
          <Input
            type="text"
            placeholder="Organization (optional)"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            disabled={status === 'loading'}
          />
        )}
        
        {showRoleField && (
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={status === 'loading'}
          >
            <option value="">Select your role (optional)</option>
            <option value="inspector">Building Inspector</option>
            <option value="it">IT Director</option>
            <option value="admin">City Administrator</option>
            <option value="pe">PE Engineer</option>
            <option value="other">Other</option>
          </Select>
        )}
        
        <Button type="submit" className="w-full" disabled={status === 'loading'}>
          {status === 'loading' ? 'Submitting...' : ctaText}
        </Button>
        
        {status === 'error' && (
          <p className="text-red-600 text-sm">{message}</p>
        )}
      </form>
    </div>
  );
}
```

---

### API Route: Email Subscription

**File:** `app/api/subscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, org, role } = await req.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      );
    }

    // Add to Resend audience
    await resend.contacts.create({
      email,
      audienceId: process.env.RESEND_AUDIENCE_ID!,
      firstName: org || undefined,
      unsubscribed: false,
    });

    // Send confirmation email
    await resend.emails.send({
      from: 'hello@stampledger.com',
      to: email,
      subject: 'Thanks for your interest in StampLedger',
      html: `
        <h2>Thanks for joining the StampLedger beta list!</h2>
        <p>We're launching in Wisconsin in Q2 2026 and will keep you updated on our progress.</p>
        ${org ? `<p>Organization: ${org}</p>` : ''}
        ${role ? `<p>Role: ${role}</p>` : ''}
        <p>Questions? Reply to this email or contact hello@stampledger.com</p>
        <p>— The StampLedger Team</p>
      `
    });

    // Also notify yourself
    await resend.emails.send({
      from: 'hello@stampledger.com',
      to: 'waffle@youremail.com', // YOUR EMAIL
      subject: 'New StampLedger Beta Signup',
      html: `
        <h3>New signup:</h3>
        <p>Email: ${email}</p>
        <p>Org: ${org || 'N/A'}</p>
        <p>Role: ${role || 'N/A'}</p>
      `
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
```

---

## SEO Requirements

### Metadata (in `app/layout.tsx`)

```typescript
export const metadata: Metadata = {
  title: 'StampLedger - Instant PE Stamp Verification for Municipalities',
  description: 'Blockchain-secured verification for professional engineer stamps. Municipalities verify PE stamps in 3 seconds. Prevent fraud, save time, reduce liability.',
  keywords: [
    'PE stamp verification',
    'professional engineer stamps',
    'municipal software',
    'permit software',
    'building inspection',
    'blockchain government',
    'engineering stamps',
    'NEC compliance'
  ],
  openGraph: {
    title: 'StampLedger - Professional Engineer Stamp Verification',
    description: 'Instant verification for municipalities. Blockchain-secured, fraud-proof PE stamps.',
    url: 'https://stampledger.com',
    siteName: 'StampLedger',
    images: [
      {
        url: 'https://stampledger.com/og-image.png',
        width: 1200,
        height: 630,
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StampLedger - PE Stamp Verification',
    description: 'Blockchain-secured verification for municipalities',
    images: ['https://stampledger.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  }
};
```

---

## Design System

### Color Palette
```typescript
const colors = {
  primary: {
    DEFAULT: '#1a3a52', // Navy blue (trust, professionalism)
    light: '#2c5f82',
    dark: '#0f2332'
  },
  secondary: {
    DEFAULT: '#2b6cb0', // Bright blue (action)
    light: '#4299e1',
    dark: '#1e4e8c'
  },
  accent: {
    DEFAULT: '#48bb78', // Green (success, verification)
    light: '#68d391',
    dark: '#2f855a'
  },
  gray: {
    50: '#f7fafc',
    100: '#edf2f7',
    200: '#e2e8f0',
    300: '#cbd5e0',
    400: '#a0aec0',
    500: '#718096',
    600: '#4a5568',
    700: '#2d3748',
    800: '#1a202c',
    900: '#171923'
  }
};
```

### Typography
```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace']
  },
  fontSize: {
    hero: '3.75rem', // 60px
    h1: '3rem',      // 48px
    h2: '2.25rem',   // 36px
    h3: '1.875rem',  // 30px
    h4: '1.5rem',    // 24px
    body: '1rem',    // 16px
    small: '0.875rem' // 14px
  }
};
```

### Component Styling
- Buttons: Rounded corners (8px), prominent shadows on hover
- Cards: White background, subtle border, shadow on hover
- Forms: Clear labels, good spacing, validation states
- Icons: Lucide icons library (consistent style)

---

## Environment Variables

**File:** `.env.local`

```bash
# Resend API for email capture
RESEND_API_KEY=re_xxxxx
RESEND_AUDIENCE_ID=xxxxx

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Production
# NEXT_PUBLIC_SITE_URL=https://stampledger.com
```

---

## Testing Checklist

### Functionality
- [ ] Email capture form submits successfully
- [ ] Validation errors display correctly
- [ ] Success message appears after submission
- [ ] Confirmation email received
- [ ] Notification email sent to admin
- [ ] All navigation links work
- [ ] Mobile responsive (test on iPhone, Android)
- [ ] Forms work on all browsers (Chrome, Safari, Firefox)

### SEO
- [ ] Meta tags present on all pages
- [ ] Open Graph images display in social previews
- [ ] sitemap.xml generated
- [ ] robots.txt configured
- [ ] Page load speed <2 seconds
- [ ] Core Web Vitals pass

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast passes WCAG AA
- [ ] Alt text on all images
- [ ] Form labels properly associated

---

## Deployment

### Vercel Setup

1. **Connect GitHub repo to Vercel**
2. **Configure environment variables** in Vercel dashboard
3. **Set up custom domain:**
   - Add stampledger.com in Vercel
   - Update DNS at your registrar:
     ```
     A record: @ → 76.76.21.21
     CNAME: www → cname.vercel-dns.com
     ```
4. **Enable Vercel Analytics**
5. **Deploy**

### Post-Deployment

- [ ] Test all forms in production
- [ ] Verify email capture works
- [ ] Check Google Analytics tracking
- [ ] Submit sitemap to Google Search Console
- [ ] Test on multiple devices/browsers

---

## Success Criteria

**The landing page is complete when:**

✅ All pages render correctly  
✅ Email capture works end-to-end  
✅ Mobile responsive (looks good on phones)  
✅ SEO metadata complete  
✅ Page load speed <2 seconds  
✅ Zero console errors  
✅ Deployed to stampledger.com  
✅ 10 people have submitted their email  

---

## Future Enhancements (Post-MVP)

- [ ] Blog for SEO content (PE stamp fraud cases, blockchain explainers)
- [ ] Customer testimonials/case studies
- [ ] Video demo on homepage
- [ ] Live chat (Intercom or similar)
- [ ] Documentation section
- [ ] Pricing calculator
- [ ] ROI calculator for municipalities
- [ ] Integration showcase (Accela, CityView, etc.)

---

## Notes for Claude Code

**When building this:**

1. **Use shadcn/ui** for all components (button, input, select, etc.)
2. **TypeScript strict mode** enabled
3. **Responsive design** - mobile-first approach
4. **Accessibility** - proper ARIA labels, keyboard navigation
5. **Performance** - lazy load images, optimize fonts
6. **Error handling** - graceful failures, user-friendly messages
7. **Analytics** - track button clicks, form submissions
8. **A/B testing ready** - use feature flags for different CTA text

**Design philosophy:**
- Clean, professional (government agencies must trust this)
- Not too "startup-y" (avoid purple gradients, etc.)
- Information-dense but scannable
- Clear calls to action
- Credibility indicators (security badges, etc.)

This is a B2G (Business-to-Government) product, so the website must feel:
- **Trustworthy** (municipalities are risk-averse)
- **Professional** (boring is good)
- **Clear** (no jargon unless necessary)
- **Credible** (backed by real technology)


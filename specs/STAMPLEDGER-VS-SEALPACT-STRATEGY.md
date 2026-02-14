# STAMPLEDGER vs SEALPACT/AXA — How to Win
## Competitive Analysis & Revised Strategy

**Date:** 2026-02-12  
**Situation:** SealPact is already the "official" partner of AXA XL  
**Your position:** Late entrant competing against established player

---

## WHAT WE JUST LEARNED

### SealPact's Integration with AXA:

✅ **Already adopted** — AXA offers it to all policyholders via "AXA XL Ecosystem"  
✅ **Marketing distribution** — AXA promotes it in webinars, EDGE platform  
✅ **50,000+ potential users** — every AXA Design Professional policyholder has access  
✅ **Built by A/Es for A/Es** — co-founder Paul Cianci is a PE, understands the workflow  

### What SealPact Does (From Article):

1. **Dynamic invalidation** — engineer pushes button, invalidates everyone's copy instantly
2. **Email notifications** — alerts specific parties when plans change
3. **QR code verification** — builder scans QR in field, sees if plans are still valid
4. **Access tracking** — A/E sees who accessed files
5. **Scope attachment** — A/E can attach liability limitations to seal
6. **Blockchain + encryption** — prevents tampering
7. **Supersession management** — marks old versions as invalid when new version uploaded

### What This Means:

**You are NOT competing with a startup. You're competing with an AXA-backed incumbent.**

---

## THE BRUTAL TRUTH

### You Cannot Out-Feature SealPact

They have:
- ✅ Real-time invalidation (you don't)
- ✅ Email notifications (you don't)
- ✅ Scope/liability attachment (you don't)
- ✅ Access tracking (you don't)
- ✅ QR verification (you both have this)
- ✅ Blockchain (you both have this)
- ✅ Supersession (they have it, you need to add it)

**If you compete on features, you lose.**

### You Cannot Out-Market SealPact

They have:
- AXA's sales force promoting it
- AXA's EDGE platform (50K users)
- Webinars with AXA's brand behind them
- "Free to policyholders" positioning

**If you compete on distribution, you lose.**

---

## HOW TO WIN: DO WHAT THEY'RE NOT DOING

### The Gap in SealPact's Model

**Re-read the article carefully. What's missing?**

❌ **No insurance verification mentioned** — article focuses on project communication, not claims  
❌ **No claims adjuster workflow** — built for PEs, not for insurance companies  
❌ **No API for insurers** — no mention of programmatic access  
❌ **No point-in-time snapshots** — invalidation is PE-driven, not auto-captured  
❌ **No license verification** — no mention of checking if PE license is active  

**SealPact is a PROJECT MANAGEMENT tool disguised as a sealing tool.**

It solves: "How do we keep everyone on the latest plans?"  
It does NOT solve: "How do we verify claims 2 years after the stamp was created?"

---

## YOUR COMPETITIVE ADVANTAGE

### What StampLedger Does That SealPact Doesn't:

✅ **Insurance-first design** — built for claims verification, not project coordination  
✅ **Point-in-time snapshots** — automatic capture of license + insurance status  
✅ **Insurance API** — adjusters can programmatically verify stamps  
✅ **License verification** — real-time check against Wisconsin DSPS  
✅ **Claims-focused QR** — shows what matters for liability (license, insurance, blockchain proof)  

**You're not competing with SealPact for PEs. You're competing for the INSURANCE MARKET they're not targeting.**

---

## REVISED STRATEGY: PARTNER, DON'T COMPETE

### The Win-Win Play

**SealPact has 50,000 AXA policyholders using dynamic seals.**  
**But AXA still needs to verify those stamps when claims come in.**  
**That's where you come in.**

### Positioning:

**SealPact = Front-end project coordination tool**  
- PEs use it to manage plans, notify contractors, invalidate versions
- Focused on workflow during active projects

**StampLedger = Back-end claims verification infrastructure**  
- Insurance companies use it to verify stamps years later
- Focused on liability and compliance

**They're complementary, not competitive.**

---

## THE PARTNERSHIP PITCH

### To AXA:

> "SealPact is great for project management. But when a claim comes in 3 years later, you need to verify:
> - Was the PE licensed when they stamped it?
> - Was the PE insured when they stamped it?
> - What were the coverage limits?
> - Is the blockchain proof authentic?
> 
> SealPact doesn't capture that data. StampLedger does.
> 
> We can integrate: SealPact stamps get automatically registered in StampLedger's verification database. Your adjusters get API access to verify any stamp—whether it came from SealPact, Adobe Sign, or a manual stamp.
> 
> You're already paying for SealPact. We add the insurance layer on top."

### To SealPact:

> "You've built the best tool for PEs to manage their seals. But insurers are asking: 'How do we verify these in claims?'
> 
> We built the insurance verification API. We can white-label it for you: when someone uses SealPact, we capture the insurance snapshot in our backend. You get a feature you don't have to build, we get access to your user base.
> 
> Win-win."

---

## IF PARTNERSHIP FAILS: THE DIRECT ATTACK

### Target the 2 Markets SealPact Doesn't Own

**Market 1: Non-AXA Insurance Companies**

Chubb, Hartford, Travelers, Zurich don't have SealPact deals.

**Pitch:**
> "AXA uses SealPact for project coordination. But for claims verification, they need an insurance API. That's what we built. We can verify stamps from ANY source—SealPact, Adobe, manual stamps—and give you the data you need for claims."

**Market 2: Municipalities (Your Home Turf)**

AXA doesn't care about municipalities. SealPact is focused on A/E firms.

**Pitch to Wisconsin municipalities:**
> "When you receive stamped plans, how do you verify the PE's license is active and they're insured? Call the state board and wait 3 days?
> 
> StampLedger gives you instant verification. QR code scan → see license status, insurance status, blockchain proof. 3 seconds."

**This is your wedge.** Get 10-20 Wisconsin municipalities using StampLedger for verification. Then go to insurers and say:
> "Wisconsin municipalities are already using us. We have the data. We can give you API access."

---

## FEATURE PARITY: WHAT YOU MUST ADD

### Critical Features to Match SealPact:

**1. Supersession/Invalidation**
- When PE uploads new version, mark old stamp as "superseded"
- Store superseded_by stamp ID
- Public QR verification shows "THIS STAMP HAS BEEN SUPERSEDED"

**2. Email Notifications**
- PE can enter stakeholder emails when creating stamp
- When stamp is superseded/revoked, notify stakeholders

**3. Access Tracking**
- Log every QR scan: timestamp, IP, user agent
- PE can see "John Smith scanned this QR on 2026-02-10 at 3:42pm"

### Nice-to-Have Features (Add If You Have Time):

**4. Scope/Liability Notes**
- PE can attach text: "This stamp covers structural analysis only, not architectural design"
- Shows on verification page

**5. Batch Operations**
- PE can supersede multiple stamps at once
- PE can stamp multiple files at once

---

## THE NEW PITCH TO ANDY MENDELSON

**Subject:** Insurance verification layer for SealPact + other digital stamps

**Body:**

> Hi Andy,
>
> I read the AXA article about SealPact's dynamic sealing. It's a great tool for project coordination.
>
> But when a claim comes in years later, you need different data:
> - Was the PE licensed when they stamped it?
> - Was the PE insured? What policy? What limits?
> - Can we prove the stamp is authentic?
>
> SealPact doesn't capture that. StampLedger does.
>
> **What we built:**
> - Point-in-time snapshot of license + insurance status at stamp creation
> - API for claims adjusters to verify any stamp (SealPact, Adobe, manual)
> - Blockchain proof that can't be backdated
> - Wisconsin DSPS integration for real-time license verification
>
> **Integration option:**
> We can add an insurance verification layer to SealPact stamps. When a PE uses SealPact, we capture the insurance snapshot in our backend. Your adjusters query our API when claims come in.
>
> **Or standalone:**
> Wisconsin municipalities are already using StampLedger for permit verification. We have real-world usage data.
>
> Either way, we solve a problem SealPact doesn't: claims verification.
>
> 15 minutes to demo?
>
> Waffle Anderson, PE

---

## PRICING STRATEGY VS SEALPACT

### SealPact's Model (Assumed):
- Free to AXA policyholders (AXA pays SealPact)
- OR: Low cost ($10-30/month per PE)
- Revenue: Volume play (50,000 users × $20/month = $1M/month)

### Your Model:
**Don't compete on PE pricing. Go B2B.**

**Option 1: Insurance API SaaS**
- Sell to AXA, Chubb, Hartford at $10K-50K/month
- They get unlimited API calls
- You verify stamps from ANY source (not just StampLedger stamps)

**Option 2: Per-Verification Fee**
- $0.25-$1.00 per stamp verified
- Insurance companies pay per API call
- Scales with their claims volume

**Option 3: White-Label for SealPact**
- SealPact pays you $0.10 per stamp created via their platform
- You provide the insurance backend
- They upsell "insurance verification included"

---

## IMPLEMENTATION PRIORITY (REVISED)

### Week 1: Security + Insurance Snapshots
- ✅ Add account verification (prevent fraud)
- ✅ Add insurance fields + snapshots
- ✅ Add supersession tracking

### Week 2: Insurance API
- ✅ Build /api/insurance/verify-stamp endpoint
- ✅ Add API key system
- ✅ Test with mock adjuster queries

### Week 3: Municipality Pilot
- ✅ Email 3 Wisconsin municipalities you work with
- ✅ Offer free pilot: "Verify PE stamps instantly"
- ✅ Get 10-20 stamps verified in real-world use

### Week 4: Insurance Sales
- ✅ Email Andy with municipality traction
- ✅ Position as "insurance layer for ALL digital stamps"
- ✅ Offer API integration with SealPact

---

## SUCCESS METRICS

### Must-Have for Credibility:
- 3 Wisconsin municipalities using StampLedger for verification
- 50+ stamps verified via QR codes
- 1 insurance company testing API (even in pilot)

### Would Be Nice:
- Partnership discussion with SealPact
- White-label deal with non-AXA insurer
- 10+ A/E firms using StampLedger directly

---

## THE HARD TRUTH

**You cannot beat SealPact in the PE market.** They have AXA's distribution, AXA's marketing, and first-mover advantage with 50,000 potential users.

**But you can win the insurance verification market** because:
1. SealPact isn't focused on it
2. Insurers need it regardless of which stamp tool PEs use
3. You can verify stamps from ANY source, not just yours

**Your advantage:** You're not a PE tool competing with SealPact. You're insurance infrastructure that works WITH SealPact (or Adobe, or manual stamps).

---

## THE PIVOT

**Old positioning:** "Digital stamping tool for PEs"  
❌ You lose to SealPact

**New positioning:** "Claims verification infrastructure for insurance companies"  
✅ You win because it's a different market

**The play:**
1. Get municipalities to use you for permit verification (proves it works)
2. Show insurers: "Look, real stamps being verified in production"
3. Sell API access to insurers at $10K-50K/month
4. Offer to integrate with SealPact as their insurance backend

**You're not competing. You're filling the gap SealPact left open.**

---

## FINAL ANSWER TO YOUR QUESTION

**"Are you ready to compete with SealPact?"**

**No. Not head-to-head.**

**But you don't have to.**

SealPact is a project coordination tool. You're insurance infrastructure. Different buyers, different use cases, different value props.

**Go after the insurance market SealPact isn't serving. Partner with them if you can. Compete only if you must.**

And move fast. If AXA realizes they need insurance verification and asks SealPact to add it, you're out of luck.

**You have 3-6 months to own the insurance verification market before SealPact notices.**

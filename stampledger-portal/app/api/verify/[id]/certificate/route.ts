import { NextRequest, NextResponse } from 'next/server'
import { getDb, stamps, users, professionalLicenses } from '@/lib/db'
import { eq } from 'drizzle-orm'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// GET /api/verify/[id]/certificate - Generate verification certificate HTML
// No auth required (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()

    const stamp = await db
      .select()
      .from(stamps)
      .where(eq(stamps.id, id))
      .get()

    if (!stamp) {
      return new NextResponse('Stamp not found', { status: 404 })
    }

    // Get PE info
    const pe = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        peLicenseNumber: users.peLicenseNumber,
        peState: users.peState,
      })
      .from(users)
      .where(eq(users.id, stamp.userId))
      .get()

    // Get license details
    let license = null
    if (stamp.licenseId) {
      license = await db
        .select()
        .from(professionalLicenses)
        .where(eq(professionalLicenses.id, stamp.licenseId))
        .get()
    }

    const verifyUrl = `https://portal.stampledger.com/verify/${stamp.id}`
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(verifyUrl)}&color=1a3a52`

    const isValid = stamp.status === 'active'
    const isSuperseded = stamp.status === 'superseded'
    const peName = escapeHtml(pe ? `${pe.firstName || ''} ${pe.lastName || ''}`.trim() : 'Unknown')
    const licenseInfo = escapeHtml(license
      ? `${license.licenseType} #${license.licenseNumber} (${license.issuingState})`
      : pe?.peLicenseNumber
        ? `PE #${pe.peLicenseNumber} (${pe.peState})`
        : 'Not specified')
    const now = new Date()

    // Parse insurance snapshot
    let insuranceInfo: { provider?: string; policyNumber?: string; coverageAmount?: number; expirationDate?: string } | null = null
    if (stamp.insuranceSnapshot) {
      try { insuranceInfo = JSON.parse(stamp.insuranceSnapshot) } catch {}
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StampLedger Verification Certificate</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; background: #f8f9fa; color: #1a1a1a; }
    .certificate {
      max-width: 800px; margin: 40px auto; background: white;
      border: 3px solid #1a3a52; padding: 60px; position: relative;
    }
    .certificate::before {
      content: ''; position: absolute; top: 8px; left: 8px; right: 8px; bottom: 8px;
      border: 1px solid #1a3a52; pointer-events: none;
    }
    .header { text-align: center; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; color: #1a3a52; letter-spacing: 3px; }
    .subtitle { font-size: 14px; color: #666; margin-top: 8px; letter-spacing: 2px; text-transform: uppercase; }
    .title { font-size: 24px; color: #1a3a52; text-align: center; margin: 30px 0; border-top: 2px solid #1a3a52; border-bottom: 2px solid #1a3a52; padding: 15px 0; }
    .status {
      text-align: center; padding: 12px 24px; border-radius: 8px; font-size: 18px;
      font-weight: bold; margin: 20px auto; display: inline-block;
    }
    .status.valid { background: #d4edda; color: #155724; border: 2px solid #28a745; }
    .status.invalid { background: #f8d7da; color: #721c24; border: 2px solid #dc3545; }
    .status.superseded { background: #fff3cd; color: #856404; border: 2px solid #ffc107; }
    .alert-banner { background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
    .alert-banner a { color: #1a3a52; font-weight: bold; }
    .section-header { font-size: 16px; font-weight: bold; color: #1a3a52; margin-top: 30px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
    .status-row { text-align: center; margin-bottom: 30px; }
    .details { margin: 30px 0; }
    .detail-row { display: flex; padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail-label { width: 200px; font-weight: bold; color: #555; font-size: 14px; }
    .detail-value { flex: 1; font-size: 14px; }
    .hash { font-family: 'Courier New', monospace; font-size: 11px; word-break: break-all; background: #f5f5f5; padding: 8px; border-radius: 4px; }
    .qr-section { text-align: center; margin: 30px 0; }
    .qr-section img { width: 180px; height: 180px; }
    .qr-label { font-size: 12px; color: #666; margin-top: 8px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
    .footer p { font-size: 11px; color: #999; line-height: 1.6; }
    .timestamp { font-size: 12px; color: #666; margin-top: 10px; }
    @media print {
      body { background: white; }
      .certificate { border: 3px solid #1a3a52; margin: 0; box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">STAMPLEDGER</div>
      <div class="subtitle">Blockchain-Verified Engineering Stamp Registry</div>
    </div>

    <div class="title">Verification Certificate</div>

    <div class="status-row">
      <span class="status ${isValid ? 'valid' : (isSuperseded ? 'superseded' : 'invalid')}">
        ${isValid ? 'VERIFIED - STAMP ACTIVE' : (isSuperseded ? 'STAMP SUPERSEDED' : 'STAMP ' + stamp.status.toUpperCase())}
      </span>
    </div>

    ${isSuperseded ? `
    <div class="alert-banner">
      <strong>This stamp has been superseded.</strong>
      ${stamp.supersessionReason ? `<br>Reason: ${escapeHtml(stamp.supersessionReason)}` : ''}
      ${stamp.supersededBy ? `<br><a href="/api/verify/${encodeURIComponent(stamp.supersededBy)}/certificate">View current version</a>` : ''}
    </div>` : ''}

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Stamp ID</span>
        <span class="detail-value" style="font-family: monospace; font-size: 12px;">${stamp.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Professional Engineer</span>
        <span class="detail-value">${peName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">License</span>
        <span class="detail-value">${licenseInfo}</span>
      </div>
      ${stamp.projectName ? `
      <div class="detail-row">
        <span class="detail-label">Project</span>
        <span class="detail-value">${escapeHtml(stamp.projectName)}</span>
      </div>` : ''}
      <div class="detail-row">
        <span class="detail-label">Jurisdiction</span>
        <span class="detail-value" style="text-transform: capitalize;">${escapeHtml(stamp.jurisdictionId.replace(/-/g, ' '))}</span>
      </div>
      ${stamp.permitNumber ? `
      <div class="detail-row">
        <span class="detail-label">Permit Number</span>
        <span class="detail-value">${escapeHtml(stamp.permitNumber)}</span>
      </div>` : ''}
      <div class="detail-row">
        <span class="detail-label">Stamped Date</span>
        <span class="detail-value">${stamp.createdAt ? new Date(stamp.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}</span>
      </div>
      ${stamp.blockchainId ? `
      <div class="detail-row">
        <span class="detail-label">Blockchain ID</span>
        <span class="detail-value" style="font-family: monospace; font-size: 12px;">${stamp.blockchainId}</span>
      </div>` : ''}
      <div class="detail-row">
        <span class="detail-label">Document Hash (SHA-256)</span>
        <span class="detail-value hash">${stamp.documentHash}</span>
      </div>
      ${!isValid && stamp.revokedAt ? `
      <div class="detail-row" style="background: #fff5f5;">
        <span class="detail-label" style="color: #c53030;">Revoked Date</span>
        <span class="detail-value" style="color: #c53030;">${new Date(stamp.revokedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      <div class="detail-row" style="background: #fff5f5;">
        <span class="detail-label" style="color: #c53030;">Revocation Reason</span>
        <span class="detail-value" style="color: #c53030;">${escapeHtml(stamp.revokedReason || 'Not specified')}</span>
      </div>` : ''}
    </div>

    ${stamp.scopeNotes ? `
    <div class="section-header">Scope &amp; Liability Notes</div>
    <div class="details">
      <div class="detail-row">
        <span class="detail-value">${escapeHtml(stamp.scopeNotes)}</span>
      </div>
    </div>` : ''}

    ${insuranceInfo ? `
    <div class="section-header">Professional Liability Insurance (at time of stamp)</div>
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Provider</span>
        <span class="detail-value">${escapeHtml(insuranceInfo.provider || 'N/A')}</span>
      </div>
      ${insuranceInfo.policyNumber ? `
      <div class="detail-row">
        <span class="detail-label">Policy Number</span>
        <span class="detail-value">${escapeHtml(insuranceInfo.policyNumber)}</span>
      </div>` : ''}
      ${insuranceInfo.coverageAmount ? `
      <div class="detail-row">
        <span class="detail-label">Coverage Amount</span>
        <span class="detail-value">$${Number(insuranceInfo.coverageAmount).toLocaleString()}</span>
      </div>` : ''}
      ${insuranceInfo.expirationDate ? `
      <div class="detail-row">
        <span class="detail-label">Insurance Expiration</span>
        <span class="detail-value">${new Date(insuranceInfo.expirationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>` : ''}
    </div>` : ''}

    <div class="qr-section">
      <img src="${qrImageUrl}" alt="Verification QR Code" />
      <div class="qr-label">Verify online: <a href="${verifyUrl}" style="color: #1a3a52;">${verifyUrl}</a></div>
    </div>

    <div class="footer">
      <p class="timestamp">Certificate generated on ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</p>
      <p>This certificate was generated by StampLedger, a blockchain-verified engineering stamp registry.</p>
      <p>To verify this stamp, scan the QR code above or visit the verification URL.</p>
    </div>
  </div>

  <div class="no-print" style="text-align: center; margin: 20px;">
    <button onclick="window.print()" style="padding: 12px 32px; background: #1a3a52; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
      Print Certificate
    </button>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Certificate generation error:', error)
    return new NextResponse('Failed to generate certificate', { status: 500 })
  }
}
export const runtime = 'edge'

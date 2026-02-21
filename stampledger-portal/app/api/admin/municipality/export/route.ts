import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin'
import { getDb, stamps, users, professionalLicenses } from '@/lib/db'
import { eq, desc, inArray } from 'drizzle-orm'

// GET /api/admin/municipality/export - Export stamps as CSV
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const db = getDb()

    const user = await db.select().from(users).where(eq(users.id, payload.userId)).get()
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') // 'active', 'revoked', 'superseded', or null for all

    const now = new Date()

    // Get all stamps
    const allStamps = await db
      .select({
        id: stamps.id,
        status: stamps.status,
        projectName: stamps.projectName,
        jurisdictionId: stamps.jurisdictionId,
        documentHash: stamps.documentHash,
        permitNumber: stamps.permitNumber,
        scopeNotes: stamps.scopeNotes,
        insuranceSnapshot: stamps.insuranceSnapshot,
        licenseId: stamps.licenseId,
        userId: stamps.userId,
        createdAt: stamps.createdAt,
        revokedAt: stamps.revokedAt,
        revokedReason: stamps.revokedReason,
      })
      .from(stamps)
      .orderBy(desc(stamps.createdAt))
      .limit(5000)

    // Apply status filter
    const filtered = statusFilter
      ? allStamps.filter(s => s.status === statusFilter)
      : allStamps

    // Batch fetch user and license data
    const userIds = [...new Set(filtered.map(s => s.userId))]
    const licenseIds = [...new Set(filtered.map(s => s.licenseId).filter(Boolean))] as string[]

    const userMap = new Map<string, { firstName: string | null; lastName: string | null }>()
    if (userIds.length > 0) {
      const allUsers = await db
        .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(inArray(users.id, userIds))
      for (const u of allUsers) {
        userMap.set(u.id, { firstName: u.firstName, lastName: u.lastName })
      }
    }

    const licenseMap = new Map<string, typeof professionalLicenses.$inferSelect>()
    if (licenseIds.length > 0) {
      const allLicenses = await db
        .select()
        .from(professionalLicenses)
        .where(inArray(professionalLicenses.id, licenseIds))
      for (const l of allLicenses) {
        licenseMap.set(l.id, l)
      }
    }

    // Build CSV
    const csvHeader = [
      'Stamp ID',
      'Status',
      'Project Name',
      'Jurisdiction',
      'Permit Number',
      'PE Name',
      'License Number',
      'License State',
      'License Expired',
      'Insurance Provider',
      'Insurance Expired',
      'Scope Notes',
      'Created At',
      'Revoked At',
      'Revoked Reason',
      'Document Hash',
    ]

    const csvRows = filtered.map(stamp => {
      const pe = userMap.get(stamp.userId)
      const peName = pe ? `${pe.firstName || ''} ${pe.lastName || ''}`.trim() : ''
      const license = stamp.licenseId ? licenseMap.get(stamp.licenseId) : null

      const licenseExpired = license?.expirationDate
        ? new Date(license.expirationDate) < now
        : false

      let insuranceProvider = ''
      let insuranceExpired = false
      if (stamp.insuranceSnapshot) {
        try {
          const ins = JSON.parse(stamp.insuranceSnapshot)
          insuranceProvider = ins.provider || ''
          if (ins.expirationDate && new Date(ins.expirationDate) < now) {
            insuranceExpired = true
          }
        } catch {
          // skip
        }
      }

      return [
        stamp.id,
        stamp.status,
        stamp.projectName || '',
        stamp.jurisdictionId,
        stamp.permitNumber || '',
        peName,
        license?.licenseNumber || '',
        license?.issuingState || '',
        licenseExpired ? 'Yes' : 'No',
        insuranceProvider,
        insuranceExpired ? 'Yes' : 'No',
        stamp.scopeNotes || '',
        stamp.createdAt ? new Date(stamp.createdAt).toISOString() : '',
        stamp.revokedAt ? new Date(stamp.revokedAt).toISOString() : '',
        stamp.revokedReason || '',
        stamp.documentHash,
      ]
    })

    const escapeCsv = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const csvContent = [
      csvHeader.map(escapeCsv).join(','),
      ...csvRows.map(row => row.map(escapeCsv).join(',')),
    ].join('\n')

    const filename = `stampledger-export-${now.toISOString().slice(0, 10)}.csv`

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Municipality export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
export const runtime = 'edge'

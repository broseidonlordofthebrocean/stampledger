import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { getDb, organizations, orgMemberships } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// Helper to check if user has permission on org
async function checkOrgPermission(
  db: any,
  userId: string,
  orgId: string,
  requiredRoles: string[]
) {
  const membership = await db
    .select()
    .from(orgMemberships)
    .where(
      and(
        eq(orgMemberships.orgId, orgId),
        eq(orgMemberships.userId, userId),
        eq(orgMemberships.status, 'active')
      )
    )
    .get()

  if (!membership) return null
  if (!requiredRoles.includes(membership.role)) return null
  return membership
}

// GET /api/orgs/[id] - Get organization details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check user has access to this org
    const membership = await checkOrgPermission(
      db,
      payload.userId,
      id,
      ['owner', 'admin', 'manager', 'member', 'viewer']
    )

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const org = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .get()

    return NextResponse.json({
      organization: org,
      role: membership.role,
    })
  } catch (error) {
    console.error('Get org error:', error)
    return NextResponse.json({ error: 'Failed to get organization' }, { status: 500 })
  }
}

// PATCH /api/orgs/[id] - Update organization settings
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Only owner/admin can update org settings
    const membership = await checkOrgPermission(db, payload.userId, id, ['owner', 'admin'])
    if (!membership) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      zip,
      phone,
      website,
      logoUrl,
      billingEmail,
    } = body

    const updates: Record<string, any> = { updatedAt: new Date() }
    if (name !== undefined) updates.name = name
    if (addressLine1 !== undefined) updates.addressLine1 = addressLine1
    if (addressLine2 !== undefined) updates.addressLine2 = addressLine2
    if (city !== undefined) updates.city = city
    if (state !== undefined) updates.state = state
    if (zip !== undefined) updates.zip = zip
    if (phone !== undefined) updates.phone = phone
    if (website !== undefined) updates.website = website
    if (logoUrl !== undefined) updates.logoUrl = logoUrl
    if (billingEmail !== undefined) updates.billingEmail = billingEmail

    await db
      .update(organizations)
      .set(updates)
      .where(eq(organizations.id, id))

    const updatedOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .get()

    return NextResponse.json({ organization: updatedOrg })
  } catch (error) {
    console.error('Update org error:', error)
    return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 })
  }
}

// DELETE /api/orgs/[id] - Delete organization (owner only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Only owner can delete org
    const membership = await checkOrgPermission(db, payload.userId, id, ['owner'])
    if (!membership) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Delete org (cascades to memberships)
    await db.delete(organizations).where(eq(organizations.id, id))

    return NextResponse.json({ message: 'Organization deleted' })
  } catch (error) {
    console.error('Delete org error:', error)
    return NextResponse.json({ error: 'Failed to delete organization' }, { status: 500 })
  }
}
export const runtime = 'edge'

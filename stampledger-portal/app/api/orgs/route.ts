import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { getDb, organizations, orgMemberships } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'

// GET /api/orgs - List orgs the current user belongs to
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

    // Get all memberships for this user
    const memberships = await db
      .select({
        membership: orgMemberships,
        org: organizations,
      })
      .from(orgMemberships)
      .innerJoin(organizations, eq(orgMemberships.orgId, organizations.id))
      .where(eq(orgMemberships.userId, payload.userId))
      .orderBy(desc(orgMemberships.createdAt))

    const orgs = memberships.map((m) => ({
      ...m.org,
      role: m.membership.role,
      membershipStatus: m.membership.status,
    }))

    return NextResponse.json({ organizations: orgs })
  } catch (error) {
    console.error('Get orgs error:', error)
    return NextResponse.json({ error: 'Failed to get organizations' }, { status: 500 })
  }
}

// POST /api/orgs - Create a new organization (caller becomes owner)
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { name, orgType, slug } = body

    if (!name || !orgType) {
      return NextResponse.json(
        { error: 'Name and organization type are required' },
        { status: 400 }
      )
    }

    // Generate slug from name if not provided
    const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const db = getDb()

    // Check if slug is already taken
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .get()

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug is already taken' },
        { status: 409 }
      )
    }

    const orgId = generateId()
    const now = new Date()

    // Create organization
    await db.insert(organizations).values({
      id: orgId,
      name,
      slug: orgSlug,
      orgType,
      plan: 'free',
      storageUsedBytes: 0,
      storageLimitBytes: 1073741824, // 1 GB
      createdAt: now,
      updatedAt: now,
    })

    // Add creator as owner
    const membershipId = generateId()
    await db.insert(orgMemberships).values({
      id: membershipId,
      orgId,
      userId: payload.userId,
      role: 'owner',
      permissions: '{}',
      status: 'active',
      acceptedAt: now,
      createdAt: now,
    })

    const newOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .get()

    return NextResponse.json({
      organization: newOrg,
      message: 'Organization created successfully',
    })
  } catch (error) {
    console.error('Create org error:', error)
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}
export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken, generateId } from '@/lib/auth'
import { createDb, organizations, orgMemberships, users } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

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

// GET /api/orgs/[id]/members - List all members
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params
    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Check user has access to view members
    const membership = await checkOrgPermission(
      db,
      payload.userId,
      orgId,
      ['owner', 'admin', 'manager', 'member', 'viewer']
    )

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Get all members with user info
    const members = await db
      .select({
        membership: orgMemberships,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
          isLicensedProfessional: users.isLicensedProfessional,
        },
      })
      .from(orgMemberships)
      .innerJoin(users, eq(orgMemberships.userId, users.id))
      .where(eq(orgMemberships.orgId, orgId))
      .orderBy(desc(orgMemberships.createdAt))

    const result = members.map((m) => ({
      id: m.membership.id,
      userId: m.user.id,
      email: m.user.email,
      name: `${m.user.firstName || ''} ${m.user.lastName || ''}`.trim(),
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      avatarUrl: m.user.avatarUrl,
      isLicensedProfessional: m.user.isLicensedProfessional,
      role: m.membership.role,
      status: m.membership.status,
      invitedAt: m.membership.invitedAt,
      acceptedAt: m.membership.acceptedAt,
    }))

    return NextResponse.json({ members: result })
  } catch (error) {
    console.error('Get members error:', error)
    return NextResponse.json({ error: 'Failed to get members' }, { status: 500 })
  }
}

// POST /api/orgs/[id]/members - Invite user by email
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params
    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Only owner/admin can invite members
    const membership = await checkOrgPermission(db, payload.userId, orgId, ['owner', 'admin'])
    if (!membership) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await req.json()
    const { email, role = 'member' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const validRoles = ['admin', 'manager', 'member', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .get()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. They must register first.' },
        { status: 404 }
      )
    }

    // Check if already a member
    const existingMembership = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.orgId, orgId),
          eq(orgMemberships.userId, user.id)
        )
      )
      .get()

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 409 }
      )
    }

    // Create membership
    const membershipId = generateId()
    const now = new Date()

    await db.insert(orgMemberships).values({
      id: membershipId,
      orgId,
      userId: user.id,
      role,
      permissions: '{}',
      invitedBy: payload.userId,
      invitedAt: now,
      status: 'invited',
      createdAt: now,
    })

    // TODO: Send invitation email to user

    return NextResponse.json({
      message: 'Invitation sent',
      membership: {
        id: membershipId,
        userId: user.id,
        email: user.email,
        role,
        status: 'invited',
      },
    })
  } catch (error) {
    console.error('Invite member error:', error)
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
  }
}

// PATCH /api/orgs/[id]/members - Update member role (via query param userId)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params
    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId query param required' }, { status: 400 })
    }

    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Only owner/admin can change roles
    const membership = await checkOrgPermission(db, payload.userId, orgId, ['owner', 'admin'])
    if (!membership) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await req.json()
    const { role, permissions } = body

    const updates: Record<string, any> = {}
    if (role) {
      // Can't change owner to lower role unless you're the owner
      if (membership.role !== 'owner' && role === 'owner') {
        return NextResponse.json({ error: 'Only owner can assign owner role' }, { status: 403 })
      }
      updates.role = role
    }
    if (permissions) {
      updates.permissions = JSON.stringify(permissions)
    }

    await db
      .update(orgMemberships)
      .set(updates)
      .where(
        and(
          eq(orgMemberships.orgId, orgId),
          eq(orgMemberships.userId, targetUserId)
        )
      )

    return NextResponse.json({ message: 'Member updated' })
  } catch (error) {
    console.error('Update member error:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

// DELETE /api/orgs/[id]/members - Remove member (via query param userId)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orgId } = await params
    const { searchParams } = new URL(req.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId query param required' }, { status: 400 })
    }

    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // @ts-ignore
    const db = createDb(process.env.DB)

    // Only owner/admin can remove members
    const membership = await checkOrgPermission(db, payload.userId, orgId, ['owner', 'admin'])
    if (!membership) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Can't remove the owner
    const targetMembership = await db
      .select()
      .from(orgMemberships)
      .where(
        and(
          eq(orgMemberships.orgId, orgId),
          eq(orgMemberships.userId, targetUserId)
        )
      )
      .get()

    if (targetMembership?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove organization owner' }, { status: 403 })
    }

    await db
      .delete(orgMemberships)
      .where(
        and(
          eq(orgMemberships.orgId, orgId),
          eq(orgMemberships.userId, targetUserId)
        )
      )

    return NextResponse.json({ message: 'Member removed' })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
export const runtime = 'edge'

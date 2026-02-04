import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, signToken } from '@/lib/auth'
import { createDb, users, orgMemberships, organizations } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // @ts-ignore - Cloudflare Pages provides this
    const db = createDb(process.env.DB)

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .get()

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))

    // Generate JWT
    const token = await signToken(user.id)

    // Get user's organizations
    const memberships = await db
      .select({
        membership: orgMemberships,
        org: organizations,
      })
      .from(orgMemberships)
      .innerJoin(organizations, eq(orgMemberships.orgId, organizations.id))
      .where(eq(orgMemberships.userId, user.id))
      .orderBy(desc(orgMemberships.createdAt))

    const orgs = memberships.map((m) => ({
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
      role: m.membership.role,
    }))

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(), // Backward compatibility
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        isLicensedProfessional: user.isLicensedProfessional,
        // Legacy fields
        peLicenseNumber: user.peLicenseNumber,
        peState: user.peState,
      },
      organizations: orgs,
      token,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}

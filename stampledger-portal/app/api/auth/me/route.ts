import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractToken } from '@/lib/auth'
import { hasPassword } from '@/lib/auth'
import { getDb, users, professionalLicenses, orgMemberships, organizations, oauthAccounts, webauthnCredentials } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { isAdminEmail } from '@/lib/admin'

export async function GET(req: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization')
    const token = extractToken(authHeader)

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      )
    }

    // Verify token
    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const db = getDb()

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.userId))
      .get()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get professional licenses
    const licenses = await db
      .select()
      .from(professionalLicenses)
      .where(eq(professionalLicenses.userId, user.id))
      .orderBy(desc(professionalLicenses.createdAt))

    // Get organizations
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
      status: m.membership.status,
    }))

    // Parse disciplines for each license
    const parsedLicenses = licenses.map((l) => ({
      ...l,
      disciplines: l.disciplines ? JSON.parse(l.disciplines) : [],
    }))

    // Calculate total token count across all licenses
    const totalTokens = licenses.reduce((sum, l) => sum + (l.stampTokenCount || 0), 0)

    // Get linked OAuth accounts
    const linkedOAuth = await db.select({
      id: oauthAccounts.id,
      provider: oauthAccounts.provider,
      providerEmail: oauthAccounts.providerEmail,
      providerName: oauthAccounts.providerName,
      createdAt: oauthAccounts.createdAt,
    }).from(oauthAccounts).where(eq(oauthAccounts.userId, user.id))

    // Get WebAuthn credentials
    const waCredentials = await db.select({
      id: webauthnCredentials.id,
      deviceName: webauthnCredentials.deviceName,
      credentialDeviceType: webauthnCredentials.credentialDeviceType,
      lastUsedAt: webauthnCredentials.lastUsedAt,
      createdAt: webauthnCredentials.createdAt,
    }).from(webauthnCredentials).where(eq(webauthnCredentials.userId, user.id))

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(), // Backward compatibility
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        accountType: user.accountType,
        isLicensedProfessional: user.isLicensedProfessional,
        // Legacy fields
        peLicenseNumber: user.peLicenseNumber,
        peState: user.peState,
        pePublicKey: user.pePublicKey,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      licenses: parsedLicenses,
      organizations: orgs,
      totalTokens,
      linkedAccounts: linkedOAuth,
      webauthnCredentials: waCredentials,
      hasPassword: hasPassword(user.passwordHash),
      isAdmin: isAdminEmail(user.email),
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
export const runtime = 'edge'

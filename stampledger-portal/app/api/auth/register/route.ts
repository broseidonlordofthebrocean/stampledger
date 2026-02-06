import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, signToken, generateId } from '@/lib/auth'
import { getDb, users, professionalLicenses } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email,
      password,
      name, // Legacy support
      firstName,
      lastName,
      phone,
      peLicenseNumber,
      peState,
      licenseType,
    } = body

    // Handle name - support both old `name` and new `firstName`/`lastName`
    let userFirstName = firstName
    let userLastName = lastName || ''

    if (!userFirstName && name) {
      // Split legacy name field
      const nameParts = name.trim().split(' ')
      userFirstName = nameParts[0]
      userLastName = nameParts.slice(1).join(' ')
    }

    // Validation
    if (!email || !password || !userFirstName) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const db = getDb()

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .get()

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const now = new Date()
    const userId = generateId()

    const hasLicense = Boolean(peLicenseNumber && peState)

    await db.insert(users).values({
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      firstName: userFirstName,
      lastName: userLastName,
      phone: phone || null,
      accountType: 'individual',
      isLicensedProfessional: hasLicense,
      // Legacy fields for backward compatibility
      peLicenseNumber: peLicenseNumber || null,
      peState: peState || null,
      createdAt: now,
      updatedAt: now,
    })

    // If license info provided, create professional license record
    if (hasLicense) {
      const licenseId = generateId()
      await db.insert(professionalLicenses).values({
        id: licenseId,
        userId,
        licenseType: licenseType || 'PE',
        licenseNumber: peLicenseNumber,
        issuingState: peState.toUpperCase(),
        status: 'pending_verification',
        verificationSource: 'user_submitted',
        stampTokenCount: 0,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Generate JWT
    const token = await signToken(userId)

    return NextResponse.json({
      user: {
        id: userId,
        email: email.toLowerCase(),
        firstName: userFirstName,
        lastName: userLastName,
        name: `${userFirstName} ${userLastName}`.trim(), // For backward compatibility
        phone,
        isLicensedProfessional: hasLicense,
        peLicenseNumber,
        peState,
      },
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
export const runtime = 'edge'

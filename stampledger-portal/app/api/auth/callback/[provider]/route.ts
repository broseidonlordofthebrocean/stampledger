import { NextRequest, NextResponse } from 'next/server'
import { decodeIdToken } from 'arctic'
import { getGoogleProvider, getMicrosoftProvider, type OAuthProviderName } from '@/lib/oauth'
import { consumeChallenge } from '@/lib/auth-challenges'
import { signToken, generateId } from '@/lib/auth'
import { getDb, users, oauthAccounts } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

interface IdTokenClaims {
  sub: string
  email?: string
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: rawProvider } = await params
    const provider = rawProvider as OAuthProviderName
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL('/login?error=oauth_denied', req.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/login?error=oauth_invalid', req.url))
    }

    // Look up and consume the challenge
    const challenge = await consumeChallenge(state)
    if (!challenge || challenge.challengeType !== 'oauth_state') {
      return NextResponse.redirect(new URL('/login?error=oauth_expired', req.url))
    }

    const { codeVerifier, linkUserId } = challenge.challengeData as {
      codeVerifier: string
      linkUserId?: string
    }

    // Exchange code for tokens
    let tokens
    if (provider === 'google') {
      tokens = await getGoogleProvider().validateAuthorizationCode(code, codeVerifier)
    } else if (provider === 'microsoft') {
      tokens = await getMicrosoftProvider().validateAuthorizationCode(code, codeVerifier)
    } else {
      return NextResponse.redirect(new URL('/login?error=oauth_invalid_provider', req.url))
    }

    // Decode ID token to get user info
    const idToken = tokens.idToken()
    const claims = decodeIdToken(idToken) as IdTokenClaims

    const providerAccountId = claims.sub
    const providerEmail = claims.email || null
    const providerName = claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(' ') || null
    const providerAvatarUrl = claims.picture || null

    const db = getDb()
    const now = new Date()

    // === ACCOUNT LINKING FLOW ===
    if (linkUserId) {
      // Check this provider identity isn't already linked to another user
      const existing = await db.select().from(oauthAccounts)
        .where(and(
          eq(oauthAccounts.provider, provider),
          eq(oauthAccounts.providerAccountId, providerAccountId)
        ))
        .get()

      if (existing) {
        if (existing.userId === linkUserId) {
          return NextResponse.redirect(new URL('/settings?linked=already', req.url))
        }
        return NextResponse.redirect(new URL('/settings?error=oauth_linked_other', req.url))
      }

      // Link to existing account
      await db.insert(oauthAccounts).values({
        id: generateId(),
        userId: linkUserId,
        provider,
        providerAccountId,
        accessToken: tokens.accessToken(),
        refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
        idToken,
        providerEmail,
        providerName,
        providerAvatarUrl,
        createdAt: now,
        updatedAt: now,
      })

      return NextResponse.redirect(new URL(`/settings?linked=${provider}`, req.url))
    }

    // === LOGIN / REGISTRATION FLOW ===

    // Check if this OAuth identity is already linked
    const existingOAuth = await db.select().from(oauthAccounts)
      .where(and(
        eq(oauthAccounts.provider, provider),
        eq(oauthAccounts.providerAccountId, providerAccountId)
      ))
      .get()

    if (existingOAuth) {
      // Existing linked account — log in
      // Update tokens
      await db.update(oauthAccounts).set({
        accessToken: tokens.accessToken(),
        refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : undefined,
        accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
        idToken,
        providerEmail,
        providerName,
        providerAvatarUrl,
        updatedAt: now,
      }).where(eq(oauthAccounts.id, existingOAuth.id))

      // Update user lastLoginAt
      await db.update(users).set({ lastLoginAt: now })
        .where(eq(users.id, existingOAuth.userId))

      const token = await signToken(existingOAuth.userId)
      return NextResponse.redirect(new URL(`/oauth-callback?token=${token}`, req.url))
    }

    // Check if user with same email exists (auto-link)
    if (providerEmail) {
      const existingUser = await db.select().from(users)
        .where(eq(users.email, providerEmail.toLowerCase()))
        .get()

      if (existingUser) {
        // Auto-link OAuth to existing email user
        await db.insert(oauthAccounts).values({
          id: generateId(),
          userId: existingUser.id,
          provider,
          providerAccountId,
          accessToken: tokens.accessToken(),
          refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
          accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
          idToken,
          providerEmail,
          providerName,
          providerAvatarUrl,
          createdAt: now,
          updatedAt: now,
        })

        await db.update(users).set({ lastLoginAt: now })
          .where(eq(users.id, existingUser.id))

        const token = await signToken(existingUser.id)
        return NextResponse.redirect(new URL(`/oauth-callback?token=${token}`, req.url))
      }
    }

    // New user — create account
    const userId = generateId()
    const firstName = claims.given_name || (providerName ? providerName.split(' ')[0] : 'User')
    const lastName = claims.family_name || (providerName ? providerName.split(' ').slice(1).join(' ') : '')

    await db.insert(users).values({
      id: userId,
      email: (providerEmail || `${provider}_${providerAccountId}@oauth.local`).toLowerCase(),
      passwordHash: 'NO_PASSWORD',
      firstName,
      lastName,
      avatarUrl: providerAvatarUrl,
      accountType: 'individual',
      isLicensedProfessional: false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    })

    await db.insert(oauthAccounts).values({
      id: generateId(),
      userId,
      provider,
      providerAccountId,
      accessToken: tokens.accessToken(),
      refreshToken: tokens.hasRefreshToken() ? tokens.refreshToken() : null,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt(),
      idToken,
      providerEmail,
      providerName,
      providerAvatarUrl,
      createdAt: now,
      updatedAt: now,
    })

    const token = await signToken(userId)
    return NextResponse.redirect(new URL(`/oauth-callback?token=${token}`, req.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=oauth_failed', req.url))
  }
}

export const runtime = 'edge'

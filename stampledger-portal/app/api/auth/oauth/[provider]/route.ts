import { NextRequest, NextResponse } from 'next/server'
import { generateState, generateCodeVerifier, getGoogleProvider, getMicrosoftProvider, type OAuthProviderName } from '@/lib/oauth'
import { verifyToken } from '@/lib/auth'
import { getDb, authChallenges } from '@/lib/db'

const VALID_PROVIDERS: OAuthProviderName[] = ['google', 'microsoft']

const SCOPES: Record<OAuthProviderName, string[]> = {
  google: ['openid', 'email', 'profile'],
  microsoft: ['openid', 'email', 'profile'],
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: rawProvider } = await params
    const provider = rawProvider as OAuthProviderName

    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    // Check for account linking (user already logged in)
    let linkUserId: string | undefined
    const body = await req.json().catch(() => ({}))

    if (body.linkToken) {
      const payload = await verifyToken(body.linkToken)
      if (!payload) {
        return NextResponse.json({ error: 'Invalid link token' }, { status: 401 })
      }
      linkUserId = payload.userId
    }

    const state = generateState()
    const codeVerifier = generateCodeVerifier()

    // Store challenge with state as the ID (so callback can look it up)
    const db = getDb()
    await db.insert(authChallenges).values({
      id: state,
      challengeType: 'oauth_state',
      challengeData: JSON.stringify({ codeVerifier, provider, linkUserId }),
      userId: linkUserId || null,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      createdAt: new Date(),
    })

    // Build authorization URL
    let url: URL
    if (provider === 'google') {
      url = getGoogleProvider().createAuthorizationURL(state, codeVerifier, SCOPES.google)
    } else {
      url = getMicrosoftProvider().createAuthorizationURL(state, codeVerifier, SCOPES.microsoft)
    }

    return NextResponse.json({ url: url.toString() })
  } catch (error) {
    console.error('OAuth initiation error:', error)
    return NextResponse.json({ error: 'Failed to initiate OAuth' }, { status: 500 })
  }
}

export const runtime = 'edge'

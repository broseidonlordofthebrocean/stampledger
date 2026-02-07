import { Google, MicrosoftEntraId, generateState, generateCodeVerifier } from 'arctic'
import { getRequestContext } from '@cloudflare/next-on-pages'

export type OAuthProviderName = 'google' | 'microsoft'

function getEnv() {
  return (getRequestContext().env as Record<string, string>)
}

function getRedirectUri(provider: OAuthProviderName): string {
  const env = getEnv()
  const base = env.OAUTH_REDIRECT_BASE || 'http://localhost:3000'
  return `${base}/api/auth/callback/${provider}`
}

export function getGoogleProvider(): Google {
  const env = getEnv()
  return new Google(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    getRedirectUri('google')
  )
}

export function getMicrosoftProvider(): MicrosoftEntraId {
  const env = getEnv()
  return new MicrosoftEntraId(
    env.MICROSOFT_TENANT_ID || 'common',
    env.MICROSOFT_CLIENT_ID,
    env.MICROSOFT_CLIENT_SECRET,
    getRedirectUri('microsoft')
  )
}

export { generateState, generateCodeVerifier }

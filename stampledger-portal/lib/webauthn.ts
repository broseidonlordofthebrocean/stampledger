import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server'
import { getRequestContext } from '@cloudflare/next-on-pages'

function getConfig() {
  const env = getRequestContext().env as Record<string, string>
  return {
    rpName: env.WEBAUTHN_RP_NAME || 'StampLedger',
    rpID: env.WEBAUTHN_RP_ID || 'localhost',
    origin: env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
  }
}

export async function generateWebAuthnRegistrationOptions(params: {
  userId: string
  userEmail: string
  userName: string
  existingCredentialIds: string[]
}) {
  const config = getConfig()
  return generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userID: new TextEncoder().encode(params.userId),
    userName: params.userEmail,
    userDisplayName: params.userName,
    excludeCredentials: params.existingCredentialIds.map(id => ({
      id,
      transports: ['usb', 'nfc', 'ble', 'internal'] as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  })
}

export async function verifyWebAuthnRegistration(params: {
  response: RegistrationResponseJSON
  expectedChallenge: string
}) {
  const config = getConfig()
  return verifyRegistrationResponse({
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpID,
  })
}

export async function generateWebAuthnAuthOptions(params: {
  allowCredentials?: { id: string; transports?: AuthenticatorTransportFuture[] }[]
}) {
  const config = getConfig()
  return generateAuthenticationOptions({
    rpID: config.rpID,
    allowCredentials: params.allowCredentials,
    userVerification: 'preferred',
  })
}

export async function verifyWebAuthnAuth(params: {
  response: AuthenticationResponseJSON
  expectedChallenge: string
  credentialPublicKey: Uint8Array
  credentialCurrentCounter: number
  credentialID: string
}) {
  const config = getConfig()
  return verifyAuthenticationResponse({
    response: params.response,
    expectedChallenge: params.expectedChallenge,
    expectedOrigin: config.origin,
    expectedRPID: config.rpID,
    credential: {
      id: params.credentialID,
      publicKey: params.credentialPublicKey as any,
      counter: params.credentialCurrentCounter,
    },
  })
}

export type { RegistrationResponseJSON, AuthenticationResponseJSON, AuthenticatorTransportFuture }

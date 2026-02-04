// Browser-compatible crypto utilities

export async function hashDocument(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Generate Ed25519 key pair for PE signing
export async function generateKeyPair(): Promise<{
  publicKey: string
  privateKey: string
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'Ed25519',
    },
    true,
    ['sign', 'verify']
  )

  const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey)
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

  const publicKey = Array.from(new Uint8Array(publicKeyBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const privateKey = Array.from(new Uint8Array(privateKeyBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return { publicKey, privateKey }
}

// Sign a document hash with private key
export async function signHash(
  hash: string,
  privateKeyHex: string
): Promise<string> {
  // Convert hex to bytes
  const privateKeyBytes = new Uint8Array(
    privateKeyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  )

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBytes,
    { name: 'Ed25519' },
    false,
    ['sign']
  )

  const hashBytes = new Uint8Array(
    hash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
  )

  const signatureBuffer = await crypto.subtle.sign('Ed25519', privateKey, hashBytes)

  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

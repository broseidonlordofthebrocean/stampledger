// Cosmos SDK client for submitting stamps to the StampLedger chain.
// Uses cosmjs for transaction signing and broadcasting.
// Ed25519 PE signing uses the Web Crypto API (works on Cloudflare Workers).

import { SigningStargateClient } from '@cosmjs/stargate'
import { DirectSecp256k1HdWallet, Registry } from '@cosmjs/proto-signing'
import {
  MsgCreateStamp,
  MSG_CREATE_STAMP_TYPE_URL,
  type MsgCreateStampFields,
} from './chain-types'

// Zero-fee transaction (our chain accepts 0 fees)
const STAMP_FEE = {
  amount: [{ denom: 'stake', amount: '0' }],
  gas: '200000',
}

/**
 * Sign a document hash with an Ed25519 private key.
 * The chain verifies this signature to prove the PE authorized the stamp.
 *
 * @param pkcs8Base64 - PKCS8 DER private key, base64-encoded (from PE_SIGNING_KEY env)
 * @param documentHashHex - SHA-256 hash of the document (64 hex chars)
 * @returns Ed25519 signature as 128 hex chars
 */
export async function signDocumentHash(
  pkcs8Base64: string,
  documentHashHex: string,
): Promise<string> {
  // Decode PKCS8 DER from base64
  const binaryString = atob(pkcs8Base64)
  const pkcs8Bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    pkcs8Bytes[i] = binaryString.charCodeAt(i)
  }

  // Import Ed25519 private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pkcs8Bytes,
    { name: 'Ed25519' },
    false,
    ['sign'],
  )

  // Decode the document hash from hex to raw bytes (32 bytes)
  const hashBytes = new Uint8Array(
    documentHashHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
  )

  // Sign the hash
  const sigBuffer = await crypto.subtle.sign(
    { name: 'Ed25519' },
    privateKey,
    hashBytes,
  )
  const sigBytes = new Uint8Array(sigBuffer)

  // Return as 128-char hex string
  return Array.from(sigBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Submit a stamp to the StampLedger blockchain.
 *
 * @param rpcUrl - Chain RPC endpoint (e.g. https://rpc.stampledger.com)
 * @param mnemonic - Service account mnemonic (24 words)
 * @param peSigningKey - Ed25519 PKCS8 DER base64 (PE_SIGNING_KEY)
 * @param pePublicKeyHex - Ed25519 public key hex (PE_PUBLIC_KEY_HEX, 64 chars)
 * @param data - Stamp data
 * @returns Transaction hash and on-chain stamp ID
 */
export async function submitStampToChain(
  rpcUrl: string,
  mnemonic: string,
  peSigningKey: string,
  pePublicKeyHex: string,
  data: {
    documentHash: string
    jurisdictionId: string
    projectName?: string
    peLicenseNumber?: string
    peName?: string
    documentFilename?: string
    documentSize?: number
  },
): Promise<{ txHash: string; chainStampId: string }> {
  // 1. Create Cosmos SDK wallet from mnemonic
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: 'stamp',
  })
  const [account] = await wallet.getAccounts()

  // 2. Register custom message type
  const registry = new Registry()
  registry.register(MSG_CREATE_STAMP_TYPE_URL, MsgCreateStamp as any)

  // 3. Connect to chain
  const client = await SigningStargateClient.connectWithSigner(
    rpcUrl,
    wallet,
    { registry },
  )

  // 4. Sign document hash with Ed25519 PE key
  const signature = await signDocumentHash(peSigningKey, data.documentHash)

  // 5. Build the message
  const msgValue: MsgCreateStampFields = {
    creator: account.address,
    documentHash: data.documentHash,
    pePublicKey: pePublicKeyHex,
    signature,
    jurisdictionId: data.jurisdictionId,
    peLicenseNumber: data.peLicenseNumber || '',
    peName: data.peName || '',
    projectName: data.projectName || '',
    documentIpfsHash: '',
    documentSize: data.documentSize || 0,
    documentFilename: data.documentFilename || '',
  }

  // 6. Sign and broadcast
  const result = await client.signAndBroadcast(
    account.address,
    [{ typeUrl: MSG_CREATE_STAMP_TYPE_URL, value: msgValue }],
    STAMP_FEE,
    'StampLedger portal',
  )

  // 7. Extract stamp_id from events
  let chainStampId = ''
  const stampEvent = result.events.find(
    (e: { type: string }) => e.type === 'stamp_created',
  )
  if (stampEvent) {
    const idAttr = stampEvent.attributes.find(
      (a: { key: string }) => a.key === 'stamp_id',
    )
    if (idAttr) chainStampId = idAttr.value
  }

  client.disconnect()

  return {
    txHash: result.transactionHash,
    chainStampId,
  }
}

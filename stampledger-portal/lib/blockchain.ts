// Blockchain integration module
// Submits stamps to the StampLedger Cosmos SDK chain via cosmjs.
// Falls back to local content-hash anchoring when the chain is not configured.

/* eslint-disable @typescript-eslint/no-explicit-any */

interface BlockchainResult {
  blockchainId: string
  txHash: string | null
  method: 'local_anchor' | 'chain_rpc'
}

/**
 * Generate a content-addressable blockchain anchor from stamp data.
 * Used as the fallback ID when the chain is not available, and as
 * a deterministic reference that can be independently recomputed.
 */
async function computeAnchor(data: {
  stampId: string
  documentHash: string
  userId: string
  timestamp: string
}): Promise<string> {
  const payload = `stamp:${data.stampId}|doc:${data.documentHash}|user:${data.userId}|ts:${data.timestamp}`
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(payload))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Submit a stamp to the blockchain.
 *
 * When the chain is configured (CHAIN_RPC_URL + CHAIN_MNEMONIC + PE keys),
 * submits a properly signed Cosmos SDK transaction via cosmjs.
 *
 * Falls back to local content-hash anchor if:
 * - Chain env vars are not set
 * - RPC URL points to localhost (dev mode)
 * - Chain submission fails for any reason
 */
export async function submitToBlockchain(data: {
  stampId: string
  documentHash: string
  userId: string
  jurisdictionId: string
  projectName?: string | null
}): Promise<BlockchainResult> {
  const timestamp = new Date().toISOString()
  const anchor = await computeAnchor({
    stampId: data.stampId,
    documentHash: data.documentHash,
    userId: data.userId,
    timestamp,
  })

  // Read chain config from Cloudflare environment
  let chainRpcUrl: string | undefined
  let chainMnemonic: string | undefined
  let peSigningKey: string | undefined
  let pePublicKeyHex: string | undefined

  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages')
    const { env } = getRequestContext()
    chainRpcUrl = (env as any).CHAIN_RPC_URL
    chainMnemonic = (env as any).CHAIN_MNEMONIC
    peSigningKey = (env as any).PE_SIGNING_KEY
    pePublicKeyHex = (env as any).PE_PUBLIC_KEY_HEX
  } catch {
    // Not in Cloudflare context (local dev)
  }

  // Submit to chain if fully configured and not localhost
  const isConfigured =
    chainRpcUrl &&
    chainMnemonic &&
    peSigningKey &&
    pePublicKeyHex &&
    !chainRpcUrl.includes('localhost') &&
    !chainRpcUrl.includes('127.0.0.1')

  if (isConfigured) {
    try {
      const { submitStampToChain } = await import('./cosmos-client')

      const result = await submitStampToChain(
        chainRpcUrl!,
        chainMnemonic!,
        peSigningKey!,
        pePublicKeyHex!,
        {
          documentHash: data.documentHash,
          jurisdictionId: data.jurisdictionId,
          projectName: data.projectName || undefined,
        },
      )

      return {
        blockchainId: result.chainStampId
          ? `chain-${result.chainStampId}`
          : `chain-${anchor.slice(0, 16)}`,
        txHash: result.txHash,
        method: 'chain_rpc',
      }
    } catch (err) {
      console.warn('Chain submission failed, falling back to local anchor:', err)
    }
  }

  // Local anchor fallback — deterministic, content-addressable
  return {
    blockchainId: `anchor-${anchor.slice(0, 32)}`,
    txHash: null,
    method: 'local_anchor',
  }
}

// Blockchain integration module
// Supports: local content-hash anchoring (default) and external chain submission (optional)

interface BlockchainResult {
  blockchainId: string
  txHash: string | null
  method: 'local_anchor' | 'chain_rpc'
}

/**
 * Generate a content-addressable blockchain anchor from stamp data.
 * This creates a deterministic ID from the stamp's core data, ensuring
 * the stamp can be independently verified by recomputing the anchor.
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
 * Falls back to local content-hash anchor if no chain RPC is available or configured.
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

  // Try to get chain RPC URL from environment
  let chainRpcUrl: string | undefined
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages')
    const { env } = getRequestContext()
    chainRpcUrl = (env as any).CHAIN_RPC_URL
  } catch {
    // Not in Cloudflare context
  }

  // Skip chain submission if URL is localhost or not configured
  if (chainRpcUrl && !chainRpcUrl.includes('localhost') && !chainRpcUrl.includes('127.0.0.1')) {
    try {
      const txPayload = {
        jsonrpc: '2.0',
        method: 'broadcast_tx_commit',
        id: data.stampId,
        params: {
          tx: btoa(JSON.stringify({
            type: 'stamp/create',
            stampId: data.stampId,
            documentHash: data.documentHash,
            anchor,
            jurisdictionId: data.jurisdictionId,
            timestamp,
          })),
        },
      }

      const response = await fetch(chainRpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txPayload),
      })

      if (response.ok) {
        const result = await response.json()
        const txHash = result?.result?.hash || result?.result?.deliver_tx?.hash || null

        return {
          blockchainId: `chain-${anchor.slice(0, 16)}`,
          txHash,
          method: 'chain_rpc',
        }
      }

      console.warn('Chain RPC submission failed, falling back to local anchor:', response.status)
    } catch (err) {
      console.warn('Chain RPC error, falling back to local anchor:', err)
    }
  }

  // Local anchor fallback — deterministic, content-addressable
  return {
    blockchainId: `anchor-${anchor.slice(0, 32)}`,
    txHash: null,
    method: 'local_anchor',
  }
}

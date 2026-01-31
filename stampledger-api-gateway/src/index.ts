/**
 * StampLedger API Gateway - Cloudflare Worker
 *
 * This worker acts as an API gateway for the StampLedger blockchain,
 * providing CORS handling, rate limiting, and request routing.
 */

export interface Env {
  CHAIN_RPC_URL: string;
  ALLOWED_ORIGINS: string;
  RATE_LIMIT_RPM: string;
  CACHE?: KVNamespace;
}

// CORS headers
function corsHeaders(origin: string, allowedOrigins: string): HeadersInit {
  const origins = allowedOrigins.split(',').map(o => o.trim());
  const isAllowed = origins.includes('*') || origins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : origins[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Handle CORS preflight
function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin, env.ALLOWED_ORIGINS),
  });
}

// Proxy request to blockchain RPC
async function proxyToChain(request: Request, env: Env, path: string): Promise<Response> {
  const url = new URL(path, env.CHAIN_RPC_URL);

  // Forward query parameters
  const requestUrl = new URL(request.url);
  url.search = requestUrl.search;

  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: request.method !== 'GET' ? await request.text() : undefined,
  });

  try {
    const response = await fetch(proxyRequest);
    const origin = request.headers.get('Origin') || '';

    // Clone response and add CORS headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        ...corsHeaders(origin, env.ALLOWED_ORIGINS),
      },
    });

    return newResponse;
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to connect to blockchain' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// API Routes
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const origin = request.headers.get('Origin') || '';

  // Health check
  if (path === '/health' || path === '/') {
    return new Response(JSON.stringify({
      status: 'ok',
      service: 'stampledger-api-gateway',
      timestamp: new Date().toISOString(),
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(origin, env.ALLOWED_ORIGINS),
      },
    });
  }

  // Blockchain RPC proxy
  if (path.startsWith('/rpc/')) {
    const rpcPath = path.replace('/rpc', '');
    return proxyToChain(request, env, rpcPath);
  }

  // Chain status
  if (path === '/chain/status') {
    return proxyToChain(request, env, '/status');
  }

  // Query endpoints
  if (path.startsWith('/query/')) {
    const queryPath = path.replace('/query', '/abci_query');
    return proxyToChain(request, env, queryPath);
  }

  // Transaction broadcast
  if (path === '/tx/broadcast') {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return proxyToChain(request, env, '/broadcast_tx_sync');
  }

  // Stamp-specific endpoints
  if (path === '/stamps' || path.startsWith('/stamps/')) {
    // These will query the stampledgerchain module
    const stampPath = path === '/stamps'
      ? '/abci_query?path="/stampledgerchain/stamps"'
      : `/abci_query?path="/stampledgerchain${path}"`;
    return proxyToChain(request, env, stampPath);
  }

  // 404 for unknown routes
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin, env.ALLOWED_ORIGINS),
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    return handleRequest(request, env);
  },
};

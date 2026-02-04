// Cloudflare bindings type definitions
interface CloudflareEnv {
  DB: D1Database
  R2_BUCKET: R2Bucket
  JWT_SECRET: string
  CHAIN_RPC_URL: string
  WEB3_STORAGE_TOKEN?: string
}

// Extend Next.js types
declare global {
  namespace NodeJS {
    interface ProcessEnv extends CloudflareEnv {}
  }
}

export {}

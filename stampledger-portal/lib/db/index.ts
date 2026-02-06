import { drizzle } from 'drizzle-orm/d1'
import { getRequestContext } from '@cloudflare/next-on-pages'
import * as schema from './schema'

// D1Database type for Cloudflare Workers
interface D1Database {
  prepare(query: string): D1PreparedStatement
  dump(): Promise<ArrayBuffer>
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1ExecResult>
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run<T = unknown>(): Promise<D1Result<T>>
  all<T = unknown>(): Promise<D1Result<T>>
  raw<T = unknown>(): Promise<T[]>
}

interface D1Result<T = unknown> {
  results?: T[]
  success: boolean
  error?: string
  meta: object
}

interface D1ExecResult {
  count: number
  duration: number
}

// For Cloudflare D1, we get the database from the request context
// This function creates a database client from the D1 binding
export function createDb(d1?: D1Database) {
  // If d1 is provided directly, use it
  if (d1) {
    return drizzle(d1 as any, { schema })
  }
  // Otherwise, get from Cloudflare Pages context
  const { env } = getRequestContext()
  return drizzle((env as any).DB as any, { schema })
}

// Helper to get the database - preferred method
export function getDb() {
  const { env } = getRequestContext()
  return drizzle((env as any).DB as any, { schema })
}

// Type for the database client
export type Database = ReturnType<typeof createDb>

// Re-export schema
export * from './schema'

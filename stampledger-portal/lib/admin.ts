import { getRequestContext } from '@cloudflare/next-on-pages'

// Check if an email is in the platform admin list
export function isAdminEmail(email: string): boolean {
  try {
    const adminEmails = (getRequestContext().env as any).ADMIN_EMAILS || ''
    return adminEmails
      .split(',')
      .map((e: string) => e.trim().toLowerCase())
      .filter(Boolean)
      .includes(email.toLowerCase())
  } catch {
    return false
  }
}

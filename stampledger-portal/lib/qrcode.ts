const BASE_URL = 'https://portal.stampledger.com'

export function getVerifyUrl(stampId: string): string {
  return `${BASE_URL}/verify/${stampId}`
}

import QRCode from 'qrcode'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.stampledger.com'

export async function generateStampQR(stampId: string): Promise<string> {
  const verifyUrl = `${BASE_URL}/verify/${stampId}`

  const dataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 256,
    margin: 2,
    color: {
      dark: '#1a3a52', // Primary navy
      light: '#ffffff',
    },
    errorCorrectionLevel: 'L',
  })

  return dataUrl
}

export function getVerifyUrl(stampId: string): string {
  return `${BASE_URL}/verify/${stampId}`
}

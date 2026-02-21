'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import QRCode from 'qrcode'

interface QRCodeImageProps {
  value: string
  size?: number
  className?: string
}

export function QRCodeImage({ value, size = 256, className }: QRCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const dark = resolvedTheme === 'dark' ? '#fafafa' : '#1a3a52'
    const light = resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff'

    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: { dark, light },
      errorCorrectionLevel: 'L',
    }).then(setDataUrl)
  }, [value, size, resolvedTheme])

  if (!dataUrl) return null

  return (
    <img
      src={dataUrl}
      alt="QR Code"
      width={size}
      height={size}
      className={className}
    />
  )
}

export async function generateQRDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    width: 256,
    margin: 2,
    color: { dark: '#1a3a52', light: '#ffffff' },
    errorCorrectionLevel: 'L',
  })
}

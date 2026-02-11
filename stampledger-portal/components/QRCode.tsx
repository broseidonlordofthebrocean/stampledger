'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeImageProps {
  value: string
  size?: number
  className?: string
}

export function QRCodeImage({ value, size = 256, className }: QRCodeImageProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      color: { dark: '#1a3a52', light: '#ffffff' },
      errorCorrectionLevel: 'L',
    }).then(setDataUrl)
  }, [value, size])

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

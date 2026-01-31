import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'StampLedger - Instant PE Stamp Verification for Municipalities',
  description: 'Blockchain-secured verification for professional engineer stamps. Municipalities verify PE stamps in 3 seconds. Prevent fraud, save time, reduce liability.',
  keywords: [
    'PE stamp verification',
    'professional engineer stamps',
    'municipal software',
    'permit software',
    'building inspection',
    'blockchain government',
    'engineering stamps',
    'NEC compliance'
  ],
  openGraph: {
    title: 'StampLedger - Professional Engineer Stamp Verification',
    description: 'Instant verification for municipalities. Blockchain-secured, fraud-proof PE stamps.',
    url: 'https://stampledger.com',
    siteName: 'StampLedger',
    images: [
      {
        url: 'https://stampledger.com/og-image.png',
        width: 1200,
        height: 630,
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StampLedger - PE Stamp Verification',
    description: 'Blockchain-secured verification for municipalities',
    images: ['https://stampledger.com/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

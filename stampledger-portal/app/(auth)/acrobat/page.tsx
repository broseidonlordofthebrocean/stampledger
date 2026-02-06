'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Copy, CheckCircle, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'

export default function AcrobatAuthPage() {
  const { token } = useAuth()
  const [extensionToken, setExtensionToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateToken = async () => {
    if (!token) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/extension-token', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to generate token')
      }

      const data = await res.json()
      setExtensionToken(data.token)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    if (extensionToken) {
      navigator.clipboard.writeText(extensionToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Shield className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-primary">StampLedger</span>
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-4">
            Adobe Acrobat Extension Setup
          </h1>
          <p className="text-gray-600 mt-2">
            Generate an authentication token for the StampLedger Acrobat extension
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {!token ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                You need to be logged in to generate an extension token.
              </p>
              <Link href="/login">
                <Button>Log In</Button>
              </Link>
            </div>
          ) : !extensionToken ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">How it works</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal ml-4">
                  <li>Click &quot;Generate Token&quot; below</li>
                  <li>Copy the token that appears</li>
                  <li>In Acrobat, go to Edit &gt; StampLedger &gt; Login</li>
                  <li>Paste the token when prompted</li>
                </ol>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button
                onClick={generateToken}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Extension Token
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Token expires in 7 days. You can generate a new one anytime.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-accent" />
                  <span className="font-medium text-accent-dark">Token Generated</span>
                </div>
                <p className="text-sm text-gray-600">
                  Copy this token and paste it in Acrobat&apos;s StampLedger login dialog.
                </p>
              </div>

              <div className="relative">
                <div className="bg-gray-100 rounded-lg p-3 pr-12 font-mono text-xs break-all max-h-24 overflow-y-auto">
                  {extensionToken}
                </div>
                <button
                  onClick={copyToken}
                  className="absolute top-2 right-2 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy token"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-accent" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>

              {copied && (
                <p className="text-sm text-accent text-center">Copied to clipboard!</p>
              )}

              <Button
                variant="outline"
                onClick={() => setExtensionToken(null)}
                className="w-full"
              >
                Generate New Token
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help?{' '}
          <Link href="/integrations" className="text-cta hover:underline">
            View setup instructions
          </Link>
        </p>
      </div>
    </div>
  )
}

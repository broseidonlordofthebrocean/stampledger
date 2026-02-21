'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Copy, CheckCircle, Loader2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Shield className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-primary">StampLedger</span>
          </Link>
          <h1 className="text-xl font-semibold text-foreground mt-4">
            Adobe Acrobat Extension Setup
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate an authentication token for the StampLedger Acrobat extension
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {!token ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  You need to be logged in to generate an extension token.
                </p>
                <Link href="/login">
                  <Button>Log In</Button>
                </Link>
              </div>
            ) : !extensionToken ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">How it works</h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-400 space-y-1 list-decimal ml-4">
                    <li>Click &quot;Generate Token&quot; below</li>
                    <li>Copy the token that appears</li>
                    <li>In Acrobat, go to Edit &gt; StampLedger &gt; Login</li>
                    <li>Paste the token when prompted</li>
                  </ol>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-sm text-destructive">{error}</p>
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

                <p className="text-xs text-muted-foreground text-center">
                  Token expires in 7 days. You can generate a new one anytime.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-700 dark:text-green-300">Token Generated</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Copy this token and paste it in Acrobat&apos;s StampLedger login dialog.
                  </p>
                </div>

                <div className="relative">
                  <div className="bg-muted rounded-lg p-3 pr-12 font-mono text-xs break-all max-h-24 overflow-y-auto">
                    {extensionToken}
                  </div>
                  <button
                    onClick={copyToken}
                    className="absolute top-2 right-2 p-2 hover:bg-accent rounded-lg transition-colors"
                    title="Copy token"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {copied && (
                  <p className="text-sm text-green-600 dark:text-green-400 text-center">Copied to clipboard!</p>
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
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{' '}
          <Link href="/integrations" className="text-primary hover:underline">
            View setup instructions
          </Link>
        </p>
      </div>
    </div>
  )
}

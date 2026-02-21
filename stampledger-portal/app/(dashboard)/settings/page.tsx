'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Loader2, Shield, KeyRound, Trash2, Plus, Check, AlertCircle } from 'lucide-react'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  )
}

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  microsoft: 'Microsoft',
  apple: 'Apple',
}

export default function SettingsPage() {
  const { user, token, loginWithOAuth, linkedAccounts, webauthnCredentials, hasPassword, refreshUser } = useAuth()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [registeringKey, setRegisteringKey] = useState(false)
  const [deviceName, setDeviceName] = useState('')

  // Check for link success from OAuth callback
  useEffect(() => {
    const linked = searchParams.get('linked')
    const error = searchParams.get('error')
    if (linked && linked !== 'already') {
      setMessage({ type: 'success', text: `${PROVIDER_LABELS[linked] || linked} account linked successfully` })
      refreshUser()
    } else if (linked === 'already') {
      setMessage({ type: 'success', text: 'This account is already linked' })
    }
    if (error === 'oauth_linked_other') {
      setMessage({ type: 'error', text: 'This OAuth account is already linked to a different user' })
    }
  }, [searchParams, refreshUser])

  const handleLinkOAuth = async (provider: 'google' | 'microsoft') => {
    setMessage(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/auth/oauth/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkToken: token }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to initiate linking')
      }
      const data = await res.json()
      window.location.href = data.url
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to link account' })
      setLoading(false)
    }
  }

  const handleUnlink = async (id: string) => {
    setMessage(null)
    try {
      const res = await fetch(`/api/auth/linked-accounts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to unlink')
      }
      await refreshUser()
      setMessage({ type: 'success', text: 'Account unlinked successfully' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to unlink' })
    }
  }

  const handleRegisterKey = async () => {
    setMessage(null)
    setRegisteringKey(true)
    try {
      const { startRegistration, browserSupportsWebAuthn } = await import('@simplewebauthn/browser')

      if (!browserSupportsWebAuthn()) {
        throw new Error('Your browser does not support security keys')
      }

      // Get registration options
      const optionsRes = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!optionsRes.ok) {
        const data = await optionsRes.json()
        throw new Error(data.error || 'Failed to get registration options')
      }
      const { options, challengeId } = await optionsRes.json()

      // Trigger browser prompt
      const regResponse = await startRegistration({ optionsJSON: options })

      // Verify
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          challengeId,
          response: regResponse,
          deviceName: deviceName || undefined,
        }),
      })

      if (!verifyRes.ok) {
        const data = await verifyRes.json()
        throw new Error(data.error || 'Failed to register key')
      }

      setDeviceName('')
      await refreshUser()
      setMessage({ type: 'success', text: 'Security key registered successfully' })
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setMessage({ type: 'error', text: 'Security key registration was cancelled' })
      } else {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to register key' })
      }
    } finally {
      setRegisteringKey(false)
    }
  }

  const linkedProviders = linkedAccounts.map(a => a.provider)

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Account & Security</h1>
        <p className="text-muted-foreground mt-1">Manage your sign-in methods and security settings</p>
      </div>

      {message && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm border flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-destructive/10 text-destructive border-destructive/20'
        }`}>
          {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      {/* Account Info */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{user?.firstName} {user?.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Password</span>
            <span className="font-medium">{hasPassword ? 'Set' : 'Not set (OAuth only)'}</span>
          </div>
        </div>
      </div>

      {/* Linked Accounts */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Linked Accounts</h2>
        </div>

        <div className="space-y-3">
          {linkedAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between py-3 px-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {account.provider === 'google' && <GoogleIcon className="h-5 w-5" />}
                {account.provider === 'microsoft' && <MicrosoftIcon className="h-5 w-5" />}
                <div>
                  <p className="text-sm font-medium">{PROVIDER_LABELS[account.provider] || account.provider}</p>
                  <p className="text-xs text-muted-foreground">{account.providerEmail}</p>
                </div>
              </div>
              <button
                onClick={() => handleUnlink(account.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                title="Unlink account"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Link buttons for providers not yet linked */}
          <div className="flex gap-2 pt-2">
            {!linkedProviders.includes('google') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLinkOAuth('google')}
                disabled={loading}
                className="gap-2"
              >
                <GoogleIcon className="h-4 w-4" />
                Link Google
              </Button>
            )}
            {!linkedProviders.includes('microsoft') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLinkOAuth('microsoft')}
                disabled={loading}
                className="gap-2"
              >
                <MicrosoftIcon className="h-4 w-4" />
                Link Microsoft
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Security Keys */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Security Keys</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Use hardware security keys (YubiKey), smart cards (CAC/PIV), or platform authenticators (Windows Hello, Touch ID) to sign in.
        </p>

        <div className="space-y-3">
          {webauthnCredentials.map((cred) => (
            <div key={cred.id} className="flex items-center justify-between py-3 px-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{cred.deviceName || 'Security Key'}</p>
                  <p className="text-xs text-muted-foreground">
                    {cred.credentialDeviceType === 'multiDevice' ? 'Multi-device' : 'Single-device'}
                    {cred.lastUsedAt ? ` · Last used ${new Date(cred.lastUsedAt).toLocaleDateString()}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUnlink(cred.id)}
                className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                title="Remove key"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {/* Register new key */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Key name (optional)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="h-9 px-3 text-sm rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegisterKey}
              disabled={registeringKey}
              className="gap-2 whitespace-nowrap"
            >
              {registeringKey ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Register Key
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

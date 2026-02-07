'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Mail, Lock, ArrowRight, Play, KeyRound } from 'lucide-react'

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

export default function LoginPage() {
  const { login, demoLogin, loginWithOAuth, loginWithWebAuthn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [webauthnLoading, setWebauthnLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setError('')
    setDemoLoading(true)
    try {
      await demoLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed')
    } finally {
      setDemoLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'microsoft') => {
    setError('')
    setOauthLoading(provider)
    try {
      await loginWithOAuth(provider)
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`)
      setOauthLoading(null)
    }
  }

  const handleWebAuthn = async () => {
    setError('')
    setWebauthnLoading(true)
    try {
      await loginWithWebAuthn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Security key sign-in failed')
    } finally {
      setWebauthnLoading(false)
    }
  }

  const anyLoading = loading || demoLoading || !!oauthLoading || webauthnLoading

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Welcome back
        </h1>
        <p className="text-gray-500 mt-2">
          Sign in to continue to your dashboard
        </p>
      </div>

      {/* Demo Access */}
      <button
        onClick={handleDemo}
        disabled={anyLoading}
        className="w-full mb-6 p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all group disabled:opacity-50"
      >
        <div className="flex items-center justify-center gap-3">
          {demoLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Play className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="text-left">
            <p className="font-semibold text-primary text-sm">
              {demoLoading ? 'Setting up demo...' : 'Try the Demo'}
            </p>
            <p className="text-xs text-gray-500">
              Explore with sample data - no account needed
            </p>
          </div>
        </div>
      </button>

      {/* OAuth Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => handleOAuth('google')}
          disabled={anyLoading}
          className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium text-gray-700"
        >
          {oauthLoading === 'google' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <GoogleIcon className="h-5 w-5" />
          )}
          Continue with Google
        </button>
        <button
          onClick={() => handleOAuth('microsoft')}
          disabled={anyLoading}
          className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium text-gray-700"
        >
          {oauthLoading === 'microsoft' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MicrosoftIcon className="h-5 w-5" />
          )}
          Continue with Microsoft
        </button>
        <button
          onClick={handleWebAuthn}
          disabled={anyLoading}
          className="w-full flex items-center justify-center gap-3 h-11 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm font-medium text-gray-700"
        >
          {webauthnLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <KeyRound className="h-5 w-5 text-gray-600" />
          )}
          Sign in with Security Key
        </button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-gray-50 text-gray-400">or sign in with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-3 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="input-label">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="pl-12"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary-light transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="pl-12"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={anyLoading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-gray-600">
          New to StampLedger?{' '}
          <Link
            href="/register"
            className="text-primary font-semibold hover:text-primary-light transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

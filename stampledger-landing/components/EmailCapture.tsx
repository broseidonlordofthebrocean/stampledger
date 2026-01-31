'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { CheckCircle, Loader2 } from 'lucide-react'

interface EmailCaptureProps {
  title?: string
  description?: string
  showRoleField?: boolean
  showOrgField?: boolean
  ctaText?: string
  variant?: 'default' | 'minimal'
}

export default function EmailCapture({
  title = "Join the Beta Program",
  description = "We're launching in Wisconsin Q2 2026. Be the first to modernize your permit process.",
  showRoleField = true,
  showOrgField = true,
  ctaText = "Request Beta Access",
  variant = 'default'
}: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [org, setOrg] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, org, role })
      })

      if (res.ok) {
        setStatus('success')
        setMessage("Thanks! We'll be in touch soon.")
        setEmail('')
        setOrg('')
        setRole('')
      } else {
        throw new Error('Subscription failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-accent/10 border border-accent/30 rounded-xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
        <p className="text-accent-dark font-semibold text-lg">{message}</p>
        <p className="text-gray-600 mt-2">Check your email for confirmation.</p>
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
          className="flex-1"
        />
        <Button type="submit" disabled={status === 'loading'} size="lg">
          {status === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            ctaText
          )}
        </Button>
      </form>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg relative overflow-hidden" id="signup">
      {/* Urgency badge - scarcity increases conversions */}
      <div className="absolute top-0 right-0 bg-cta text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
        Only 3 pilot spots left
      </div>

      <h3 className="text-2xl font-bold text-primary mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
        />

        {showOrgField && (
          <Input
            type="text"
            placeholder="Organization (optional)"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            disabled={status === 'loading'}
          />
        )}

        {showRoleField && (
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={status === 'loading'}
          >
            <option value="">Select your role (optional)</option>
            <option value="inspector">Building Inspector</option>
            <option value="it">IT Director</option>
            <option value="admin">City Administrator</option>
            <option value="pe">PE Engineer</option>
            <option value="other">Other</option>
          </Select>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            ctaText
          )}
        </Button>

        {status === 'error' && (
          <p className="text-red-600 text-sm text-center">{message}</p>
        )}

        <p className="text-xs text-gray-500 text-center">
          No spam, unsubscribe anytime. We respect your privacy.
        </p>
      </form>
    </div>
  )
}

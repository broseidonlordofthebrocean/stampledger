'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Loader2, Shield } from 'lucide-react'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export default function RegisterPage() {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    peLicenseNumber: '',
    peState: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || undefined,
        peLicenseNumber: formData.peLicenseNumber || undefined,
        peState: formData.peState || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-primary">Create Account</h1>
        <p className="text-gray-600 mt-2">Register your account on StampLedger</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="input-label">
              First Name
            </label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="input-label">
              Last Name
            </label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Smith"
              value={formData.lastName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="input-label">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="phone" className="input-label">
            Phone (Optional)
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="peState" className="input-label">
              PE State (Optional)
            </label>
            <Select
              id="peState"
              name="peState"
              value={formData.peState}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select state</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="peLicenseNumber" className="input-label">
              PE License # (Optional)
            </label>
            <Input
              id="peLicenseNumber"
              name="peLicenseNumber"
              type="text"
              placeholder="123456"
              value={formData.peLicenseNumber}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          PE license info is optional during registration. You can add licenses later in your profile.
        </p>

        <div>
          <label htmlFor="password" className="input-label">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="input-label">
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      <p className="text-center text-gray-600 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-cta hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}

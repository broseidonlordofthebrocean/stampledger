'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2 } from 'lucide-react'

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { handleOAuthCallback } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('No authentication token received')
      setTimeout(() => router.push('/login'), 2000)
      return
    }

    handleOAuthCallback(token)
      .then(() => {
        router.push('/')
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setTimeout(() => router.push('/login'), 2000)
      })
  }, [searchParams, handleOAuthCallback, router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
        <p className="text-gray-400 text-sm mt-4">Redirecting to login...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-gray-600">Completing sign in...</p>
    </div>
  )
}

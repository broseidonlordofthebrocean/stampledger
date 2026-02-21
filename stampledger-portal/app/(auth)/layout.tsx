'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Loader2, Shield, FileCheck, GitBranch, Lock } from 'lucide-react'

const features = [
  {
    icon: FileCheck,
    title: 'Digital Stamping',
    description: 'Securely stamp engineering documents with blockchain verification',
  },
  {
    icon: GitBranch,
    title: 'Spec Tracking',
    description: 'Track specification changes across all your projects automatically',
  },
  {
    icon: Lock,
    title: 'Compliance Ready',
    description: 'Stay compliant with real-time monitoring and audit trails',
  },
]

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-primary relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-secondary/20 blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center">
            <div className="bg-white/20 p-2 rounded-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold text-white">StampLedger</span>
          </div>

          {/* Main content */}
          <div className="max-w-lg">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Professional Engineering,
              <br />
              <span className="text-white/80">Verified on Chain</span>
            </h1>
            <p className="text-lg text-white/70 mb-10">
              The modern platform for PE stamp management, document verification,
              and specification tracking.
            </p>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start">
                  <div className="bg-white/10 p-2 rounded-lg mr-4 flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-white/60">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/40 text-sm">
            Trusted by engineering firms nationwide
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex flex-1 flex-col justify-center py-12 px-6 sm:px-12 lg:px-16 xl:px-24 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="bg-primary/10 p-3 rounded-xl">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <span className="ml-3 text-2xl font-bold text-primary">StampLedger</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

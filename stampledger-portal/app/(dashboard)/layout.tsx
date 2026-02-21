'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AppSidebar } from '@/components/app-sidebar'
import { TopNavbar } from '@/components/top-navbar'
import { MobileSidebar } from '@/components/mobile-sidebar'
import { Loader2 } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />
      <div className="md:pl-64">
        <TopNavbar onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}

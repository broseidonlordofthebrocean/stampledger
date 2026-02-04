'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Stamp,
  FileText,
  GitBranch,
  LogOut,
  Menu,
  X,
  Shield,
  User,
  Building2,
  FolderKanban,
  Layers,
  ClipboardCheck,
  Bell,
  ChevronDown,
  Check,
  Coins,
  Award,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stamps', label: 'Stamps', icon: Stamp },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/programs', label: 'Programs', icon: Layers },
  { href: '/specifications', label: 'Master Specs', icon: GitBranch },
  { href: '/compliance', label: 'Compliance', icon: ClipboardCheck },
]

const settingsItems = [
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/licenses', label: 'Licenses', icon: Award },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user, logout, organizations, currentOrg, switchOrg, totalTokens } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOrgDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOrgSwitch = (orgId: string) => {
    switchOrg(orgId)
    setOrgDropdownOpen(false)
  }

  const activeOrgs = organizations.filter((o) => o.status === 'active')

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-primary">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-primary-light">
            <Shield className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">StampLedger</span>
          </div>

          {/* Organization Selector */}
          {activeOrgs.length > 0 && (
            <div className="px-3 py-3 border-b border-primary-light" ref={dropdownRef}>
              <button
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <div className="flex items-center min-w-0">
                  <Building2 className="h-4 w-4 text-white/70 mr-2 flex-shrink-0" />
                  <span className="text-white truncate">
                    {currentOrg?.name || 'Select Organization'}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-white/70 transition-transform flex-shrink-0",
                  orgDropdownOpen && "rotate-180"
                )} />
              </button>

              {/* Dropdown */}
              {orgDropdownOpen && (
                <div className="absolute left-3 right-3 mt-1 bg-white rounded-lg shadow-lg py-1 z-50 max-h-60 overflow-y-auto">
                  {activeOrgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSwitch(org.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 transition-colors",
                        currentOrg?.id === org.id && "bg-blue-50"
                      )}
                    >
                      <div className="flex items-center min-w-0">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-gray-900 truncate">{org.name}</span>
                        <span className="ml-2 text-xs text-gray-400 capitalize">{org.role}</span>
                      </div>
                      {currentOrg?.id === org.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <Link
                      href="/organizations"
                      onClick={() => setOrgDropdownOpen(false)}
                      className="w-full flex items-center px-3 py-2 text-sm text-primary hover:bg-gray-100 transition-colors"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Manage Organizations
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}

            {/* Settings Section */}
            <div className="pt-4 mt-4 border-t border-primary-light">
              <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Settings
              </p>
              {settingsItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Token Count & User section */}
          <div className="border-t border-primary-light">
            {/* Token Count */}
            {totalTokens > 0 && (
              <div className="px-4 py-3 border-b border-primary-light">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-white/70">
                    <Coins className="h-4 w-4 mr-2" />
                    <span>Stamp Tokens</span>
                  </div>
                  <span className="font-semibold text-white">{totalTokens.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="p-4">
              <div className="flex items-center">
                <div className="bg-white/20 p-2 rounded-full">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-white/60 truncate">
                    {user?.peLicenseNumber ? `PE ${user.peState}-${user.peLicenseNumber}` : user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-4 flex items-center w-full px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-primary">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-white" />
            <span className="ml-2 text-xl font-bold text-white">StampLedger</span>
          </div>
          <div className="flex items-center space-x-2">
            {totalTokens > 0 && (
              <div className="flex items-center text-white/70 text-sm mr-2">
                <Coins className="h-4 w-4 mr-1" />
                <span>{totalTokens}</span>
              </div>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-white p-2"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-primary pt-16 overflow-y-auto">
          {/* Org Selector Mobile */}
          {activeOrgs.length > 0 && (
            <div className="px-4 py-3 border-b border-primary-light">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Organization
              </p>
              <div className="space-y-1">
                {activeOrgs.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      handleOrgSwitch(org.id)
                      setMobileOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors",
                      currentOrg?.id === org.id
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      <span>{org.name}</span>
                    </div>
                    {currentOrg?.id === org.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <nav className="px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}

            {/* Settings Section Mobile */}
            <div className="pt-4 mt-4 border-t border-primary-light">
              <p className="px-4 text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                Settings
              </p>
              {settingsItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-primary-light p-4">
            <div className="flex items-center mb-4">
              <div className="bg-white/20 p-2 rounded-full">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-white/60">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="w-full border-white/30 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

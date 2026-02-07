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
  ChevronDown,
  Check,
  Coins,
  Award,
  Settings,
  Puzzle,
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
  { href: '/integrations', label: 'Integrations', icon: Puzzle },
]

const settingsItems = [
  { href: '/settings', label: 'Account & Security', icon: Shield },
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/licenses', label: 'Licenses', icon: Award },
]

export function DashboardNav() {
  const pathname = usePathname()
  const { user, logout, organizations, currentOrg, switchOrg, totalTokens } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-gradient-to-b from-primary via-primary to-primary-dark">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="flex items-center h-16 px-5 border-b border-white/10">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-white tracking-tight">StampLedger</span>
          </div>

          {/* Organization Selector */}
          {activeOrgs.length > 0 && (
            <div className="px-3 py-3 border-b border-white/10" ref={dropdownRef}>
              <button
                onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10"
              >
                <div className="flex items-center min-w-0">
                  <div className="bg-white/10 p-1.5 rounded-lg mr-2.5">
                    <Building2 className="h-4 w-4 text-white/80" />
                  </div>
                  <span className="text-white truncate font-medium">
                    {currentOrg?.name || 'Select Organization'}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-white/50 transition-transform duration-200 flex-shrink-0",
                  orgDropdownOpen && "rotate-180"
                )} />
              </button>

              {/* Dropdown */}
              {orgDropdownOpen && (
                <div className="absolute left-3 right-3 mt-2 bg-white rounded-xl shadow-xl py-2 z-50 max-h-60 overflow-y-auto border border-gray-100">
                  {activeOrgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSwitch(org.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors",
                        currentOrg?.id === org.id && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center min-w-0">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2.5 flex-shrink-0" />
                        <span className="text-gray-900 truncate font-medium">{org.name}</span>
                        <span className="ml-2 text-xs text-gray-400 capitalize bg-gray-100 px-1.5 py-0.5 rounded">{org.role}</span>
                      </div>
                      {currentOrg?.id === org.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 mt-2 pt-2 mx-2">
                    <Link
                      href="/organizations"
                      onClick={() => setOrgDropdownOpen(false)}
                      className="w-full flex items-center px-2 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Organizations
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg mr-3 transition-colors",
                    isActive ? "bg-primary/10" : "bg-white/5 group-hover:bg-white/10"
                  )}>
                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-white/80")} />
                  </div>
                  {item.label}
                </Link>
              )
            })}

            {/* Settings Section */}
            <div className="pt-6 mt-4">
              <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
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
                      'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <div className={cn(
                      "p-1.5 rounded-lg mr-3 transition-colors",
                      isActive ? "bg-primary/10" : "bg-white/5 group-hover:bg-white/10"
                    )}>
                      <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-white/80")} />
                    </div>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer Section */}
          <div className="border-t border-white/10">
            {/* Token Count */}
            {totalTokens > 0 && (
              <div className="mx-3 mt-3 mb-2 px-3 py-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-white/60 text-sm">
                    <Coins className="h-4 w-4 mr-2" />
                    <span>Stamp Tokens</span>
                  </div>
                  <span className="font-bold text-white text-lg">{totalTokens.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* User Info */}
            <div className="p-3">
              <div className="flex items-center p-2 rounded-xl bg-white/5">
                <div className="bg-gradient-to-br from-secondary to-secondary-light p-2 rounded-lg">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-2 flex items-center justify-center w-full px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-primary to-primary-dark">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-white">StampLedger</span>
          </div>
          <div className="flex items-center space-x-2">
            {totalTokens > 0 && (
              <div className="flex items-center text-white/70 text-sm mr-2 bg-white/10 px-2.5 py-1 rounded-lg">
                <Coins className="h-4 w-4 mr-1.5" />
                <span className="font-medium">{totalTokens}</span>
              </div>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-gradient-to-b from-primary via-primary to-primary-dark pt-16 overflow-y-auto">
          {/* Org Selector Mobile */}
          {activeOrgs.length > 0 && (
            <div className="px-4 py-4 border-b border-white/10">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">
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
                      "w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl transition-all duration-200",
                      currentOrg?.id === org.id
                        ? "bg-white text-primary shadow-sm"
                        : "text-white/70 hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center">
                      <Building2 className={cn("h-4 w-4 mr-3", currentOrg?.id === org.id ? "text-primary" : "text-white/60")} />
                      <span className="font-medium">{org.name}</span>
                    </div>
                    {currentOrg?.id === org.id && (
                      <Check className="h-4 w-4 text-primary" />
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
                    'flex items-center px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-200',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary" : "text-white/60")} />
                  {item.label}
                </Link>
              )
            })}

            {/* Settings Section Mobile */}
            <div className="pt-6 mt-4">
              <p className="px-4 text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">
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
                      'flex items-center px-4 py-3.5 text-base font-medium rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 mr-3", isActive ? "text-primary" : "text-white/60")} />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-4 bg-primary-dark/50 backdrop-blur-sm">
            <div className="flex items-center p-3 rounded-xl bg-white/5 mb-3">
              <div className="bg-gradient-to-br from-secondary to-secondary-light p-2 rounded-lg">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-white/50">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={logout}
              className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl"
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

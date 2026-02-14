'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string // Computed for backward compatibility
  phone?: string
  avatarUrl?: string
  isLicensedProfessional: boolean
  peLicenseNumber?: string
  peState?: string
  pePublicKey?: string
}

interface Organization {
  id: string
  name: string
  slug: string
  role: string
  status?: string
}

interface License {
  id: string
  licenseType: string
  licenseNumber: string
  issuingState: string
  status: string
  stampTokenCount: number
  expirationDate?: string
  verificationUrl?: string
  verificationSource?: string
  lastVerifiedAt?: string
  disciplines?: string[]
  createdAt?: string
  insuranceProvider?: string
  insurancePolicyNumber?: string
  insuranceCoverageAmount?: number
  insuranceExpirationDate?: string
}

interface LinkedAccount {
  id: string
  provider: string
  providerEmail: string | null
  providerName: string | null
  createdAt: string
}

interface WebAuthnCredentialInfo {
  id: string
  deviceName: string | null
  credentialDeviceType: string
  lastUsedAt: string | null
  createdAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  isAdmin: boolean
  organizations: Organization[]
  currentOrg: Organization | null
  licenses: License[]
  totalTokens: number
  linkedAccounts: LinkedAccount[]
  webauthnCredentials: WebAuthnCredentialInfo[]
  hasPassword: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  demoLogin: () => Promise<void>
  loginWithOAuth: (provider: 'google' | 'microsoft') => Promise<void>
  loginWithWebAuthn: (email?: string) => Promise<void>
  handleOAuthCallback: (token: string) => Promise<void>
  logout: () => void
  switchOrg: (orgId: string) => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  peLicenseNumber?: string
  peState?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [licenses, setLicenses] = useState<License[]>([])
  const [totalTokens, setTotalTokens] = useState(0)
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [webauthnCredentials, setWebauthnCredentials] = useState<WebAuthnCredentialInfo[]>([])
  const [userHasPassword, setUserHasPassword] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  // Load user from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedOrgId = localStorage.getItem('currentOrgId')
    if (savedToken) {
      setToken(savedToken)
      fetchUser(savedToken, savedOrgId)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (authToken: string, savedOrgId?: string | null) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setOrganizations(data.organizations || [])
        setLicenses(data.licenses || [])
        setTotalTokens(data.totalTokens || 0)
        setLinkedAccounts(data.linkedAccounts || [])
        setWebauthnCredentials(data.webauthnCredentials || [])
        setUserHasPassword(data.hasPassword !== false)
        setIsAdmin(data.isAdmin === true)

        // Set current org from saved or first active org
        if (data.organizations?.length > 0) {
          const targetOrgId = savedOrgId || localStorage.getItem('currentOrgId')
          const activeOrgs = data.organizations.filter((o: Organization) => o.status === 'active')
          const savedOrg = targetOrgId
            ? activeOrgs.find((o: Organization) => o.id === targetOrgId)
            : null
          const defaultOrg = savedOrg || activeOrgs[0] || null
          setCurrentOrg(defaultOrg)
          if (defaultOrg) {
            localStorage.setItem('currentOrgId', defaultOrg.id)
          }
        }
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token')
        localStorage.removeItem('currentOrgId')
        setToken(null)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('token')
      localStorage.removeItem('currentOrgId')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token)
    }
  }

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Login failed')
    }

    const data = await res.json()
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    setOrganizations(data.organizations || [])

    // Set first org as current
    if (data.organizations?.length > 0) {
      const activeOrgs = data.organizations.filter((o: Organization) => o.status === 'active')
      if (activeOrgs.length > 0) {
        setCurrentOrg(activeOrgs[0])
        localStorage.setItem('currentOrgId', activeOrgs[0].id)
      }
    }

    router.push('/')
  }

  const register = async (registerData: RegisterData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Registration failed')
    }

    const data = await res.json()
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    router.push('/')
  }

  const demoLogin = async () => {
    const res = await fetch('/api/auth/demo', {
      method: 'POST',
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Demo login failed')
    }

    const data = await res.json()
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)

    // Fetch full user data (orgs, licenses, etc.)
    await fetchUser(data.token)

    router.push('/')
  }

  const loginWithOAuth = async (provider: 'google' | 'microsoft') => {
    const res = await fetch(`/api/auth/oauth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Failed to initiate OAuth')
    }

    const data = await res.json()
    window.location.href = data.url
  }

  const handleOAuthCallback = async (callbackToken: string) => {
    localStorage.setItem('token', callbackToken)
    setToken(callbackToken)
    await fetchUser(callbackToken)
  }

  const loginWithWebAuthn = async (email?: string) => {
    // Dynamic import to avoid bundling in non-supporting browsers
    const { startAuthentication, browserSupportsWebAuthn } = await import('@simplewebauthn/browser')

    if (!browserSupportsWebAuthn()) {
      throw new Error('Your browser does not support security key authentication')
    }

    // Get authentication options
    const optionsRes = await fetch('/api/auth/webauthn/authenticate/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!optionsRes.ok) {
      const data = await optionsRes.json()
      throw new Error(data.error || 'Failed to get authentication options')
    }

    const { options, challengeId } = await optionsRes.json()

    // Trigger the browser prompt
    const authResponse = await startAuthentication({ optionsJSON: options })

    // Verify with the server
    const verifyRes = await fetch('/api/auth/webauthn/authenticate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, response: authResponse }),
    })

    if (!verifyRes.ok) {
      const data = await verifyRes.json()
      throw new Error(data.error || 'Security key verification failed')
    }

    const data = await verifyRes.json()
    localStorage.setItem('token', data.token)
    setToken(data.token)
    await fetchUser(data.token)
    router.push('/')
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentOrgId')
    setToken(null)
    setUser(null)
    setOrganizations([])
    setCurrentOrg(null)
    setLicenses([])
    setTotalTokens(0)
    setLinkedAccounts([])
    setWebauthnCredentials([])
    setUserHasPassword(true)
    setIsAdmin(false)
    router.push('/login')
  }

  const switchOrg = (orgId: string) => {
    const org = organizations.find((o) => o.id === orgId)
    if (org) {
      setCurrentOrg(org)
      localStorage.setItem('currentOrgId', orgId)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        organizations,
        currentOrg,
        licenses,
        totalTokens,
        login,
        register,
        demoLogin,
        loginWithOAuth,
        loginWithWebAuthn,
        handleOAuthCallback,
        logout,
        switchOrg,
        refreshUser,
        linkedAccounts,
        webauthnCredentials,
        hasPassword: userHasPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

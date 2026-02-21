'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Award,
  Plus,
  Calendar,
  MapPin,
  Hash,
  Coins,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Loader2,
  Shield,
  Briefcase,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'

// State board lookup URLs (subset used for UI links)
const STATE_BOARD_URLS: Record<string, string> = {
  AL: 'https://www.bels.alabama.gov/search/',
  AK: 'https://www.commerce.alaska.gov/cbp/main/search/professional',
  AZ: 'https://btr.az.gov/licensee-search',
  AR: 'https://www.pels.arkansas.gov/verify-a-license/',
  CA: 'https://www.bpelsg.ca.gov/consumers/lic_lookup.shtml',
  CO: 'https://apps.colorado.gov/dora/licensing/Lookup/LicenseLookup.aspx',
  CT: 'https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx',
  DE: 'https://delpros.delaware.gov/OH_VerifyLicense',
  FL: 'https://www.myfloridalicense.com/wl11.asp',
  GA: 'https://sos.ga.gov/PLB/PLBSearch.aspx',
  HI: 'https://pvl.ehawaii.gov/pvlsearch/',
  ID: 'https://isee.ibol.idaho.gov/',
  IL: 'https://ilesonline.idfpr.illinois.gov/DPR/Lookup/LicenseLookup.aspx',
  IN: 'https://mylicense.in.gov/everification/',
  IA: 'https://plb.iowa.gov/licensee-search',
  KS: 'https://www.kansas.gov/btp-verify/',
  KY: 'https://elicensing.ky.gov/verification/',
  LA: 'https://www.lapels.com/LicenseeSearch.aspx',
  ME: 'https://www.pfr.maine.gov/ALMSOnline/ALMSQuery/SearchIndividual.aspx',
  MD: 'https://www.dllr.state.md.us/cgi-bin/ElectronicLicensing/OP_Search/OP_search.cgi',
  MA: 'https://www.mass.gov/how-to/check-a-professional-engineers-license',
  MI: 'https://aca-prod.accela.com/MILARA/GeneralProperty/PropertyLookUp.aspx',
  MN: 'https://mn.gov/aelslagid/roster.html',
  MS: 'https://www.pepls.ms.gov/verification/',
  MO: 'https://pr.mo.gov/licensee-search.asp',
  MT: 'https://ebizws.mt.gov/PUBLICPORTAL/',
  NE: 'https://www.nebraska.gov/LISSearch/search.cgi',
  NV: 'https://nvbpels.org/verify-a-license/',
  NH: 'https://nhlicenses.nh.gov/',
  NJ: 'https://newjersey.mylicense.com/verification/',
  NM: 'https://www.rld.nm.gov/boards-and-commissions/engineering-and-surveying/',
  NY: 'http://www.op.nysed.gov/opsearches.htm',
  NC: 'https://www.ncbels.org/licensee-roster',
  ND: 'https://www.ndpelsboard.org/verify',
  OH: 'https://elicense.ohio.gov/oh_verifylicense',
  OK: 'https://www.pels.ok.gov/verify/',
  OR: 'https://www.oregon.gov/osbeels/Pages/Verify-a-License.aspx',
  PA: 'https://www.pals.pa.gov/#/page/search',
  RI: 'https://elicensing.ri.gov/Lookup/LicenseLookup.aspx',
  SC: 'https://verify.llr.sc.gov/',
  SD: 'https://dlr.sd.gov/bdcomm/engineer/pe_roster.aspx',
  TN: 'https://verify.tn.gov/',
  TX: 'https://pels.texas.gov/roster/pesearch.html',
  UT: 'https://secure.utah.gov/llv/search/index.html',
  VT: 'https://sos.vermont.gov/opr/engineers/',
  VA: 'https://www.dpor.virginia.gov/LicenseLookup',
  WA: 'https://fortress.wa.gov/lni/bbip/',
  WV: 'https://www.wvpebd.org/verify',
  WI: 'https://licensesearch.wi.gov/',
  WY: 'https://engineersandsurveyors.wyo.gov/verify-a-license',
  DC: 'https://dcra.dc.gov/service/verify-license',
}

const LICENSE_TYPES = [
  { value: 'PE', label: 'Professional Engineer (PE)' },
  { value: 'SE', label: 'Structural Engineer (SE)' },
  { value: 'LS', label: 'Land Surveyor (LS)' },
  { value: 'PLS', label: 'Professional Land Surveyor (PLS)' },
  { value: 'RA', label: 'Registered Architect (RA)' },
  { value: 'GE', label: 'Geotechnical Engineer (GE)' },
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

export default function LicensesPage() {
  const { token, licenses, totalTokens, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<{
    licenseId: string
    verified: boolean
    message: string
  } | null>(null)

  const [createForm, setCreateForm] = useState({
    licenseType: 'PE',
    licenseNumber: '',
    issuingState: '',
    expirationDate: '',
    verificationUrl: '',
    disciplines: [] as string[],
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceCoverageAmount: '',
    insuranceExpirationDate: '',
  })

  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...createForm,
          insuranceCoverageAmount: createForm.insuranceCoverageAmount
            ? parseInt(createForm.insuranceCoverageAmount, 10)
            : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add license')
      }

      const data = await res.json()
      setShowAddModal(false)
      setCreateForm({
        licenseType: 'PE',
        licenseNumber: '',
        issuingState: '',
        expirationDate: '',
        verificationUrl: '',
        disciplines: [],
        insuranceProvider: '',
        insurancePolicyNumber: '',
        insuranceCoverageAmount: '',
        insuranceExpirationDate: '',
      })
      if (data.verificationResult?.verified) {
        setSuccess('License added and verified against state board!')
      } else {
        setSuccess('License added successfully')
      }
      await refreshUser()
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add license')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyLicense = async (licenseId: string) => {
    if (!token) return
    setVerifyingId(licenseId)
    setVerifyResult(null)

    try {
      const res = await fetch('/api/licenses/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ licenseId }),
      })

      const data = await res.json()

      if (data.verified) {
        setVerifyResult({
          licenseId,
          verified: true,
          message: `License verified against ${data.boardName || 'state board'}`,
        })
        await refreshUser()
      } else if (data.supported === false) {
        setVerifyResult({
          licenseId,
          verified: false,
          message: data.message || 'Automated verification not available for this state.',
        })
      } else {
        setVerifyResult({
          licenseId,
          verified: false,
          message: data.error || 'License could not be verified.',
        })
      }
    } catch (err) {
      setVerifyResult({
        licenseId,
        verified: false,
        message: 'Verification service unavailable. Try again later.',
      })
    } finally {
      setVerifyingId(null)
    }
  }

  const getStatusBadge = (status: string, expirationDate: string | null) => {
    const isExpiringSoon = expirationDate &&
      new Date(expirationDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

    if (status === 'active' || status === 'verified') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </span>
      )
    }
    if (status === 'expired') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Expired
        </span>
      )
    }
    if (status === 'suspended' || status === 'revoked') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          {status === 'suspended' ? 'Suspended' : 'Revoked'}
        </span>
      )
    }
    if (isExpiringSoon) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Expiring Soon
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </span>
    )
  }

  const getLicenseIcon = (type: string) => {
    switch (type) {
      case 'PE':
      case 'SE':
      case 'GE':
        return <Shield className="h-6 w-6 text-primary" />
      case 'RA':
        return <Briefcase className="h-6 w-6 text-primary" />
      default:
        return <Award className="h-6 w-6 text-primary" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Professional Licenses</h1>
          <p className="text-muted-foreground mt-1">Manage your professional licenses and certifications</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add License
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Token Summary */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">Total Stamp Tokens</p>
            <p className="text-4xl font-bold mt-1">{totalTokens.toLocaleString()}</p>
            <p className="text-white/60 text-sm mt-2">
              Earned across all licenses
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-full">
            <Coins className="h-10 w-10" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20 text-sm text-white/80">
          Milestone bonuses: +50 at 5th stamp, +200 at 25th stamp, +1000 at 100th stamp
        </div>
      </div>

      {/* Licenses List */}
      {licenses.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-lg font-semibold text-foreground mb-2">No Licenses Added</h2>
          <p className="text-muted-foreground mb-4">
            Add your professional licenses to start stamping documents
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First License
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {licenses.map((license) => (
            <div
              key={license.id}
              className="bg-card rounded-lg border border-border p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-3 rounded-lg mr-4">
                    {getLicenseIcon(license.licenseType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">
                        {LICENSE_TYPES.find((t) => t.value === license.licenseType)?.label ||
                          license.licenseType}
                      </h3>
                      {getStatusBadge(license.status, license.expirationDate || null)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Hash className="h-4 w-4 mr-1" />
                        {license.licenseNumber}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {license.issuingState}
                      </span>
                      {license.expirationDate && (
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Expires: {new Date(license.expirationDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {license.disciplines && license.disciplines.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        {license.disciplines.map((d) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                    {license.insuranceProvider && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        <span>
                          {license.insuranceProvider}
                          {license.insuranceCoverageAmount ? ` - $${Number(license.insuranceCoverageAmount).toLocaleString()}` : ''}
                          {license.insuranceExpirationDate ? ` (exp ${new Date(license.insuranceExpirationDate).toLocaleDateString()})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center justify-end text-primary font-semibold">
                    <Coins className="h-4 w-4 mr-1" />
                    {license.stampTokenCount.toLocaleString()} tokens
                  </div>
                  {license.status === 'active' && license.lastVerifiedAt && (
                    <p className="text-xs text-muted-foreground">
                      Verified {new Date(license.lastVerifiedAt).toLocaleDateString()}
                    </p>
                  )}
                  {license.status === 'pending_verification' && license.issuingState === 'TX' && license.licenseType === 'PE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyLicense(license.id)}
                      disabled={verifyingId === license.id}
                    >
                      {verifyingId === license.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Verify License
                        </>
                      )}
                    </Button>
                  )}
                  {STATE_BOARD_URLS[license.issuingState] && (
                    <a
                      href={STATE_BOARD_URLS[license.issuingState]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-blue-600 hover:underline"
                    >
                      Lookup on State Board
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  )}
                </div>
              </div>
              {/* Verification result banner */}
              {verifyResult && verifyResult.licenseId === license.id && (
                <div
                  className={`mt-4 px-4 py-3 rounded-lg text-sm ${
                    verifyResult.verified
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                  }`}
                >
                  {verifyResult.verified ? (
                    <CheckCircle2 className="h-4 w-4 inline mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                  )}
                  {verifyResult.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add License Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Professional License</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddLicense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  License Type *
                </label>
                <select
                  value={createForm.licenseType}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, licenseType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {LICENSE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    License Number *
                  </label>
                  <Input
                    value={createForm.licenseNumber}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, licenseNumber: e.target.value })
                    }
                    placeholder="123456"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    State/Jurisdiction *
                  </label>
                  <select
                    value={createForm.issuingState}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, issuingState: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select State</option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Expiration Date
                </label>
                <Input
                  type="date"
                  value={createForm.expirationDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, expirationDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Verification URL
                </label>
                <Input
                  type="url"
                  value={createForm.verificationUrl}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, verificationUrl: e.target.value })
                  }
                  placeholder="https://pels.texas.gov/verify/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Link to state board verification page (optional)
                </p>
              </div>

              {/* Insurance Section */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Professional Liability Insurance (Optional)
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Insurance Provider
                    </label>
                    <Input
                      value={createForm.insuranceProvider}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, insuranceProvider: e.target.value })
                      }
                      placeholder="e.g., Hartford, CNA, Beazley"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Policy Number
                      </label>
                      <Input
                        value={createForm.insurancePolicyNumber}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, insurancePolicyNumber: e.target.value })
                        }
                        placeholder="PLI-12345"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Coverage Amount ($)
                      </label>
                      <Input
                        type="number"
                        value={createForm.insuranceCoverageAmount}
                        onChange={(e) =>
                          setCreateForm({ ...createForm, insuranceCoverageAmount: e.target.value })
                        }
                        placeholder="1000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Insurance Expiration Date
                    </label>
                    <Input
                      type="date"
                      value={createForm.insuranceExpirationDate}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, insuranceExpirationDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add License
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

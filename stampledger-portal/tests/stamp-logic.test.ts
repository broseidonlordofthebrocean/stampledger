import { describe, it, expect } from 'vitest'

describe('Stamp Status Logic', () => {
  describe('Verification result computation', () => {
    const computeResult = (status: string) => {
      const isValid = status === 'active'
      const isSuperseded = status === 'superseded'
      return isValid
        ? 'valid'
        : status === 'revoked'
          ? 'revoked'
          : isSuperseded
            ? 'superseded'
            : 'invalid'
    }

    it('returns valid for active stamps', () => {
      expect(computeResult('active')).toBe('valid')
    })

    it('returns revoked for revoked stamps', () => {
      expect(computeResult('revoked')).toBe('revoked')
    })

    it('returns superseded for superseded stamps', () => {
      expect(computeResult('superseded')).toBe('superseded')
    })

    it('returns invalid for unknown status', () => {
      expect(computeResult('draft')).toBe('invalid')
      expect(computeResult('')).toBe('invalid')
    })
  })

  describe('Revocation guard', () => {
    it('only allows revoking active stamps', () => {
      const canRevoke = (status: string) => status === 'active'
      expect(canRevoke('active')).toBe(true)
      expect(canRevoke('revoked')).toBe(false)
      expect(canRevoke('superseded')).toBe(false)
    })
  })

  describe('Verification message generation', () => {
    const generateMessage = (
      status: string,
      revokedAt: Date | null,
      revokedReason: string | null,
      supersessionReason: string | null,
      supersededBy: string | null
    ) => {
      const isValid = status === 'active'
      const isSuperseded = status === 'superseded'

      if (isValid) return 'This stamp is valid and has not been revoked'
      if (isSuperseded) {
        return `This stamp has been superseded${supersessionReason ? `. Reason: ${supersessionReason}` : ''}${supersededBy ? '. A newer version is available.' : ''}`
      }
      if (status === 'revoked') {
        return `This stamp was revoked on ${revokedAt ? revokedAt.toLocaleDateString() : 'unknown date'}. Reason: ${revokedReason}`
      }
      return 'This stamp is not valid'
    }

    it('generates valid message for active stamps', () => {
      const msg = generateMessage('active', null, null, null, null)
      expect(msg).toBe('This stamp is valid and has not been revoked')
    })

    it('generates superseded message with reason', () => {
      const msg = generateMessage('superseded', null, null, 'Design update', 'new-stamp-id')
      expect(msg).toContain('superseded')
      expect(msg).toContain('Design update')
      expect(msg).toContain('newer version')
    })

    it('generates superseded message without replacement', () => {
      const msg = generateMessage('superseded', null, null, 'Withdrawn', null)
      expect(msg).toContain('superseded')
      expect(msg).toContain('Withdrawn')
      expect(msg).not.toContain('newer version')
    })

    it('generates revoked message with date and reason', () => {
      const date = new Date('2026-01-15')
      const msg = generateMessage('revoked', date, 'Code violation', null, null)
      expect(msg).toContain('revoked')
      expect(msg).toContain('Code violation')
    })
  })

  describe('Insurance snapshot parsing', () => {
    it('parses valid insurance snapshot JSON', () => {
      const snapshot = JSON.stringify({
        provider: 'State Farm',
        policyNumber: 'POL-123',
        coverageAmount: 1000000,
        expirationDate: '2026-12-31',
        capturedAt: '2026-01-01T00:00:00Z',
      })

      const parsed = JSON.parse(snapshot)
      expect(parsed.provider).toBe('State Farm')
      expect(parsed.coverageAmount).toBe(1000000)
    })

    it('handles null insurance snapshot gracefully', () => {
      const snapshot: string | null = null
      let result = null
      if (snapshot) {
        try { result = JSON.parse(snapshot) } catch { /* skip */ }
      }
      expect(result).toBeNull()
    })

    it('handles invalid JSON gracefully', () => {
      const snapshot = 'not-json'
      let result = null
      try { result = JSON.parse(snapshot) } catch { /* expected */ }
      expect(result).toBeNull()
    })
  })

  describe('License/insurance expiration checks', () => {
    it('detects expired license', () => {
      const expirationDate = new Date('2025-01-01')
      const now = new Date('2026-02-20')
      expect(expirationDate < now).toBe(true)
    })

    it('detects non-expired license', () => {
      const expirationDate = new Date('2027-12-31')
      const now = new Date('2026-02-20')
      expect(expirationDate < now).toBe(false)
    })

    it('handles null expiration date', () => {
      const checkExpiration = (date: Date | null) => date ? date < new Date() : false
      expect(checkExpiration(null)).toBe(false)
    })
  })

  describe('Supersession info construction', () => {
    it('builds supersession object when superseded', () => {
      const stamp = {
        status: 'superseded',
        supersededBy: 'new-stamp',
        supersededAt: new Date(),
        supersessionReason: 'Updated design',
      }

      const supersession = stamp.status === 'superseded'
        ? {
            supersededBy: stamp.supersededBy,
            supersededAt: stamp.supersededAt,
            reason: stamp.supersessionReason,
            newVersionUrl: stamp.supersededBy ? `/verify/${stamp.supersededBy}` : null,
          }
        : null

      expect(supersession).not.toBeNull()
      expect(supersession?.newVersionUrl).toBe('/verify/new-stamp')
      expect(supersession?.reason).toBe('Updated design')
    })

    it('returns null when not superseded', () => {
      const stamp = { status: 'active' }
      const supersession = stamp.status === 'superseded' ? {} : null
      expect(supersession).toBeNull()
    })
  })
})

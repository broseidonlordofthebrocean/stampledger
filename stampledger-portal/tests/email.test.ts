import { describe, it, expect } from 'vitest'
import { EMAIL_CONFIG } from '../lib/email'

describe('EMAIL_CONFIG', () => {
  describe('templates', () => {
    it('orgInvite template generates correct body', () => {
      const body = EMAIL_CONFIG.templates.orgInvite.getBody(
        'Acme Engineering',
        'John Doe',
        'https://portal.stampledger.com/invite/abc123'
      )
      expect(body).toContain('Acme Engineering')
      expect(body).toContain('John Doe')
      expect(body).toContain('https://portal.stampledger.com/invite/abc123')
      expect(body).not.toContain('undefined')
    })

    it('stampConfirmation template generates correct body', () => {
      const body = EMAIL_CONFIG.templates.stampConfirmation.getBody(
        'Smith Residence',
        'stamp-123',
        'https://portal.stampledger.com/verify/stamp-123'
      )
      expect(body).toContain('Smith Residence')
      expect(body).toContain('stamp-123')
      expect(body).toContain('https://portal.stampledger.com/verify/stamp-123')
    })

    it('stampSuperseded template handles null newStampId', () => {
      const body = EMAIL_CONFIG.templates.stampSuperseded.getBody(
        'Bridge Project',
        'Design revision',
        'old-stamp-id',
        null,
        null
      )
      expect(body).toContain('Bridge Project')
      expect(body).toContain('Design revision')
      expect(body).toContain('No replacement stamp was created.')
      expect(body).not.toContain('undefined')
    })

    it('stampSuperseded template includes new stamp info when provided', () => {
      const body = EMAIL_CONFIG.templates.stampSuperseded.getBody(
        'Bridge Project',
        'Design revision',
        'old-stamp-id',
        'new-stamp-id',
        'https://portal.stampledger.com/verify/new-stamp-id'
      )
      expect(body).toContain('new-stamp-id')
      expect(body).toContain('https://portal.stampledger.com/verify/new-stamp-id')
    })

    it('stampRevoked template generates correct body', () => {
      const body = EMAIL_CONFIG.templates.stampRevoked.getBody(
        'Highway Project',
        'Code violation found',
        'stamp-456'
      )
      expect(body).toContain('Highway Project')
      expect(body).toContain('Code violation found')
      expect(body).toContain('stamp-456')
      expect(body).toContain('no longer valid')
    })

    it('stampRevoked subject includes project name', () => {
      const subject = EMAIL_CONFIG.templates.stampRevoked.subject('My Project')
      expect(subject).toContain('My Project')
      expect(subject).toContain('revoked')
    })

    it('stampSuperseded subject includes project name', () => {
      const subject = EMAIL_CONFIG.templates.stampSuperseded.subject('My Project')
      expect(subject).toContain('My Project')
      expect(subject).toContain('superseded')
    })

    it('batchStampConfirmation template generates correct body', () => {
      const body = EMAIL_CONFIG.templates.batchStampConfirmation.getBody(
        'batch-001',
        5,
        5,
        10
      )
      expect(body).toContain('batch-001')
      expect(body).toContain('5')
      expect(body).toContain('10')
    })

    it('specChange template generates correct body', () => {
      const body = EMAIL_CONFIG.templates.specChange.getBody(
        'SP-E-001',
        'Electrical Spec',
        'B',
        3,
        7
      )
      expect(body).toContain('SP-E-001')
      expect(body).toContain('Electrical Spec')
      expect(body).toContain('New Revision: B')
      expect(body).toContain('3')
      expect(body).toContain('7')
    })
  })
})

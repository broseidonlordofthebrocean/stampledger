import { describe, it, expect } from 'vitest'

// Mirror the CSV escaping logic from the export endpoint
const escapeCsv = (val: string) => {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

describe('CSV Export', () => {
  describe('escapeCsv', () => {
    it('leaves simple values unchanged', () => {
      expect(escapeCsv('hello')).toBe('hello')
      expect(escapeCsv('stamp-123')).toBe('stamp-123')
    })

    it('wraps values with commas in quotes', () => {
      expect(escapeCsv('Smith, John')).toBe('"Smith, John"')
    })

    it('wraps values with newlines in quotes', () => {
      expect(escapeCsv('line1\nline2')).toBe('"line1\nline2"')
    })

    it('escapes double quotes by doubling them', () => {
      expect(escapeCsv('He said "hello"')).toBe('"He said ""hello"""')
    })

    it('handles combined special characters', () => {
      expect(escapeCsv('A, "B"\nC')).toBe('"A, ""B""\nC"')
    })

    it('handles empty string', () => {
      expect(escapeCsv('')).toBe('')
    })
  })

  describe('CSV Row Generation', () => {
    it('generates correct header row', () => {
      const header = [
        'Stamp ID', 'Status', 'Project Name', 'Jurisdiction',
        'Permit Number', 'PE Name', 'License Number', 'License State',
        'License Expired', 'Insurance Provider', 'Insurance Expired',
        'Scope Notes', 'Created At', 'Revoked At', 'Revoked Reason',
        'Document Hash',
      ]
      const csvLine = header.map(escapeCsv).join(',')
      expect(csvLine).toContain('Stamp ID')
      expect(csvLine).toContain('Document Hash')
      expect(csvLine.split(',').length).toBe(16)
    })

    it('generates a valid data row', () => {
      const row = [
        'abc-123',
        'active',
        'Smith Residence',
        'wisconsin',
        'E-2026-001',
        'John Doe',
        '12345',
        'WI',
        'No',
        'State Farm',
        'No',
        'Structural review only',
        '2026-01-15T00:00:00.000Z',
        '',
        '',
        'a'.repeat(64),
      ]
      const csvLine = row.map(escapeCsv).join(',')
      expect(csvLine.split(',').length).toBe(16)
      expect(csvLine).toContain('abc-123')
      expect(csvLine).toContain('Smith Residence')
    })

    it('handles scope notes with commas properly', () => {
      const scopeNotes = 'Structural, electrical, and plumbing review'
      const escaped = escapeCsv(scopeNotes)
      expect(escaped).toBe(`"Structural, electrical, and plumbing review"`)
    })
  })
})

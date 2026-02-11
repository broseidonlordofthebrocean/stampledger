// PE License Verification — Edge-compatible
// Texas pilot: fetches TBPE roster CSV (ZIP) from S3, parses it, and looks up license

export interface VerificationResult {
  verified: boolean
  supported: boolean
  boardName?: string
  boardStatus?: string
  holderName?: string
  expirationDate?: string
  lookupUrl?: string
  error?: string
}

// ============================================================================
// TEXAS TBPE VERIFICATION
// ============================================================================

// Fetch the TX PE roster ZIP from S3, decompress, parse CSV, and find the license
export async function verifyTexasLicense(
  licenseNumber: string,
  firstName: string,
  lastName: string
): Promise<VerificationResult> {
  const ROSTER_URL = 'https://tbpedownloads.s3-us-west-2.amazonaws.com/roster_pe.zip'
  const boardName = 'Texas Board of Professional Engineers and Land Surveyors'

  try {
    const response = await fetch(ROSTER_URL)
    if (!response.ok) {
      return {
        verified: false,
        supported: true,
        boardName,
        error: 'Failed to fetch TBPE roster data',
        lookupUrl: STATE_BOARD_URLS['TX'],
      }
    }

    const zipBuffer = await response.arrayBuffer()
    const csvText = await extractFirstFileFromZip(zipBuffer)

    if (!csvText) {
      return {
        verified: false,
        supported: true,
        boardName,
        error: 'Failed to parse TBPE roster data',
        lookupUrl: STATE_BOARD_URLS['TX'],
      }
    }

    const result = searchRosterCsv(csvText, licenseNumber, firstName, lastName)
    return {
      ...result,
      supported: true,
      boardName,
      lookupUrl: STATE_BOARD_URLS['TX'],
    }
  } catch (error) {
    return {
      verified: false,
      supported: true,
      boardName,
      error: `Verification service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lookupUrl: STATE_BOARD_URLS['TX'],
    }
  }
}

// ============================================================================
// ZIP / CSV PARSING
// ============================================================================

// Minimal ZIP parser: extract the first file from a ZIP archive
async function extractFirstFileFromZip(buffer: ArrayBuffer): Promise<string | null> {
  const view = new DataView(buffer)

  // Check ZIP magic number: PK\x03\x04
  if (view.getUint32(0, true) !== 0x04034b50) {
    return null
  }

  // Parse local file header
  const compressionMethod = view.getUint16(8, true) // 0=stored, 8=deflate
  const compressedSize = view.getUint32(18, true)
  const filenameLength = view.getUint16(26, true)
  const extraFieldLength = view.getUint16(28, true)

  const dataOffset = 30 + filenameLength + extraFieldLength
  const compressedData = new Uint8Array(buffer, dataOffset, compressedSize)

  if (compressionMethod === 0) {
    return new TextDecoder().decode(compressedData)
  }

  if (compressionMethod === 8) {
    return await decompressRawDeflate(compressedData)
  }

  return null
}

// Decompress raw DEFLATE data using DecompressionStream
async function decompressRawDeflate(compressed: Uint8Array): Promise<string | null> {
  try {
    const ds = new DecompressionStream('deflate-raw')
    const writer = ds.writable.getWriter()
    const reader = ds.readable.getReader()

    // Copy to a fresh ArrayBuffer to satisfy TypeScript's strict BufferSource type
    const buf = new ArrayBuffer(compressed.byteLength)
    new Uint8Array(buf).set(compressed)
    writer.write(buf)
    writer.close()

    const decoder = new TextDecoder()
    let result = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      result += decoder.decode(value, { stream: true })
    }
    result += decoder.decode()
    return result
  } catch {
    return null
  }
}

// Search the CSV text for a matching license number
function searchRosterCsv(
  csvText: string,
  licenseNumber: string,
  firstName: string,
  lastName: string
): Omit<VerificationResult, 'supported' | 'boardName' | 'lookupUrl'> {
  const lines = csvText.split('\n')
  if (lines.length < 2) {
    return { verified: false, error: 'Empty roster data' }
  }

  // Parse header to find column indices
  const header = parseCSVLine(lines[0])
  const colMap: Record<string, number> = {}
  header.forEach((col, i) => {
    colMap[col.trim().toLowerCase().replace(/\s+/g, '_').replace(/"/g, '')] = i
  })

  // Common column name patterns for PE rosters
  const numCol = colMap['pe_number'] ?? colMap['penumber'] ?? colMap['license_number'] ?? colMap['number'] ?? colMap['pe_no'] ?? colMap['pe#'] ?? 0
  const lastNameCol = colMap['last_name'] ?? colMap['lastname'] ?? colMap['last'] ?? colMap['lname'] ?? 1
  const firstNameCol = colMap['first_name'] ?? colMap['firstname'] ?? colMap['first'] ?? colMap['fname'] ?? 2
  const statusCol = colMap['status'] ?? colMap['license_status'] ?? colMap['lic_status'] ?? -1
  const expCol = colMap['expiration'] ?? colMap['expiration_date'] ?? colMap['exp_date'] ?? colMap['exp'] ?? -1

  const targetNum = licenseNumber.trim().replace(/^0+/, '')
  const targetFirst = firstName.trim().toLowerCase()
  const targetLast = lastName.trim().toLowerCase()

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = parseCSVLine(line)
    const rowNum = (cols[numCol] || '').trim().replace(/"/g, '').replace(/^0+/, '')

    if (rowNum === targetNum) {
      const rowFirst = (cols[firstNameCol] || '').trim().toLowerCase().replace(/"/g, '')
      const rowLast = (cols[lastNameCol] || '').trim().toLowerCase().replace(/"/g, '')
      const rowStatus = statusCol >= 0 ? (cols[statusCol] || '').trim().replace(/"/g, '') : undefined
      const rowExp = expCol >= 0 ? (cols[expCol] || '').trim().replace(/"/g, '') : undefined
      const holderName = `${(cols[firstNameCol] || '').trim()} ${(cols[lastNameCol] || '').trim()}`.replace(/"/g, '').trim()

      const nameMatch =
        rowLast === targetLast ||
        rowLast.includes(targetLast) ||
        targetLast.includes(rowLast)

      if (nameMatch) {
        return {
          verified: true,
          holderName,
          boardStatus: rowStatus,
          expirationDate: rowExp,
        }
      } else {
        return {
          verified: false,
          holderName,
          error: `License found but name does not match. Registered to: ${holderName}`,
        }
      }
    }
  }

  return {
    verified: false,
    error: `License number ${licenseNumber} not found in TBPE roster`,
  }
}

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// ============================================================================
// STATE BOARD LOOKUP URLS
// ============================================================================

export const STATE_BOARD_URLS: Record<string, string> = {
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

// Get the state board lookup URL for a given state
export function getStateBoardUrl(state: string): string | null {
  return STATE_BOARD_URLS[state.toUpperCase()] || null
}

// Check if automated verification is supported for a state
export function isAutomatedVerificationSupported(state: string): boolean {
  return state.toUpperCase() === 'TX'
}

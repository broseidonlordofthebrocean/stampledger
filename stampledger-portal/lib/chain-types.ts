// Protobuf encoding for StampLedger chain custom messages
// Manually derived from proto/stampledgerchain/stampledgerchain/v1/tx.proto
//
// This avoids codegen dependencies and works in Cloudflare Workers edge runtime.

/* eslint-disable @typescript-eslint/no-explicit-any */

export const MSG_CREATE_STAMP_TYPE_URL =
  '/stampledgerchain.stampledgerchain.v1.MsgCreateStamp'

export interface MsgCreateStampFields {
  creator: string
  documentHash: string
  pePublicKey: string
  signature: string
  jurisdictionId: string
  peLicenseNumber: string
  peName: string
  projectName: string
  documentIpfsHash: string
  documentSize: number
  documentFilename: string
}

// ── Minimal protobuf varint + length-delimited encoder ──────────────────────
// Only what we need: strings (wire type 2) and int64 (wire type 0).
// This runs on CF Workers without protobufjs dependency issues.

function encodeVarint(value: number): number[] {
  const bytes: number[] = []
  let v = value >>> 0 // unsigned
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80)
    v >>>= 7
  }
  bytes.push(v & 0x7f)
  return bytes
}

function encodeSignedVarint(value: number): number[] {
  // For non-negative int64 values that fit in JS numbers
  if (value === 0) return [0]
  const bytes: number[] = []
  let v = value
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80)
    v = Math.floor(v / 128)
  }
  bytes.push(v & 0x7f)
  return bytes
}

function encodeTag(fieldNumber: number, wireType: number): number[] {
  return encodeVarint((fieldNumber << 3) | wireType)
}

function encodeStringField(fieldNumber: number, value: string): Uint8Array {
  if (!value) return new Uint8Array(0)
  const encoded = new TextEncoder().encode(value)
  const tag = encodeTag(fieldNumber, 2) // wire type 2 = length-delimited
  const length = encodeVarint(encoded.length)
  const result = new Uint8Array(tag.length + length.length + encoded.length)
  result.set(tag, 0)
  result.set(length, tag.length)
  result.set(encoded, tag.length + length.length)
  return result
}

function encodeInt64Field(fieldNumber: number, value: number): Uint8Array {
  if (value === 0) return new Uint8Array(0)
  const tag = encodeTag(fieldNumber, 0) // wire type 0 = varint
  const val = encodeSignedVarint(value)
  const result = new Uint8Array(tag.length + val.length)
  result.set(tag, 0)
  result.set(val, tag.length)
  return result
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const filtered = arrays.filter((a) => a.length > 0)
  const totalLength = filtered.reduce((sum, a) => sum + a.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0
  for (const arr of filtered) {
    result.set(arr, offset)
    offset += arr.length
  }
  return result
}

// ── Encode / Decode / FromPartial (cosmjs GeneratedType interface) ──────────

export const MsgCreateStamp = {
  encode(message: MsgCreateStampFields): Uint8Array {
    return concat(
      encodeStringField(1, message.creator),
      encodeStringField(2, message.documentHash),
      encodeStringField(3, message.pePublicKey),
      encodeStringField(4, message.signature),
      encodeStringField(5, message.jurisdictionId),
      encodeStringField(6, message.peLicenseNumber),
      encodeStringField(7, message.peName),
      encodeStringField(8, message.projectName),
      encodeStringField(9, message.documentIpfsHash),
      encodeInt64Field(10, message.documentSize),
      encodeStringField(11, message.documentFilename),
    )
  },

  decode(_input: Uint8Array | any, _length?: number): MsgCreateStampFields {
    // Decode is not needed for client-side submission.
    // The chain handles all decoding. This stub satisfies the GeneratedType interface.
    return MsgCreateStamp.fromPartial({})
  },

  fromPartial(object: Partial<MsgCreateStampFields>): MsgCreateStampFields {
    return {
      creator: object.creator ?? '',
      documentHash: object.documentHash ?? '',
      pePublicKey: object.pePublicKey ?? '',
      signature: object.signature ?? '',
      jurisdictionId: object.jurisdictionId ?? '',
      peLicenseNumber: object.peLicenseNumber ?? '',
      peName: object.peName ?? '',
      projectName: object.projectName ?? '',
      documentIpfsHash: object.documentIpfsHash ?? '',
      documentSize: object.documentSize ?? 0,
      documentFilename: object.documentFilename ?? '',
    }
  },
}

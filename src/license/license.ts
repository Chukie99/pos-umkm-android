import * as Device from 'expo-device'
import { getDb } from '../db/database'

/**
 * License scheme (offline, deterministic):
 *
 *   deviceCode  = first 12 hex chars of stable device fingerprint
 *   secret      = APP_LICENSE_SECRET baked into the binary
 *   activation  = HMAC-SHA256(secret, deviceCode), base32-ish uppercase,
 *                 formatted as XXXX-XXXX-XXXX-XXXX
 *
 * The vendor runs keygen.mjs locally with the SAME secret to issue keys
 * per customer. No server needed — validation happens fully offline.
 */

export const APP_LICENSE_SECRET = 'UMKM-POS-2026::v1::Chukie99'

const BASE32_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ' // no confusing chars

export function getDeviceId(): string {
  // Prefer native id; fall back to a name-based pseudo id.
  const raw =
    Device.osInternalBuildId ||
    Device.deviceName ||
    'UNKNOWN-DEVICE'
  return String(raw)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
    .padEnd(12, 'X')
}

export function formatDeviceCode(id: string): string {
  return (id.match(/.{1,4}/g) || []).join('-')
}

// --- Minimal synchronous SHA-256 + HMAC implementation (no crypto dep) ---

function sha256(msg: Uint8Array): Uint8Array {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ])
  let H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ])

  const l = msg.length
  const withPadding = new Uint8Array((((l + 8) >> 6) + 1) << 6)
  withPadding.set(msg)
  withPadding[l] = 0x80
  const bitLen = l * 8
  const dv = new DataView(withPadding.buffer)
  dv.setUint32(withPadding.length - 4, bitLen >>> 0)
  dv.setUint32(withPadding.length - 8, Math.floor(bitLen / 0x100000000))

  const w = new Uint32Array(64)
  for (let i = 0; i < withPadding.length; i += 64) {
    for (let j = 0; j < 16; j++) w[j] = dv.getUint32(i + j * 4)
    for (let j = 16; j < 64; j++) {
      const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3)
      const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10)
      w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0
    }
    const [a, b, c, d, e, f, g, h] = H
    let A = a, B = b, C = c, D = d, E = e, F = f, G = g, Hh = h
    for (let j = 0; j < 64; j++) {
      const S1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25)
      const ch = (E & F) ^ (~E & G)
      const t1 = (Hh + S1 + ch + K[j] + w[j]) >>> 0
      const S0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22)
      const maj = (A & B) ^ (A & C) ^ (B & C)
      const t2 = (S0 + maj) >>> 0
      Hh = G; G = F; F = E; E = (D + t1) >>> 0
      D = C; C = B; B = A; A = (t1 + t2) >>> 0
    }
    H = new Uint32Array([
      (H[0] + A) >>> 0, (H[1] + B) >>> 0, (H[2] + C) >>> 0, (H[3] + D) >>> 0,
      (H[4] + E) >>> 0, (H[5] + F) >>> 0, (H[6] + G) >>> 0, (H[7] + Hh) >>> 0,
    ])
  }

  function rotr(x: number, n: number): number {
    return ((x >>> n) | (x << (32 - n))) >>> 0
  }

  const out = new Uint8Array(32)
  const ov = new DataView(out.buffer)
  H.forEach((word, i) => ov.setUint32(i * 4, word))
  return out
}

function hmacSha256(keyBytes: Uint8Array, msgBytes: Uint8Array): Uint8Array {
  const blockSize = 64
  let key = keyBytes
  if (key.length > blockSize) key = sha256(key)
  const padded = new Uint8Array(blockSize)
  padded.set(key)

  const oKey = new Uint8Array(blockSize)
  const iKey = new Uint8Array(blockSize)
  for (let i = 0; i < blockSize; i++) {
    oKey[i] = padded[i] ^ 0x5c
    iKey[i] = padded[i] ^ 0x36
  }
  const innerInput = new Uint8Array(iKey.length + msgBytes.length)
  innerInput.set(iKey)
  innerInput.set(msgBytes, iKey.length)
  const inner = sha256(innerInput)
  const outerInput = new Uint8Array(oKey.length + inner.length)
  outerInput.set(oKey)
  outerInput.set(inner, oKey.length)
  return sha256(outerInput)
}

function bytesToBase32(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output.slice(0, 16)
}

export function generateActivationKey(deviceId: string, secret = APP_LICENSE_SECRET): string {
  const mac = hmacSha256(
    new TextEncoder().encode(secret),
    new TextEncoder().encode(deviceId.toUpperCase())
  )
  const raw = bytesToBase32(mac)
  return (raw.match(/.{1,4}/g) || []).join('-')
}

export function normalizeKey(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{4})(?=.)/g, '$1-')
}

// --- Local persistence ---

export function isActivated(): boolean {
  const row = getDb().getFirstSync<{ activation_key: string }>('SELECT activation_key FROM license WHERE id = 1')
  if (!row) return false
  return validateKey(row.activation_key)
}

export function validateKey(input: string): boolean {
  const deviceId = getDeviceId()
  const expected = normalizeKey(generateActivationKey(deviceId))
  const given = normalizeKey(input || '')
  if (given.length !== expected.length) return false
  // constant-time-ish compare
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i)
  return diff === 0
}

export function activate(input: string): boolean {
  if (!validateKey(input)) return false
  getDb().runSync(
    "INSERT INTO license (id, device_id, activation_key, activated_at) VALUES (1, ?, ?, datetime('now','localtime')) " +
    'ON CONFLICT(id) DO UPDATE SET device_id=excluded.device_id, activation_key=excluded.activation_key, activated_at=excluded.activated_at',
    [getDeviceId(), normalizeKey(input)]
  )
  return true
}

#!/usr/bin/env node
/**
 * POS UMKM — Key Generator
 * =========================
 * Menghasilkan Kode Aktivasi dari Device ID customer.
 *
 * Pakai:
 *   node keygen.mjs <DEVICE-ID>
 *   contoh: node keygen.mjs ABCD1234EFGH
 *
 * Output: XXXX-XXXX-XXXX-XXXX — kirim ke pembeli untuk diinput di layar aktivasi.
 */

import { createHmac } from 'node:crypto'

// HARUS sama persis dengan APP_LICENSE_SECRET di src/license/license.ts
const APP_LICENSE_SECRET = 'UMKM-POS-2026::v1::Chukie99'

const BASE32_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

function bytesToBase32(bytes) {
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

function generateKey(deviceId) {
  const normalized = String(deviceId).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12).padEnd(12, 'X')
  const mac = createHmac('sha256', APP_LICENSE_SECRET).update(normalized).digest()
  const raw = bytesToBase32(mac)
  return (raw.match(/.{1,4}/g) || []).join('-')
}

// --- CLI ---
const input = process.argv[2]
if (!input) {
  console.log(`
POS UMKM Key Generator
======================
Pakai:  node keygen.mjs <DEVICE-ID-CUSTOMER>
Contoh: node keygum.mjs ABCD1234EFGH
`)
  // interactive mode if no arg
  const readline = await import('node:readline/promises')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const dev = await rl.question('Device ID customer: ')
  rl.close()
  if (!dev.trim()) { console.error('Device ID kosong.'); process.exit(1) }
  console.log('\nKode Aktivasi :', generateKey(dev))
  process.exit(0)
}
console.log(generateKey(input))

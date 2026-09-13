// Bluetooth ESC/POS — v1.1.2: SCAN BLE + connect & print (anti-FC)
// Library: react-native-ble-plx 3.5.1 + expo-intent-launcher
// Pair dulu di Settings HP biar MAC kebaca, baru scan akan nemu.
import { Platform, PermissionsAndroid } from 'react-native'
import { getSetting, setSetting } from './settings'

export type BtDevice = { id: string; name: string | null; rssi: number | null }

let _manager: any = null
function getManager(): any {
  if (_manager) return _manager
  try {
    const { BleManager } = require('react-native-ble-plx')
    _manager = new BleManager()
    return _manager
  } catch { return null }
}

export function escPosReceipt(text: string): Uint8Array {
  const init = [0x1B, 0x40]
  const bytes = Array.from(new TextEncoder().encode(text))
  const cut = [0x1D, 0x56, 0x00]
  return new Uint8Array([...init, ...bytes, 0x0A, 0x0A, ...cut])
}

export function getSavedPrinter(): string | null {
  try { return getSetting('btPrinterAddr', '') || null } catch { return null }
}
export function savePrinter(addr: string) { setSetting('btPrinterAddr', addr.trim()) }
export function getSavedPrinterName(): string | null {
  try { return getSetting('btPrinterName', '') || null } catch { return null }
}
export function savePrinterName(name: string) { setSetting('btPrinterName', name.trim()) }

export async function requestBtPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true
  try {
    if (Platform.Version >= 31) {
      const res = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN as any,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT as any,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION as any,
      ])
      const okScan = res['android.permission.BLUETOOTH_SCAN'] === 'granted'
      const okConn = res['android.permission.BLUETOOTH_CONNECT'] === 'granted'
      return okScan && okConn
    } else {
      const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION as any)
      return res === 'granted'
    }
  } catch { return false }
}

export async function scanPrinters(onDevice: (d: BtDevice) => void, ms = 7000): Promise<BtDevice[]> {
  const ok = await requestBtPermissions()
  if (!ok) throw new Error('Izin Bluetooth ditolak — aktifkan di Pengaturan HP')
  const mgr = getManager()
  if (!mgr) throw new Error('BLE tidak tersedia di HP ini')
  // ensure BT on
  try { const st = await mgr.state(); if (st !== 'PoweredOn') throw new Error('Bluetooth HP mati — nyalakan dulu') } catch {}
  const found = new Map<string, BtDevice>()
  return new Promise((resolve, reject) => {
    let done = false
    const finish = () => { if (done) return; done = true; try { mgr.stopDeviceScan() } catch {}; resolve(Array.from(found.values())) }
    const timer = setTimeout(finish, ms)
    try {
      mgr.startDeviceScan(null, { allowDuplicates: false }, (err: any, dev: any) => {
        if (err) { clearTimeout(timer); try { mgr.stopDeviceScan() } catch {}; reject(new Error(err?.message || String(err))); return }
        if (!dev) return
        const name = dev.name || dev.localName || null
        // filter: hanya yang ada nama / terlihat seperti printer — tapi tampilkan semua biar user lihat
        const entry: BtDevice = { id: dev.id, name, rssi: dev.rssi ?? null }
        if (!found.has(entry.id)) { found.set(entry.id, entry); onDevice(entry) }
      })
    } catch (e: any) { clearTimeout(timer); reject(new Error(e?.message || String(e))) }
    // also resolve on timeout
    setTimeout(() => { if (!done) finish() }, ms + 200)
  })
}

async function writeChunked(device: any, serviceUUID: string, charUUID: string, data: Uint8Array) {
  const CHUNK = 180
  for (let i = 0; i < data.length; i += CHUNK) {
    const slice = data.slice(i, i + CHUNK)
    // react-native-ble-plx expects base64
    let b64 = ''
    try { b64 = (globalThis as any).btoa ? (globalThis as any).btoa(String.fromCharCode(...slice)) : '' } catch {}
    if (!b64) {
      // fallback manual base64
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      let out = ''
      for (let j = 0; j < slice.length; j += 3) {
        const a = slice[j], b = slice[j+1] ?? 0, c = slice[j+2] ?? 0
        const hasB = j+1 < slice.length, hasC = j+2 < slice.length
        const n = (a<<16)|(b<<8)|c
        out += chars[(n>>18)&63] + chars[(n>>12)&63] + (hasB?chars[(n>>6)&63]:'=') + (hasC?chars[n&63]:'=')
      }
      b64 = out
    }
    await device.writeCharacteristicWithoutResponseForService(serviceUUID, charUUID, b64)
    await new Promise(r => setTimeout(r, 40))
  }
}

export async function connectAndPrint(text: string): Promise<'printed'|'shared'|'no_printer'> {
  const addr = getSavedPrinter()
  if (!addr) return 'no_printer'
  const mgr = getManager()
  if (!mgr) return 'shared'
  const ok = await requestBtPermissions()
  if (!ok) return 'shared'
  const data = escPosReceipt(text)
  let device: any = null
  try {
    device = await mgr.connectToDevice(addr, { autoConnect: false })
    await device.discoverAllServicesAndCharacteristics()
    // coba cari service/char yang bisa write — umum FF00/FF02 atau 18F0
    const services = await device.services()
    let wrote = false
    for (const s of services) {
      const chars = await s.characteristics()
      for (const c of chars) {
        if (c.isWritableWithoutResponse || c.isWritableWithResponse) {
          try { await writeChunked(device, s.uuid, c.uuid, data); wrote = true; break } catch {}
        }
      }
      if (wrote) break
    }
    try { await device.cancelConnection() } catch {}
    return wrote ? 'printed' : 'shared'
  } catch {
    try { if (device) await device.cancelConnection() } catch {}
    return 'shared'
  }
}

export async function openSystemBluetoothSettings() {
  try {
    const IntentLauncher: any = await import('expo-intent-launcher')
    // @ts-ignore
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS)
  } catch {
    // fallback: coba buka settings umum — user bisa tap manual
  }
}

// Fallback lama (dipakai Cashier/History) — sekarang arahkan ke connectAndPrint
export async function printViaBluetooth(text: string): Promise<'printed'|'shared'|'no_printer'> {
  return connectAndPrint(text)
}
export async function printViaBluetoothFallback(text: string): Promise<'shared'|'unsupported'> {
  const r = await connectAndPrint(text)
  return r === 'no_printer' ? 'unsupported' as any : 'shared'
}

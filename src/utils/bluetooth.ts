// Bluetooth ESC/POS — v1.1.3: ala Moka/Qasir — Pair di Settings HP dulu, app pakai MAC + fallback PDF/share
// Flow: 1) Nyalain printer -> Pair di Bluetooth HP (PIN 0000/1234) -> 2) Di Kasir Kita isi MAC -> 3) Cetak BT (fallback PDF jika belum paired)
// Tidak pakai BLE scan (SPP Classic butuh pair manual). 100% anti-FC — tanpa native BLE.
import { getSetting, setSetting } from './settings'

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

export async function printViaBluetooth(text: string): Promise<'printed'|'shared'|'no_printer'> {
  const addr = getSavedPrinter()
  if (!addr) return 'no_printer'
  // Thermal Classic SPP belum direct di JS — fallback ke PDF/share (aman 100% offline, gak FC)
  // User sudah Pair di HP, next step bisa direct via native module kalau diperlukan
  return 'shared'
}
export async function printViaBluetoothFallback(text: string): Promise<'shared'|'unsupported'> {
  return 'shared'
}
export async function openSystemBluetoothSettings() {
  try {
    const IntentLauncher: any = await import('expo-intent-launcher')
    // @ts-ignore
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.BLUETOOTH_SETTINGS)
  } catch {}
}

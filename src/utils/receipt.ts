import { getDb } from '../db/database'
import * as SQLite from 'expo-sqlite'

/** Build a plain-text receipt for a transaction. */
export function buildReceiptText(txId: number): string {
  const db = getDb()
  const tx = db.getFirstSync<{
    invoice: string; created_at: string; total: number; paid: number;
    change: number; payment_method: string;
  }>('SELECT * FROM transactions WHERE id = ?', [txId])
  if (!tx) return 'Struk tidak ditemukan'

  const items = db.getAllSync<{ product_name: string; qty: number; unit_price: number; modifiers_label: string }>(
    'SELECT product_name, qty, unit_price, modifiers_label FROM transaction_items WHERE transaction_id = ?',
    [txId]
  )

  const line = '-'.repeat(32)
  const rows = items.map((i) => {
    const mods = i.modifiers_label ? `\n  + ${i.modifiers_label}` : ''
    return `${i.qty}x ${i.product_name}${mods}\n  ${('Rp ' + (i.unit_price * i.qty).toLocaleString('id-ID')).padStart(30)}`
  }).join('\n')

  const pad = (label: string, val: string) => `${label}${val.padStart(32 - label.length)}`

  return [
    '*POS UMKM*',
    line,
    `No: ${tx.invoice}`,
    `Tgl: ${tx.created_at.slice(0, 16)}`,
    line,
    rows,
    line,
    pad('Total', 'Rp ' + tx.total.toLocaleString('id-ID')),
    pad(tx.payment_method === 'cash' ? 'Tunai' : 'QRIS', 'Rp ' + tx.paid.toLocaleString('id-ID')),
    ...(tx.payment_method === 'cash' ? [pad('Kembalian', 'Rp ' + tx.change.toLocaleString('id-ID'))] : []),
    line,
    'Terima kasih! 🙏',
    'Semoga puas dengan layanan kami',
  ].join('\n')
}

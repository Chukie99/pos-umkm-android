import { getDb } from '../db/database'
import * as SQLite from 'expo-sqlite'
import * as Print from 'expo-print'

/** Build a plain-text receipt for a transaction. */
export function buildReceiptText(txId: number): string {
  const db = getDb()
  const tx = db.getFirstSync<{
    invoice: string; created_at: string; total: number; paid: number;
    change: number; payment_method: string; discount: number;
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
  const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

  return [
    '*POS UMKM*',
    line,
    `No: ${tx.invoice}`,
    `Tgl: ${tx.created_at.slice(0, 16)}`,
    line,
    rows,
    line,
    ...(tx.discount > 0 ? [pad('Diskon', '-' + rp(tx.discount))] : []),
    pad('Total', rp(tx.total)),
    pad(tx.payment_method === 'cash' ? 'Tunai' : 'QRIS', rp(tx.paid)),
    ...(tx.payment_method === 'cash' ? [pad('Kembalian', rp(tx.change))] : []),
    line,
    'Terima kasih! 🙏',
    'Semoga puas dengan layanan kami',
  ].join('\n')
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Build receipt HTML (58mm thermal friendly) for expo-print. */
export function buildReceiptHtml(txId: number): string {
  const db = getDb()
  const tx = db.getFirstSync<{
    invoice: string; created_at: string; total: number; paid: number;
    change: number; payment_method: string; discount: number;
  }>('SELECT * FROM transactions WHERE id = ?', [txId])
  if (!tx) return '<p>Struk tidak ditemukan</p>'

  const items = db.getAllSync<{ product_name: string; qty: number; unit_price: number; modifiers_label: string }>(
    'SELECT product_name, qty, unit_price, modifiers_label FROM transaction_items WHERE transaction_id = ?',
    [txId]
  )
  const rp = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
  const rows = items.map((i) => {
    const mods = i.modifiers_label ? `<div class="mod">+ ${esc(i.modifiers_label)}</div>` : ''
    return `<div class="item"><div>${i.qty}x ${esc(i.product_name)}${mods}</div><b>${rp(i.unit_price * i.qty)}</b></div>`
  }).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: monospace; width: 48mm; margin: 0 auto; font-size: 11px; }
  h2 { text-align: center; margin: 4px 0; letter-spacing: 2px; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .meta { font-size: 10px; }
  .item { display: flex; justify-content: space-between; gap: 6px; margin: 3px 0; }
  .mod { color: #444; padding-left: 8px; font-size: 10px; }
  .tot { display: flex; justify-content: space-between; margin: 2px 0; font-weight: bold; }
  .center { text-align: center; font-size: 10px; }
</style></head><body>
<h2>POS UMKM</h2>
<div class="meta">No: ${tx.invoice}<br/>Tgl: ${tx.created_at.slice(0, 16)}</div>
<div class="line"></div>
${rows}
<div class="line"></div>
${tx.discount > 0 ? `<div class="tot"><span>Diskon</span><span>-${rp(tx.discount)}</span></div>` : ''}
<div class="tot"><span>Total</span><span>${rp(tx.total)}</span></div>
<div class="tot"><span>${tx.payment_method === 'cash' ? 'Tunai' : 'QRIS'}</span><span>${rp(tx.paid)}</span></div>
${tx.payment_method === 'cash' ? `<div class="tot"><span>Kembalian</span><span>${rp(tx.change)}</span></div>` : ''}
<div class="line"></div>
<p class="center">Terima kasih! Semoga puas<br/>dengan layanan kami</p>
</body></html>`
}

/** Open the Android print dialog with a formatted receipt. */
export async function printReceipt(txId: number): Promise<void> {
  await Print.printAsync({ html: buildReceiptHtml(txId) })
}

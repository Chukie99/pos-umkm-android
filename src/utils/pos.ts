import { getDb } from '../db/database'

export interface Product {
  id: number
  name: string
  price: number
  category_name: string | null
}

export interface ModifierGroup {
  id: number
  product_id: number
  name: string
  min_select: number
  max_select: number
  modifiers: { id: number; label: string; extra_price: number }[]
}

export interface CartLine {
  key: string
  productId: number
  productName: string
  basePrice: number
  qty: number
  modifiers: { label: string; extra_price: number }[]
  unitPrice: number
}

export function listProducts(): Product[] {
  return getDb()
    .getAllSync<Product>(
      `SELECT p.id, p.name, p.price, c.name AS category_name
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1 ORDER BY p.name`
    )
}

export function listModifierGroups(productId: number): ModifierGroup[] {
  const db = getDb()
  const groups = db.getAllSync<ModifierGroup>(
    'SELECT * FROM modifier_groups WHERE product_id = ?',
    [productId]
  )
  for (const g of groups) {
    g.modifiers = db.getAllSync(
      'SELECT id, label, extra_price FROM modifiers WHERE group_id = ? ORDER BY extra_price, label',
      [g.id]
    ) as ModifierGroup['modifiers']
  }
  return groups
}

export function lineUnitPrice(basePrice: number, mods: CartLine['modifiers']): number {
  return basePrice + mods.reduce((s, m) => s + m.extra_price, 0)
}

export function cartTotals(cart: CartLine[]) {
  const total = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const itemCount = cart.reduce((s, l) => s + l.qty, 0)
  return { total, itemCount }
}

function nextInvoice(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const datePart = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const row = getDb().getFirstSync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM transactions WHERE invoice LIKE ?",
    [`INV-${datePart}-%`]
  )
  const seq = String((row?.c ?? 0) + 1).padStart(4, '0')
  return `INV-${datePart}-${seq}`
}

export function checkout(
  cart: CartLine[],
  paymentMethod: 'cash' | 'qris',
  paid: number
): { invoice: string; total: number; change: number } {
  if (cart.length === 0) throw new Error('Keranjang masih kosong')
  const total = cartTotals(cart).total
  if (paymentMethod === 'cash' && paid < total) throw new Error('Uang bayar kurang dari total')
  const effectivePaid = paymentMethod === 'qris' ? total : paid
  const change = effectivePaid - total

  const db = getDb()
  const invoice = nextInvoice()
  db.execSync('BEGIN')
  try {
    const txId = Number(
      db
        .prepareSync(
          'INSERT INTO transactions (invoice, total, paid, change, payment_method) VALUES (?, ?, ?, ?, ?)'
        )
        .executeSync(invoice, total, effectivePaid, change, paymentMethod).lastInsertRowId
    )
    const insItem = db.prepareSync(
      'INSERT INTO transaction_items (transaction_id, product_name, unit_price, qty, modifiers_label, line_total) VALUES (?, ?, ?, ?, ?, ?)'
    )
    for (const line of cart) {
      const modLabel = line.modifiers.map((m) => m.label).join(', ')
      insItem.executeSync(txId, line.productName, line.unitPrice, line.qty, modLabel, line.unitPrice * line.qty)
    }
    db.execSync('COMMIT')
  } catch (e) {
    db.execSync('ROLLBACK')
    throw e
  }
  return { invoice, total, change }
}

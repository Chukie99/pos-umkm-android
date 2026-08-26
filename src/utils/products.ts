import { getDb } from '../db/database'

export interface ProductRow {
  id: number
  name: string
  price: number
  category_name: string | null
  category_id: number | null
  is_active: number
}

export function listAllProducts(): ProductRow[] {
  return getDb().getAllSync<ProductRow>(
    `SELECT p.id, p.name, p.price, p.category_id, c.name AS category_name, p.is_active
     FROM products p LEFT JOIN categories c ON c.id = p.category_id
     ORDER BY p.is_active DESC, p.name`
  )
}

export function listCategories(): { id: number; name: string }[] {
  return getDb().getAllSync('SELECT id, name FROM categories ORDER BY name')
}

export function addProduct(name: string, price: number, categoryId: number | null): void {
  if (!name.trim()) throw new Error('Nama produk wajib diisi')
  if (!(price > 0)) throw new Error('Harga harus lebih dari 0')
  getDb().runSync(
    'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)',
    [name.trim(), Math.round(price), categoryId]
  )
}

export function updateProduct(id: number, name: string, price: number, categoryId: number | null): void {
  if (!name.trim()) throw new Error('Nama produk wajib diisi')
  if (!(price > 0)) throw new Error('Harga harus lebih dari 0')
  getDb().runSync(
    'UPDATE products SET name = ?, price = ?, category_id = ? WHERE id = ?',
    [name.trim(), Math.round(price), categoryId, id]
  )
}

export function toggleProductActive(id: number, active: boolean): void {
  getDb().runSync('UPDATE products SET is_active = ? WHERE id = ?', [active ? 1 : 0, id])
}

/** Soft-hide is safer than delete (keeps transaction history readable). */
export function deleteProduct(id: number): void {
  // Only allowed when product has never been sold
  const used = getDb().getFirstSync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM transaction_items ti JOIN products p ON p.id = ? WHERE 1=1 AND EXISTS(SELECT 1 FROM transaction_items t2 WHERE t2.product_name = (SELECT name FROM products WHERE id = ?)) LIMIT 1',
    [id, id]
  )
  if ((used?.c ?? 0) === 0) {
    getDb().runSync('DELETE FROM products WHERE id = ?', [id])
  } else {
    toggleProductActive(id, false)
  }
}

export function addCategory(name: string): number {
  const clean = name.trim()
  if (!clean) throw new Error('Nama kategori wajib diisi')
  const existing = getDb().getFirstSync<{ id: number }>('SELECT id FROM categories WHERE name = ?', [clean])
  if (existing) return existing.id
  const res = getDb().runSync('INSERT INTO categories (name) VALUES (?)', [clean])
  return Number(res.lastInsertRowId)
}

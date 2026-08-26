import { getDb } from '../db/database'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'

/** Export the whole database (all tables) as a .sql backup file and share it. */
export async function createBackup(): Promise<'shared' | 'unavailable'> {
  const db = getDb()
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  const fileName = `pos-umkm-backup-${stamp}.sql`

  const dump: string[] = ['BEGIN TRANSACTION;']

  // Table order respects FK dependencies
  const tables = [
    'categories', 'products', 'modifier_groups', 'modifiers',
    'transactions', 'transaction_items', 'license', 'settings',
  ]
  for (const table of tables) {
    try {
      const rows = db.getAllSync<Record<string, unknown>>(`SELECT * FROM ${table}`)
      if (rows.length === 0) continue
      dump.push(`\n-- ${table} (${rows.length} rows)`)
      for (const row of rows) {
        const cols = Object.keys(row)
        const values = cols.map((c) => {
          const v = row[c]
          if (v === null || v === undefined) return 'NULL'
          if (typeof v === 'number') return String(v)
          return `'${String(v).replace(/'/g, "''")}'`
        })
        dump.push(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${values.join(', ')});`)
      }
    } catch { /* table might not exist on older installs */ }
  }
  dump.push('COMMIT;')

  const sql = dump.join('\n')
  await FileSystem.writeAsStringAsync(FileSystem.Paths.cache + '/' + fileName, sql,
    { encoding: FileSystem.EncodingType.UTF8 })

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(FileSystem.Paths.cache + '/' + fileName, {
      mimeType: 'application/sql',
      dialogTitle: 'Simpan Backup Data POS',
    })
    return 'shared'
  }
  return 'unavailable'
}

/**
 * Restore from a previously exported .sql file content.
 * The user picks the file via a document picker in the UI; we receive its text.
 */
export function restoreFromSql(sqlText: string): { ok: boolean; message: string } {
  if (!sqlText.trim()) return { ok: false, message: 'File backup kosong' }
  if (!sqlText.includes('INSERT INTO')) return { ok: false, message: 'Bukan file backup yang valid' }

  const db = getDb()
  db.execSync('BEGIN')
  try {
    // Wipe current data first so restore is clean (keep schema)
    for (const t of ['transaction_items', 'transactions', 'modifiers',
                     'modifier_groups', 'products', 'categories']) {
      db.execSync(`DELETE FROM ${t};`)
    }
    db.execSync(sqlText)
    db.execSync('COMMIT')
    return { ok: true, message: 'Data berhasil dipulihkan' }
  } catch (e) {
    db.execSync('ROLLBACK')
    return { ok: false, message: e instanceof Error ? e.message : String(e) }
  }
}

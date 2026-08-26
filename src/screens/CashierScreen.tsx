import React, { useMemo, useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable } from 'react-native'
import { Text, Surface, Modal } from 'react-native-paper'
import { colors } from '../theme/theme'
import { listProducts, listModifierGroups, cartTotals, checkout, type Product, type ModifierGroup, type CartLine } from '../utils/pos'
import StickyCartBar, { rupiah } from '../components/StickyCartBar'
import ModifierSheet from '../components/ModifierSheet'
import CheckoutSheet from '../components/CheckoutSheet'
import { buildReceiptText } from '../utils/receipt'
import { shareReceipt } from '../utils/export'

export default function CashierScreen({ onSold }: { onSold: () => void }) {
  const products = useMemo(() => listProducts(), [])
  const [cart, setCart] = useState<CartLine[]>([])
  const [pickProduct, setPickProduct] = useState<Product | null>(null)
  const [groups, setGroups] = useState<ModifierGroup[]>([])
  const [selected, setSelected] = useState<Map<number, string[]>>(new Map())
  const [showCheckout, setShowCheckout] = useState(false)
  const [lastSale, setLastSale] = useState<string | null>(null)
  const [lastTxId, setLastTxId] = useState<number | null>(null)

  const { total, itemCount } = cartTotals(cart)

  // Load modifier groups lazily when a product is picked
  const openProduct = (p: Product) => {
    setPickProduct(p)
    setSelected(new Map())
    setGroups(listModifierGroups(p.id))
  }

  const toggleMod = (groupId: number, _modId: number, label: string) => {
    setSelected((prev) => {
      const next = new Map(prev)
      const group = groups.find((g) => g.id === groupId)!
      const current = next.get(groupId) || []
      if (group.max_select === 1) {
        next.set(groupId, current.includes(label) ? [] : [label])
      } else {
        if (current.includes(label)) {
          next.set(groupId, current.filter((l) => l !== label))
        } else if (current.length < group.max_select) {
          next.set(groupId, [...current, label])
        }
      }
      return next
    })
  }

  const addLine = () => {
    if (!pickProduct) return
    const mods = groups.flatMap((g) =>
      (selected.get(g.id) || []).map((label) => ({
        label,
        extra_price: g.modifiers.find((m) => m.label === label)?.extra_price ?? 0,
      }))
    )
    const key = `${pickProduct.id}::${mods.map((m) => m.label).sort().join('+')}`
    const unitPrice = pickProduct.price + mods.reduce((s, m) => s + m.extra_price, 0)

    setCart((prev) => {
      const existing = prev.find((l) => l.key === key)
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
      }
      return [
        ...prev,
        {
          key,
          productId: pickProduct.id,
          productName: pickProduct.name,
          basePrice: pickProduct.price,
          qty: 1,
          modifiers: mods,
          unitPrice,
        },
      ]
    })
    setPickProduct(null)
  }

  const bumpQty = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    )
  }

  const doCheckout = (method: 'cash' | 'qris', paid: number) => {
    const res = checkout(cart, method, paid)
    setCart([])
    setShowCheckout(false)
    setLastSale(`${res.invoice} • Kembalian ${method === 'cash' ? rupiah(res.change) : '—'}`)
    onSold()
    setTimeout(() => setLastSale(null), 5000)
    // Remember the new transaction id so the receipt can be shared from the toast
    const db = require('../db/database').getDb()
    const row = db.getFirstSync('SELECT id FROM transactions ORDER BY id DESC LIMIT 1') as { id: number } | undefined
    if (row) setLastTxId(row.id)
  }

  return (
    <View style={styles.root}>
      {/* Product grid */}
      <ScrollView contentContainerStyle={styles.grid}>
        {products.map((p) => (
          <Pressable key={p.id} style={styles.card} android_ripple={{ color: colors.chipBg }} onPress={() => openProduct(p)}>
            <Text numberOfLines={2} style={styles.cardName}>{p.name}</Text>
            <Text style={styles.cardPrice}>{rupiah(p.price)}</Text>
            {p.category_name ? <Text style={styles.cardCat}>{p.category_name}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>

      <StickyCartBar visible cart={cart} total={total} onCheckout={() => setShowCheckout(true)} />

      {/* Modifier picker */}
      <Modal visible={!!pickProduct} onDismiss={() => setPickProduct(null)} contentContainerStyle={styles.sheet}>
        {pickProduct ? (
          <>
            <Text variant="headlineSmall" style={styles.sheetTitle}>{pickProduct.name}</Text>
            <Text style={styles.sheetPrice}>{rupiah(pickProduct.price)}</Text>
            {groups.length > 0 ? (
              <ModifierSheet groups={groups} selected={selected} onToggle={toggleMod} onDone={addLine} />
            ) : (
              <Surface style={styles.noMod} elevation={0}>
                <Text style={{ color: colors.textMuted }}>Produk tanpa varian.</Text>
              </Surface>
            )}
            <Pressable onPress={addLine} style={styles.addPlainBtn}>
              <Text style={styles.addPlainTxt}>Tambah Polos</Text>
            </Pressable>
          </>
        ) : null}
      </Modal>

      <CheckoutSheet
        visible={showCheckout}
        cart={cart}
        onClose={() => setShowCheckout(false)}
        onConfirm={doCheckout}
      />

      {lastSale ? (
        <Surface style={styles.toast} elevation={0}>
          <Text style={styles.toastText}>✔ Terjual — {lastSale}</Text>
          {lastTxId ? (
            <Pressable
              onPress={async () => {
                try { await shareReceipt(buildReceiptText(lastTxId)) } catch {}
              }}
              android_ripple={{ color: colors.chipBg }}
              style={styles.shareBtn}
            >
              <Text style={styles.shareTxt}>📤 Kirim Struk</Text>
            </Pressable>
          ) : null}
        </Surface>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14, paddingBottom: 110 },
  card: {
    width: '31.5%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 18,
    paddingHorizontal: 12,
    minHeight: 108,
    justifyContent: 'space-between',
  },
  cardName: { fontSize: 17, fontWeight: '800', color: colors.text, lineHeight: 22 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: colors.greenDark, marginTop: 6 },
  cardCat: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  sheet: { backgroundColor: '#FFF', margin: 18, borderRadius: 20, padding: 22 },
  sheetTitle: { fontWeight: '800', color: colors.text },
  sheetPrice: { fontSize: 18, fontWeight: '800', color: colors.greenDark, marginBottom: 16 },
  noMod: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16, alignItems: 'center' },
  addPlainBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  addPlainTxt: { color: colors.blue, fontWeight: '700' },
  toast: {
    position: 'absolute', top: 14, alignSelf: 'center',
    backgroundColor: colors.chipBg, borderRadius: 999,
    borderWidth: 1, borderColor: colors.green,
    paddingHorizontal: 18, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  shareBtn: { backgroundColor: '#FFF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  shareTxt: { color: colors.greenDark, fontWeight: '700', fontSize: 12 },
  toastText: { color: colors.greenDark, fontWeight: '700', fontSize: 13 },
})

import React, { useState } from 'react'
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native'
import { Text, Surface, Modal, TextInput, Switch, Button } from 'react-native-paper'
import { colors } from '../theme/theme'
import {
  listAllProducts, listCategories, addProduct, updateProduct,
  toggleProductActive, deleteProduct, addCategory, type ProductRow,
} from '../utils/products'

const rupiah = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID')

interface EditingState { id: number | null; name: string; price: string; categoryId: number | null }
const EMPTY_EDIT: EditingState = { id: null, name: '', price: '', categoryId: null }

export default function ManageProductsScreen() {
  const [products, setProducts] = useState<ProductRow[]>(() => listAllProducts())
  const [categories] = useState(() => listCategories())
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [newCat, setNewCat] = useState('')
  const [showNewCat, setShowNewCat] = useState(false)

  const refresh = () => setProducts(listAllProducts())

  const openAdd = () => setEditing({ ...EMPTY_EDIT })

  const openEdit = (p: ProductRow) =>
    setEditing({ id: p.id, name: p.name, price: String(p.price), categoryId: p.category_id })

  const save = () => {
    if (!editing) return
    try {
      if (editing.id === null) {
        addProduct(editing.name, Number(editing.price.replace(/\D/g, '')), editing.categoryId)
      } else {
        updateProduct(editing.id, editing.name, Number(editing.price.replace(/\D/g, '')), editing.categoryId)
      }
      setEditing(null)
      refresh()
    } catch (e) {
      Alert.alert('Gagal simpan', e instanceof Error ? e.message : String(e))
    }
  }

  const confirmDelete = (p: ProductRow) => {
    Alert.alert(
      'Hapus produk?',
      `"${p.name}" akan disembunyikan dari kasir. Riwayat transaksi tetap aman.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus', style: 'destructive',
          onPress: () => { deleteProduct(p.id); refresh() },
        },
      ]
    )
  }

  const saveCategory = () => {
    try {
      addCategory(newCat)
      setNewCat('')
      setShowNewCat(false)
    } catch (e) {
      Alert.alert('Gagal', e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Button mode="contained" icon="plus" onPress={openAdd} style={styles.addBtn} contentStyle={{ height: 48 }}>
          Tambah Produk Baru
        </Button>

        {/* Category quick-add */}
        {!showNewCat ? (
          <Pressable onPress={() => setShowNewCat(true)}>
            <Text style={styles.catLink}>+ Tambah kategori baru</Text>
          </Pressable>
        ) : (
          <View style={styles.catRow}>
            <TextInput
              value={newCat}
              onChangeText={setNewCat}
              placeholder="Nama kategori (contoh: Snack)"
              style={{ flex: 1, backgroundColor: '#FFF' }}
              dense
            />
            <Button mode="contained" onPress={saveCategory} compact style={{ marginLeft: 8 }}>
              Simpan
            </Button>
          </View>
        )}

        <Text style={styles.sectionTitle}>Daftar Produk ({products.length})</Text>

        {products.map((p) => (
          <Surface key={p.id} style={[styles.card, !p.is_active && styles.cardInactive]} elevation={0}>
            <Pressable style={{ flex: 1 }} onPress={() => openEdit(p)}>
              <Text style={styles.name}>{p.name}</Text>
              <Text style={styles.price}>{rupiah(p.price)}{p.category_name ? `  •  ${p.category_name}` : ''}</Text>
              {!p.is_active && <Text style={styles.inactive}>Nonaktif</Text>}
            </Pressable>
            <Switch
              value={!!p.is_active}
              onValueChange={(v) => { toggleProductActive(p.id, v); refresh() }}
              trackColor={{ true: colors.green }}
            />
            <Pressable onPress={() => confirmDelete(p)} hitSlop={12}>
              <Text style={styles.del}>🗑</Text>
            </Pressable>
          </Surface>
        ))}
      </ScrollView>

      {/* Add/Edit modal */}
      <Modal visible={!!editing} onDismiss={() => setEditing(null)} contentContainerStyle={styles.modal}>
        {editing ? (
          <>
            <Text variant="titleLarge" style={styles.modalTitle}>
              {editing.id === null ? 'Tambah Produk' : 'Edit Produk'}
            </Text>

            <Text style={styles.label}>Nama Produk *</Text>
            <TextInput value={editing.name} onChangeText={(v) => setEditing({ ...editing, name: v })}
              style={{ backgroundColor: '#FFF' }} placeholder="contoh: Kopi Susu Gula Aren" />

            <Text style={styles.label}>Harga *</Text>
            <TextInput value={editing.price}
              onChangeText={(v) => setEditing({ ...editing, price: v.replace(/\D/g, '') })}
              keyboardType="number-pad"
              left={<TextInput.Affix text="Rp " />}
              style={{ backgroundColor: '#FFF' }} placeholder="15000" />

            <Text style={styles.label}>Kategori</Text>
            <View style={styles.chips}>
              <Pressable onPress={() => setEditing({ ...editing, categoryId: null })}
                style={[styles.chip, editing.categoryId === null && styles.chipActive]}>
                <Text style={[styles.chipTxt, editing.categoryId === null && styles.chipTxtActive]}>Tanpa kategori</Text>
              </Pressable>
              {categories.map((c) => (
                <Pressable key={c.id} onPress={() => setEditing({ ...editing, categoryId: c.id })}
                  style={[styles.chip, editing.categoryId === c.id && styles.chipActive]}>
                  <Text style={[styles.chipTxt, editing.categoryId === c.id && styles.chipTxtActive]}>{c.name}</Text>
                </Pressable>
              ))}
            </View>

            <Button mode="contained" onPress={save} contentStyle={{ height: 52 }} style={{ marginTop: 20 }}>
              Simpan Produk
            </Button>
            <Button mode="text" onPress={() => setEditing(null)} textColor={colors.textMuted}>
              Batal
            </Button>
          </>
        ) : null}
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 14 },
  addBtn: { marginBottom: 12 },
  catLink: { color: colors.blue, fontWeight: '600', fontSize: 13, marginBottom: 16, marginLeft: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    padding: 14, marginBottom: 8,
  },
  cardInactive: { opacity: 0.55 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  price: { fontSize: 13, color: colors.greenDark, marginTop: 2 },
  inactive: { fontSize: 11, color: colors.error, marginTop: 2 },
  del: { fontSize: 18 },
  modal: { backgroundColor: '#FFF', margin: 20, borderRadius: 20, padding: 22 },
  modalTitle: { fontWeight: '800', color: colors.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginTop: 12, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#FFF',
  },
  chipActive: { backgroundColor: colors.chipBg, borderColor: colors.green },
  chipTxt: { fontSize: 13, color: colors.text },
  chipTxtActive: { color: colors.greenDark, fontWeight: '700' },
})

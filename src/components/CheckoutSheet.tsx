import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text, Surface, Modal, Button, SegmentedButtons, TextInput } from 'react-native-paper'
import { colors } from '../theme/theme'
import type { CartLine } from '../utils/pos'
import { rupiah } from '../components/StickyCartBar'

interface Props {
  visible: boolean
  cart: CartLine[]
  onClose: () => void
  onConfirm: (method: 'cash' | 'qris', paid: number, discount: number) => void
}

const PRESETS = [20000, 50000, 100000]

export default function CheckoutSheet({ visible, cart, onClose, onConfirm }: Props) {
  const [method, setMethod] = React.useState<'cash' | 'qris'>('cash')
  const [paidStr, setPaidStr] = React.useState('')
  const [discMode, setDiscMode] = React.useState<'none' | 'rp' | 'pct'>('none')
  const [discVal, setDiscVal] = React.useState('')
  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const calculatedDiscount =
    discMode === 'rp'
      ? Math.min(subtotal, parseInt(discVal.replace(/\D/g, '') || '0', 10))
      : discMode === 'pct'
        ? Math.floor((subtotal * Math.min(100, parseInt(discVal.replace(/\D/g, '') || '0', 10))) / 100)
        : 0
  const finalTotal = Math.max(0, subtotal - calculatedDiscount)
  const paid = method === 'qris' ? finalTotal : parseInt(paidStr.replace(/\D/g, '') || '0', 10)
  const change = Math.max(0, paid - finalTotal)
  const enough = method === 'qris' || paid >= finalTotal
  const isExact = paid === finalTotal && paid > 0

  const reset = () => { setPaidStr(''); setMethod('cash'); setDiscMode('none'); setDiscVal('') }

  React.useEffect(() => {
    if (method === 'qris') setPaidStr('')
  }, [method])

  const applyPreset = (amount: number) => {
    setPaidStr(String(amount))
  }

  return (
    <Modal visible={visible} onDismiss={() => { reset(); onClose() }} contentContainerStyle={styles.modal}>
      <Text variant="titleLarge" style={styles.title}>Pembayaran</Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal</Text>
        <Text style={styles.totalValue}>{rupiah(subtotal)}</Text>
      </View>

      {/* Diskon */}
      <Text style={styles.label}>Diskon</Text>
      <View style={styles.discRow}>
        {(['none', 'rp', 'pct'] as const).map((m) => (
          <Button
            key={m}
            mode={discMode === m ? 'contained' : 'outlined'}
            compact
            onPress={() => { setDiscMode(m); if (m === 'none') setDiscVal('') }}
            style={styles.discBtn}
          >
            {m === 'none' ? 'Tanpa' : m === 'rp' ? 'Rp' : '%'}
          </Button>
        ))}
        {discMode !== 'none' ? (
          <TextInput
            value={discVal}
            onChangeText={(v) => setDiscVal(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            dense
            style={styles.discInput}
            placeholder={discMode === 'rp' ? '5000' : '10'}
          />
        ) : null}
      </View>
      {calculatedDiscount > 0 ? (
        <Text style={styles.discApplied}>Diskon −{rupiah(calculatedDiscount)}</Text>
      ) : null}
      <Text style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Dibayar</Text>
        <Text style={styles.totalValue}>{rupiah(finalTotal)}</Text>
      </Text>

      {/* Metode Bayar */}
      <SegmentedButtons
        value={method}
        onValueChange={(v) => setMethod(v as 'cash' | 'qris')}
        buttons={[
          { value: 'cash', label: 'Tunai' },
          { value: 'qris', label: 'QRIS' },
        ]}
        style={styles.segmented}
      />

      {/* Tunai: input + preset cepat */}
      {method === 'cash' ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.label}>Uang Diterima</Text>
          <TextInput
            value={paidStr}
            onChangeText={(v) => setPaidStr(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            dense
            style={styles.paidInput}
            placeholder="Ketik nominal uang..."
            placeholderTextColor={colors.textMuted}
            autoFocus
          />
          {/* Preset cepat */}
          <View style={styles.presetRow}>
            {PRESETS.map((amt) => (
              <Pressable
                key={amt}
                onPress={() => applyPreset(amt)}
                style={[styles.presetBtn, paid === amt && styles.presetBtnActive]}
                android_ripple={{ color: colors.chipBg }}
              >
                <Text style={[styles.presetTxt, paid === amt && styles.presetTxtActive]}>
                  {amt >= 100000 ? `${amt / 1000}K` : `${amt / 1000}K`}
                </Text>
              </Pressable>
            ))}
          </View>
          {paid > 0 ? (
            <Text style={[styles.paidText, !enough && styles.paidBad]}>
              {rupiah(paid)} {enough ? (isExact ? '(pas)' : '') : '(kurang)'}
            </Text>
          ) : null}
        </View>
      ) : null}

      {/* Hasil */}
      <View style={styles.changeRow}>
        <Text style={styles.changeLabel}>{method === 'qris' ? 'Status' : 'Kembalian'}</Text>
        <Text style={[styles.changeValue, !enough && styles.paidBad]}>
          {method === 'qris' ? 'Bayar penuh via QRIS' : enough ? rupiah(change) : 'Kurang ' + rupiah(finalTotal - paid)}
        </Text>
      </View>

      {/* Tombol Aksi */}
      <Button
        mode="contained"
        disabled={!enough || cart.length === 0}
        onPress={() => { onConfirm(method, paid, calculatedDiscount); reset() }}
        contentStyle={styles.confirmBtn}
      >
        Konfirmasi & Selesai
      </Button>
      <Button mode="text" onPress={() => { reset(); onClose() }} textColor={colors.textMuted} style={styles.cancelBtn}>
        Batal
      </Button>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modal: { backgroundColor: colors.surface, margin: 20, borderRadius: 20, padding: 22 },
  title: { fontWeight: '800', color: colors.text, marginBottom: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, color: colors.textMuted },
  totalValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  discRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  discBtn: { flex: 1 },
  discInput: { flex: 2, backgroundColor: colors.surface, height: 40 },
  discApplied: { fontSize: 13, fontWeight: '600', color: colors.terra, textAlign: 'center', marginBottom: 4 },
  segmented: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginTop: 12 },
  paidInput: { backgroundColor: colors.surface, height: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, fontSize: 24, fontWeight: '700', color: colors.text },
  presetRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  presetBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.chipBg,
  },
  presetBtnActive: { borderColor: colors.green, backgroundColor: colors.green + '15' },
  presetTxt: { fontSize: 14, fontWeight: '800', color: colors.textMuted },
  presetTxtActive: { color: colors.green },
  paidText: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 8 },
  paidBad: { color: colors.error },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  changeLabel: { fontSize: 15, color: colors.textMuted },
  changeValue: { fontSize: 24, fontWeight: '800', color: colors.green },
  confirmBtn: { height: 54 },
  cancelBtn: { marginTop: 4 },
})

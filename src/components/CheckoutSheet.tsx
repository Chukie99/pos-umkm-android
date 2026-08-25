import React, { useMemo } from 'react'
import { View, StyleSheet, Pressable, ScrollView } from 'react-native'
import { Text, Surface, Modal, Button, SegmentedButtons } from 'react-native-paper'
import { colors } from '../theme/theme'
import type { CartLine } from '../utils/pos'
import { rupiah } from '../components/StickyCartBar'

interface Props {
  visible: boolean
  cart: CartLine[]
  onClose: () => void
  onConfirm: (method: 'cash' | 'qris', paid: number) => void
}

const QUICK_CASH = [20000, 50000, 100000]

export default function CheckoutSheet({ visible, cart, onClose, onConfirm }: Props) {
  const [method, setMethod] = React.useState<'cash' | 'qris'>('cash')
  const [paidStr, setPaidStr] = React.useState('')
  const total = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const paid = method === 'qris' ? total : parseInt(paidStr.replace(/\D/g, '') || '0', 10)
  const change = Math.max(0, paid - total)
  const enough = method === 'qris' || paid >= total

  const reset = () => { setPaidStr(''); setMethod('cash') }

  return (
    <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modal}>
      <Text variant="titleLarge" style={styles.title}>Pembayaran</Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Tagihan</Text>
        <Text style={styles.totalValue}>{rupiah(total)}</Text>
      </View>

      <SegmentedButtons
        value={method}
        onValueChange={(v) => setMethod(v as 'cash' | 'qris')}
        buttons={[
          { value: 'cash', label: 'Tunai' },
          { value: 'qris', label: 'QRIS' },
        ]}
        style={styles.segmented}
      />

      {method === 'cash' ? (
        <>
          <Text style={styles.label}>Uang Diterima</Text>
          <Surface style={styles.paidBox} elevation={0}>
            <Text style={[styles.paidText, !enough && styles.paidBad]}>{rupiah(paid)}</Text>
          </Surface>
          <View style={styles.quickRow}>
            {[total, ...QUICK_CASH.filter((v) => v > total)].map((v) => (
              <Button key={v} mode="outlined" compact onPress={() => setPaidStr(String(v))} style={styles.quickBtn}>
                Pas ({rupiah(v)})
              </Button>
            ))}
          </View>
        </>
      ) : (
        <Surface style={styles.qrisBox} elevation={0}>
          <Text style={styles.qrisText}>
            Minta customer scan QRIS merchant, lalu tekan konfirmasi setelah dana masuk.
          </Text>
        </Surface>
      )}

      <View style={styles.changeRow}>
        <Text style={styles.changeLabel}>{method === 'qris' ? 'Status' : 'Kembalian'}</Text>
        <Text style={[styles.changeValue, !enough && styles.paidBad]}>
          {method === 'qris' ? 'Bayar penuh via QRIS' : enough ? rupiah(change) : 'Kurang ' + rupiah(total - paid)}
        </Text>
      </View>

      <Button
        mode="contained"
        disabled={!enough || cart.length === 0}
        onPress={() => { onConfirm(method, paid); reset() }}
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
  modal: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 20,
    padding: 22,
  },
  title: { fontWeight: '800', color: colors.text, marginBottom: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 15, color: colors.textMuted },
  totalValue: { fontSize: 26, fontWeight: '800', color: colors.text },
  segmented: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  paidBox: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  paidText: { fontSize: 28, fontWeight: '800', color: colors.text },
  paidBad: { color: colors.error },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  quickBtn: { borderColor: colors.border },
  qrisBox: { backgroundColor: colors.chipBg, borderRadius: 12, padding: 16 },
  qrisText: { color: colors.greenDark, fontSize: 14, lineHeight: 20 },
  changeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 16 },
  changeLabel: { fontSize: 15, color: colors.textMuted },
  changeValue: { fontSize: 24, fontWeight: '800', color: colors.green },
  confirmBtn: { height: 54 },
  cancelBtn: { marginTop: 4 },
})

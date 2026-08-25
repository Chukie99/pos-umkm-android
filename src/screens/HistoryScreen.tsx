import React from 'react'
import { View, StyleSheet, Text as RNText } from 'react-native'
import { Text } from 'react-native-paper'
import { colors } from '../theme/theme'
import { getDb } from '../db/database'

interface Row { invoice: string; total: number; payment_method: string; created_at: string; items: string }

export default function HistoryScreen() {
  const today = new Date().toISOString().slice(0, 10)
  const rows = getDb().getAllSync<Row>(
    `SELECT t.invoice, t.total, t.payment_method, t.created_at,
            GROUP_CONCAT(ti.qty || 'x ' || ti.product_name, char(10)) AS items
     FROM transactions t JOIN transaction_items ti ON ti.transaction_id = t.id
     WHERE date(t.created_at) = date('now','localtime')
     GROUP BY t.id ORDER BY t.id DESC`
  )
  const revenue = rows.reduce((s, r) => s + r.total, 0)
  const cash = rows.filter((r) => r.payment_method === 'cash').reduce((s, r) => s + r.total, 0)
  const qris = rows.filter((r) => r.payment_method === 'qris').reduce((s, r) => s + r.total, 0)

  return (
    <View style={styles.root}>
      <View style={styles.cards}>
        <StatCard label="Transaksi" value={String(rows.length)} />
        <StatCard label="Omzet Hari Ini" value={'Rp ' + revenue.toLocaleString('id-ID')} highlight />
      </View>
      <View style={styles.cards}>
        <StatCard label="Tunai" value={'Rp ' + cash.toLocaleString('id-ID')} />
        <StatCard label="QRIS" value={'Rp ' + qris.toLocaleString('id-ID')} />
      </View>

      <RNText style={styles.sectionTitle}>Riwayat Transaksi</RNText>
      <TransactionList rows={rows} />
    </View>
  )
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={[styles.card, highlight && styles.cardHighlight]}>
      <RNText style={styles.cardLabel}>{label}</RNText>
      <RNText style={[styles.cardValue, highlight && { color: colors.greenDark }]}>{value}</RNText>
    </View>
  )
}

function TransactionList({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <RNText style={styles.empty}>Belum ada transaksi hari ini.</RNText>
  }
  const { ScrollView } = require('react-native')
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      {rows.map((r) => (
        <View key={r.invoice} style={styles.txCard}>
          <View style={styles.txHead}>
            <RNText style={styles.txInvoice}>{r.invoice}</RNText>
            <RNText style={styles.txTime}>{r.created_at.slice(11, 16)}</RNText>
          </View>
          <RNText style={styles.txItems}>{r.items}</RNText>
          <View style={styles.txFoot}>
            <RNText style={styles.txMethod}>{r.payment_method === 'cash' ? 'TUNAI' : 'QRIS'}</RNText>
            <RNText style={styles.txTotal}>Rp {r.total.toLocaleString('id-ID')}</RNText>
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 14 },
  cards: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  card: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  cardHighlight: { backgroundColor: colors.chipBg, borderColor: colors.green },
  cardLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  cardValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginVertical: 12 },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: 32 },
  txCard: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10 },
  txHead: { flexDirection: 'row', justifyContent: 'space-between' },
  txInvoice: { fontSize: 13, fontWeight: '700', color: colors.text },
  txTime: { fontSize: 13, color: colors.textMuted },
  txItems: { fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 18 },
  txFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  txMethod: { fontSize: 11, fontWeight: '800', color: colors.blue, letterSpacing: 1 },
  txTotal: { fontSize: 15, fontWeight: '800', color: colors.greenDark },
})

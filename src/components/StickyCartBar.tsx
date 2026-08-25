import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text, Surface } from 'react-native-paper'
import { colors } from '../theme/theme'
import type { CartLine } from '../utils/pos'

interface Props {
  visible: boolean
  cart: CartLine[]
  total: number
  onCheckout: () => void
}

export const rupiah = (n: number) => 'Rp ' + Math.round(n).toLocaleString('id-ID')

/**
 * Floating sticky bottom bar — thumb-friendly one-handed checkout.
 * Total on the left, big green Bayar button on the right.
 */
export default function StickyCartBar({ visible, cart, total, onCheckout }: Props) {
  if (!visible || cart.length === 0) return null
  const itemCount = cart.reduce((s, l) => s + l.qty, 0)

  return (
    <Surface style={styles.bar} elevation={0}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemCount}>{itemCount} item</Text>
        <Text variant="titleLarge" style={styles.total}>{rupiah(total)}</Text>
        <Text numberOfLines={1} style={styles.preview}>
          {cart.map((l) => `${l.qty}× ${l.productName}`).join(', ')}
        </Text>
      </View>
      <Pressable
        onPress={onCheckout}
        android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
        style={styles.payBtn}
      >
        <Text style={styles.payBtnText}>BAYAR</Text>
      </Pressable>
    </Surface>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  itemCount: { fontSize: 12, color: colors.textMuted },
  total: { fontWeight: '800', color: colors.text, marginTop: -2 },
  preview: { fontSize: 11, color: colors.textMuted },
  payBtn: {
    backgroundColor: colors.green,
    minWidth: 132,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
})

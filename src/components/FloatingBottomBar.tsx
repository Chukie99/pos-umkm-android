import React from 'react'
import { View, StyleSheet, Pressable, Platform } from 'react-native'
import { Text } from 'react-native-paper'
import { colors } from '../theme/theme'

export type Tab = 'kasir' | 'produk' | 'riwayat' | 'pengaturan'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'kasir', label: 'Kasir', icon: '🧾' },
  { id: 'produk', label: 'Produk', icon: '📦' },
  { id: 'riwayat', label: 'Laporan', icon: '📊' },
  { id: 'pengaturan', label: 'Lainnya', icon: '⚙️' },
]

export default function FloatingBottomBar({ active, onChange }: Props) {
  return (
    <View style={[styles.wrap, Platform.OS === 'ios' && { paddingBottom: 12 }]}>
      <View style={styles.bar}>
        {ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <Pressable
              key={item.id}
              onPress={() => onChange(item.id)}
              android_ripple={{ color: colors.chipBg, borderless: true }}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
                isActive && styles.itemActive,
                isActive && { backgroundColor: colors.green },
              ]}
            >
              <Text style={[styles.icon, isActive && styles.iconActive]}>{item.icon}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bar: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.bg,
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 18,
    gap: 2,
  },
  itemPressed: {
    opacity: 0.7,
  },
  itemActive: {
    backgroundColor: colors.green,
  },
  icon: {
    fontSize: 20,
    opacity: 0.55,
  },
  iconActive: {
    opacity: 1,
    color: '#FFF',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  labelActive: {
    color: '#FFF',
  },
})

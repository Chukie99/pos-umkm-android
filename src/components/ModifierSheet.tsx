import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Chip, Button, Divider } from 'react-native-paper'
import { colors } from '../theme/theme'
import type { ModifierGroup } from '../utils/pos'

interface Props {
  groups: ModifierGroup[]
  selected: Map<number, string[]>
  onToggle: (groupId: number, modId: number, label: string) => void
  onDone: () => void
}

/**
 * Bottom-sheet style modifier picker.
 * Groups with max_select = 1 behave like radio (Rasa / Suhu / Level Pedas),
 * max_select > 1 behave like checkboxes (Topping / Extra).
 */
export default function ModifierSheet({ groups, selected, onToggle, onDone }: Props) {
  return (
    <View style={styles.wrap}>
      {groups.map((g) => (
        <View key={g.id} style={styles.group}>
          <Text variant="titleMedium" style={styles.groupName}>
            {g.name}
            <Text style={styles.hint}>  {g.max_select === 1 ? '(pilih 1)' : `(maks ${g.max_select})`}</Text>
          </Text>
          <View style={styles.row}>
            {g.modifiers.map((m) => {
              const active = (selected.get(g.id) || []).includes(m.label)
              return (
                <Chip
                  key={m.id}
                  mode="flat"
                  selected={active}
                  onPress={() => onToggle(g.id, m.id, m.label)}
                  style={[styles.chip, active && styles.chipActive]}
                  textStyle={{ color: active ? colors.greenDark : colors.text }}
                >
                  {m.label}{m.extra_price > 0 ? ` +${(m.extra_price / 1000).toFixed(0)}k` : ''}
                </Chip>
              )
            })}
          </View>
        </View>
      ))}
      <Divider style={styles.divider} />
      <Button mode="contained" onPress={onDone} contentStyle={styles.doneBtn}>
        Tambah ke Keranjang
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 8 },
  group: { marginBottom: 14 },
  groupName: { fontWeight: '700', color: colors.text, marginBottom: 8 },
  hint: { fontSize: 13, color: colors.textMuted },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#FFFFFF', borderColor: colors.border, borderWidth: 1 },
  chipActive: { backgroundColor: colors.chipBg, borderColor: colors.green },
  divider: { marginVertical: 12 },
  doneBtn: { height: 52 },
})

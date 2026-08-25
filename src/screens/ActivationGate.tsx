import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Text, Surface } from 'react-native-paper'
import { colors } from '../theme/theme'

/**
 * High-contrast license gate.
 * Shows the device code so the customer can send it to the vendor,
 * and locks the app until a valid activation key is entered.
 */
export default function ActivationGate({ deviceCode, onActivate }: { deviceCode: string; onActivate: (key: string) => boolean }) {
  const [key, setKey] = React.useState('')
  const [error, setError] = React.useState('')

  const submit = () => {
    if (!key.trim()) { setError('Masukkan kode aktivasi'); return }
    if (!onActivate(key)) setError('Kode aktivasi tidak valid untuk perangkat ini')
  }

  return (
    <View style={styles.root}>
      <Text style={styles.brand}>POS UMKM</Text>
      <Text style={styles.tagline}>Kasir Offline untuk Warung & Kedai</Text>

      <Surface style={styles.card} elevation={0}>
        <Text style={styles.sectionLabel}>Device ID HP Ini</Text>
        <Surface style={styles.deviceBox} elevation={0}>
          <Text selectable style={styles.deviceCode}>{deviceCode}</Text>
        </Surface>
        <Text style={styles.helpText}>
          Kirim kode di atas ke penjual untuk mendapatkan Kode Aktivasi Anda.
        </Text>

        <Text style={[styles.sectionLabel, { marginTop: 22 }]}>Kode Aktivasi</Text>
        <Pressable onPress={() => {}}>
          <Surface style={[styles.inputBox, error ? styles.inputError : null]} elevation={0}>
            <Text style={[styles.inputText, !key && styles.placeholder]}>
              {key || 'XXXX-XXXX-XXXX-XXXX'}
            </Text>
          </Surface>
        </Pressable>
        {/* Real input lives below for keyboard support */}
        <HiddenInput value={key} onChange={(v) => { setKey(v.toUpperCase()); setError('') }} onSubmit={submit} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={submit} android_ripple={{ color: 'rgba(255,255,255,0.2)' }} style={styles.activateBtn}>
          <Text style={styles.activateBtnText}>AKTIVASI</Text>
        </Pressable>
      </Surface>

      <Text style={styles.footer}>Aplikasi terkunci sampai aktivasi berhasil.</Text>
    </View>
  )
}

// Keyboard input rendered transparently over the fake box
function HiddenInput({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  const { TextInput } = require('react-native')
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      onSubmitEditing={onSubmit}
      autoCapitalize="characters"
      autoCorrect={false}
      maxLength={19}
      style={{
        position: 'absolute', opacity: 0, height: 1, width: '100%',
        top: -999,
      }}
    />
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  brand: { fontSize: 34, fontWeight: '900', color: colors.greenDark, letterSpacing: 2 },
  tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 28 },
  card: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  deviceBox: { backgroundColor: colors.chipBg, borderRadius: 12, borderWidth: 1, borderColor: colors.green, alignItems: 'center', paddingVertical: 16 },
  deviceCode: { fontSize: 24, fontWeight: '900', color: colors.greenDark, letterSpacing: 3 },
  helpText: { fontSize: 13, color: colors.textMuted, marginTop: 10, lineHeight: 18 },
  inputBox: { backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', paddingVertical: 14 },
  inputError: { borderColor: colors.error },
  inputText: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: 2 },
  placeholder: { color: '#B9B7B0' },
  error: { color: colors.error, fontWeight: '600', marginTop: 10 },
  activateBtn: { backgroundColor: colors.green, borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  activateBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17, letterSpacing: 1.5 },
  footer: { marginTop: 20, fontSize: 12, color: colors.textMuted },
})

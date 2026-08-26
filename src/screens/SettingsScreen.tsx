import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Surface, Button, List } from 'react-native-paper'
import { colors } from '../theme/theme'
import { exportDailyReport } from '../utils/export'
import { createBackup, restoreFromSql } from '../utils/backup'

export default function SettingsScreen() {
  const [status, setStatus] = useState<string>('')

  const doExport = async () => {
    try {
      setStatus('Membuat file laporan...')
      const r = await exportDailyReport()
      setStatus(r === 'shared' ? '✅ Laporan dibuat — pilih aplikasi tujuan (WA/Email)' : '❌ Share sheet tidak tersedia')
    } catch (e) {
      setStatus('⚠️ Gagal: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const doBackup = async () => {
    try {
      setStatus('Membuat backup database...')
      const r = await createBackup()
      setStatus(r === 'shared' ? '✅ Backup dibuat — simpan ke Google Drive/WA sendiri' : '❌ Share tidak tersedia')
    } catch (e) {
      setStatus('⚠️ Gagal backup: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const doRestore = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker')
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true })
      if (res.canceled) return
      const FileSystem = await import('expo-file-system')
      const content = await FileSystem.readAsStringAsync(res.assets[0].uri)
      setStatus('Memulihkan data...')
      // Small delay so UI updates before the sync DB work blocks
      setTimeout(() => {
        const r = restoreFromSql(content)
        setStatus(r.ok ? '✅ ' + r.message : '⚠️ ' + r.message)
      }, 50)
    } catch (e) {
      setStatus('⚠️ Gagal restore: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 32 }}>
      <Text style={styles.section}>Data & Backup</Text>

      <Surface style={styles.card} elevation={0}>
        <List.Item
          title="Export Laporan Hari Ini"
          description="File Excel/CSV — kirim ke WA atau email"
          left={(props) => <List.Icon {...props} icon="file-excel" color={colors.green} />}
          onPress={doExport}
        />
        <List.Item
          title="Backup Semua Data"
          description="Simpan file backup — lakukan mingguan!"
          left={(props) => <List.Icon {...props} icon="database-export" color={colors.blue} />}
          onPress={doBackup}
        />
        <List.Item
          title="Pulihkan dari Backup"
          description="Pilih file .sql backup sebelumnya. Data saat ini akan ditimpa!"
          left={(props) => <List.Icon {...props} icon="database-import" color="#F5A623" />}
          onPress={doRestore}
        />
      </Surface>

      {status ? (
        <Surface style={styles.statusBox} elevation={0}>
          <Text style={styles.statusText}>{status}</Text>
        </Surface>
      ) : null}

      <Text style={styles.section}>Tentang</Text>
      <Surface style={styles.card} elevation={0}>
        <List.Item title="POS UMKM v1.1" description="Kasir offline untuk warung & kedai" />
        <List.Item title="100% Offline" description="Data tersimpan di HP Anda, tanpa server" />
        <List.Item title="Butuh bantuan?" description="Hubungi penjual melalui kontak saat pembelian" />
      </Surface>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  section: { fontSize: 15, fontWeight: '800', color: colors.text, margin: 14, marginBottom: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  statusBox: { margin: 14, backgroundColor: colors.chipBg, borderRadius: 10, padding: 12 },
  statusText: { color: colors.greenDark, fontSize: 13, fontWeight: '600' },
})

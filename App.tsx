import React, { useEffect, useState } from 'react'
import { View, Text as RNText } from 'react-native'
import { PaperProvider, Appbar, SegmentedButtons } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

import { initDatabase, seedDemoData } from './src/db/database'
import { theme } from './src/theme/theme'
import { getDeviceId, formatDeviceCode, isActivated, activate } from './src/license/license'
import ActivationGate from './src/screens/ActivationGate'
import CashierScreen from './src/screens/CashierScreen'
import HistoryScreen from './src/screens/HistoryScreen'

type Tab = 'kasir' | 'riwayat'

export default function App() {
  const [ready, setReady] = useState(false)
  const [activated, setActivated] = useState(false)
  const [deviceCode, setDeviceCode] = useState('')
  const [tab, setTab] = useState<Tab>('kasir')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    initDatabase()
    seedDemoData()
    setDeviceCode(formatDeviceCode(getDeviceId()))
    setActivated(isActivated())
    setReady(true)
  }, [])

  if (!ready) return null

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {!activated ? (
          <ActivationGate
            deviceCode={deviceCode}
            onActivate={(key) => {
              const ok = activate(key)
              if (ok) setActivated(true)
              return ok
            }}
          />
        ) : (
          <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
            <Appbar.Header elevated={false} style={{ backgroundColor: '#FFFFFF' }}>
              <Appbar.Content
                title={tab === 'kasir' ? 'POS UMKM — Kasir' : 'Laporan & Riwayat'}
                titleStyle={{ fontWeight: '800', color: '#1C1B1F', fontSize: 19 }}
              />
            </Appbar.Header>

            <View style={{ flex: 1 }}>
              {tab === 'kasir' ? (
                <CashierScreen onSold={() => setRefreshKey((k) => k + 1)} />
              ) : (
                <HistoryScreen key={refreshKey} />
              )}
            </View>

            <View style={{ paddingHorizontal: 14, paddingBottom: 10, backgroundColor: '#F5F5F5' }}>
              <SegmentedButtons
                value={tab}
                onValueChange={(v) => setTab(v as Tab)}
                buttons={[
                  { value: 'kasir', label: '🧾 Kasir', showSelectedCheck: false },
                  { value: 'riwayat', label: '📊 Laporan', showSelectedCheck: false },
                ]}
                style={{ backgroundColor: '#FFFFFF' }}
              />
            </View>
          </View>
        )}
      </SafeAreaProvider>
    </PaperProvider>
  )
}

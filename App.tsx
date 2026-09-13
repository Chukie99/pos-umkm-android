import React, { useEffect, useState } from 'react'
import { View, Text, Image, ActivityIndicator, BackHandler, Alert } from 'react-native'
import { PaperProvider, Appbar } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as Font from 'expo-font'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import * as SplashScreen from 'expo-splash-screen'
import { initDatabase, seedDemoData } from './src/db/database'
import { theme, colors, applyTheme } from './src/theme/theme'
import { getTheme, getSetting, setSetting, type ThemePref } from './src/utils/settings'
import { getDeviceId, formatDeviceCode, isActivated, verifyToken } from './src/license/license'
import ActivationGate from './src/screens/ActivationGate'
import CashierScreen from './src/screens/CashierScreen'
import HistoryScreen from './src/screens/HistoryScreen'
import ManageProductsScreen from './src/screens/ManageProductsScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import KasbonScreen from './src/screens/KasbonScreen'
import ShiftScreen from './src/screens/ShiftScreen'
import SupplierScreen from './src/screens/SupplierScreen'
import FloatingBottomBar from './src/components/FloatingBottomBar'
import ErrorBoundary from './src/components/ErrorBoundary'

type Tab = 'kasir' | 'produk' | 'riwayat' | 'kasbon' | 'supplier' | 'shift' | 'pengaturan'

export default function App() {
  const [ready, setReady] = useState(false)
  const [initErr, setInitErr] = useState<string|null>(null)
  const [activated, setActivated] = useState(false)
  const [deviceCode, setDeviceCode] = useState('')
  const [tab, setTab] = useState<Tab>('kasir')
  const [refreshKey, setRefreshKey] = useState(0)
  const [dark, setDark] = useState(false)
  const [themeTick, setThemeTick] = useState(0)
  const [produkModalOpen, setProdukModalOpen] = useState(false)

  useEffect(() => {
    // catch JS crash biar ErrorBoundary kepanggil, jangan silent close
    const prev = (globalThis as any).ErrorUtils?.getGlobalHandler?.()
    try { (globalThis as any).ErrorUtils?.setGlobalHandler?.((e:any, fatal:any)=>{ console.error('GLOBAL', e); if(prev) prev(e,fatal); throw e; })} catch{}
    SplashScreen.preventAutoHideAsync().catch(() => {})
    ;(async () => {
      try {
        try { await Font.loadAsync(MaterialCommunityIcons.font) } catch {}
        initDatabase()
        seedDemoData()
        setDeviceCode(formatDeviceCode(getDeviceId()))
        setActivated(isActivated())
        const pref: ThemePref = getTheme()
        applyTheme(pref)
        setDark(pref === 'dark')
      } catch(e:any) { setInitErr(e?.message||String(e)+'\n'+(e?.stack||'')); }
      finally { setReady(true) }
    })()
  }, [])

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (produkModalOpen) {
        setProdukModalOpen(false)
        return true
      }
      if (tab !== 'kasir') {
        setTab('kasir')
        return true
      }
      Alert.alert('Keluar aplikasi?', 'Yakin mau keluar dari Kasir Kita?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: () => BackHandler.exitApp() },
      ])
      return true
    })
    return () => sub.remove()
  }, [tab, produkModalOpen])

  const toggleTheme = () => {
    const next: ThemePref = dark ? 'light' : 'dark'
    setSetting('theme', next)
    applyTheme(next)
    setDark(!dark)
    setThemeTick((t) => t + 1)
  }

  if (initErr) {
    return (
      <View style={{flex:1,backgroundColor:'#0F2440',padding:16,paddingTop:40}}><Text style={{color:'#FFF',fontSize:16,fontWeight:'900'}}>💥 Gagal init DB — screenshot ini</Text><View style={{backgroundColor:'#FFF',borderRadius:12,marginTop:14,padding:12}}><Text style={{fontFamily:'monospace',fontSize:10,color:'#B91C1C'}}>{initErr}</Text></View><Text style={{color:'#7895B2',fontSize:10,marginTop:8}}>Kirim WA ke dev — v1.1.4 DEBUG</Text></View>
    )
  }
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F2440', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{ width: 120, height: 120, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }}>
          <Image source={require('./assets/splash-icon.png')} style={{ width: 96, height: 96, borderRadius: 18 }} resizeMode="contain" />
        </View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1.5, textAlign: 'center' }}>Kasir Kita</Text>
        <Text style={{ color: '#AEBDCA', fontSize: 12, marginTop: 6, letterSpacing: 2, textAlign: 'center' }}>KASIR OFFLINE UMKM</Text>
        <View style={{ marginTop: 28, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#7895B2" />
          <Text style={{ color: '#7895B2', fontSize: 11, marginTop: 10, letterSpacing: 0.5 }}>Memuat kasir...</Text>
        </View>
      </View>
    )
  }

  return (
    <ErrorBoundary>
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style={dark ? 'light' : 'dark'} />
        {!activated ? (
          <ActivationGate
            deviceCode={deviceCode}
            onActivate={(token) => {
              const v = verifyToken(token)
              if (v.ok) setActivated(true)
              return v.ok
            }}
          />
        ) : (
          <View key={themeTick} style={{ flex: 1, backgroundColor: colors.bg }}>
            <Appbar.Header elevated={false} style={{ backgroundColor: colors.surface }}>
              <Appbar.Content
                title={
                  tab === 'kasir' ? `${getSetting('storeName', 'Kasir Kita')} — Kasir`
                  : tab === 'produk' ? 'Kelola Produk & Menu'
                  : tab === 'kasbon' ? 'Kasbon Pelanggan'
                  : tab === 'supplier' ? 'Supplier & Laba Rugi'
                  : tab === 'shift' ? 'Shift & Tutup Kasir'
                  : tab === 'pengaturan' ? 'Pengaturan & Backup'
                  : 'Laporan & Riwayat'
                }
                titleStyle={{ fontWeight: '800', color: colors.text, fontSize: 19 }}
              />
            </Appbar.Header>

            <View style={{ flex: 1, backgroundColor: colors.bg }}>
              {tab === 'kasir' && <CashierScreen onSold={() => setRefreshKey((k) => k + 1)} />}
              {tab === 'produk' && <ManageProductsScreen key={refreshKey} onModalChange={setProdukModalOpen} />}
              {tab === 'riwayat' && <HistoryScreen key={refreshKey} />}
              {tab === 'kasbon' && <KasbonScreen key={refreshKey} onChanged={() => setRefreshKey(k => k+1)} />}
              {tab === 'supplier' && <SupplierScreen key={refreshKey} />}
              {tab === 'shift' && <ShiftScreen key={refreshKey} />}
              {tab === 'pengaturan' && (
                <SettingsScreen
                  dark={dark}
                  onToggleTheme={toggleTheme}
                />
              )}
            </View>

            <FloatingBottomBar active={tab} onChange={setTab} hidden={produkModalOpen} />
          </View>
        )}
      </SafeAreaProvider>
    </PaperProvider>
    </ErrorBoundary>
  )
}

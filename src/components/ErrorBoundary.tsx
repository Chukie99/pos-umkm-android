import React from 'react'
import { View, ScrollView, Pressable, Share as RNShare } from 'react-native'
import { Text, Button } from 'react-native-paper'
import { colors } from '../theme/theme'

type Props = { children: React.ReactNode }
type State = { err: Error | null; stack: string }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { err: null, stack: '' }

  static getDerivedStateFromError(err: Error): State {
    return { err, stack: err?.stack || '' }
  }

  componentDidCatch(err: Error, info: any) {
    console.error('CRASH', err, info?.componentStack)
  }

  render() {
    if (this.state.err) {
      const msg = this.state.err.message || String(this.state.err)
      const stack = this.state.stack || ''
      const full = `KASIR KITA CRASH\n\n${msg}\n\n${stack}`.slice(0, 6000)
      return (
        <View style={{ flex: 1, backgroundColor: '#0F2440', padding: 16, paddingTop: 40 }}>
          <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900' }}>💥 Kasir Kita Crash — Screenshot ini</Text>
          <Text style={{ color: '#7895B2', fontSize: 11, marginTop: 6 }}>Kirim screenshot ini ke dev biar langsung ketauan biangnya. Tidak perlu PC / Log Viewer.</Text>
          <View style={{ backgroundColor: '#FFF', borderRadius: 12, marginTop: 14, flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 12 }}>
              <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#B91C1C', fontWeight: '800' }}>{msg}</Text>
              <Text style={{ fontFamily: 'monospace', fontSize: 9, color: '#374151', marginTop: 10 }}>{stack || '(no stack)'}</Text>
            </ScrollView>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Button mode="contained" icon="share-variant" onPress={() => RNShare.share({ message: full })} style={{ flex: 1 }} buttonColor="#7895B2">Share / WA</Button>
            <Button mode="outlined" icon="content-copy" onPress={() => RNShare.share({ message: full })} style={{ flex: 1 }} textColor="#FFF">Copy</Button>
          </View>
          <Text style={{ color: '#64748B', fontSize: 10, textAlign: 'center', marginTop: 8 }}>v1.1.4 DEBUG — reinstall v1.1.1 kalau mau jualan dulu</Text>
        </View>
      )
    }
    return this.props.children as any
  }
}

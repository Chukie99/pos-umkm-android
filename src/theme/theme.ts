import React from 'react'
import { MD3LightTheme, configureFonts } from 'react-native-paper'

/**
 * Palet brand POS UMKM:
 *   teal   #249D8F — aksi utama / brand
 *   kuning #E9C46A — aksen, highlight, badge
 *   terracotta #E76F51 — error / warning / harga
 *   krem   #FDF0D5 — latar lembut, chip
 *
 * Primary teal dipakai ketat untuk tombol utama (Bayar/Checkout)
 * supaya jempol selalu mendarat di tombol yang benar.
 */

// Font: pakai system default untuk konsistensi tiap platform.
// Di Android → 'sans-serif', iOS → '.SF Pro Text'. Tanpa hal ini,
// tema gelap malah terlihat suram karena fallback font tipis.
const fontConfig = {
  default: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    light: { fontFamily: 'System', fontWeight: '300' },
    thin: { fontFamily: 'System', fontWeight: '200' },
  },
}

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: '#FBF6EC',
    surface: '#FFFFFF',
    surfaceVariant: '#FDF0D5',
    primary: '#249D8F',
    onPrimary: '#FFFFFF',
    primaryContainer: '#CDEAE6',
    onPrimaryContainer: '#0E4A43',
    secondary: '#2A2721',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#FDF0D5',
    onSecondaryContainer: '#2A2721',
    tertiary: '#B3571F',
    error: '#C74A28',
    onError: '#FFFFFF',
    errorContainer: '#FBE0D8',
    onErrorContainer: '#5C1A08',
    outline: '#8A8578',
    outlineVariant: '#EADFC8',
  },
  fonts: configureFonts({ config: fontConfig }),
}

function palette(mode: 'light' | 'dark') {
  const base = {
    teal: '#249D8F',
    yellow: '#E9C46A',
    terracotta: '#E76F51',
    cream: '#FDF0D5',
  }
  if (mode === 'dark') {
    return {
      bg: '#0E1E1C',
      text: '#F0EBDF',
      textMuted: '#A8B5B0',
      green: base.teal,       // teal utama tetap konsisten
      greenDark: '#7BD9CE',
      blue: '#E8845F',
      yellow: base.yellow,
      terra: base.terracotta,
      cream: '#1D2C29',
      chipBg: '#1D2C29',
      badgeBg: '#3A2F14',
      badgeText: base.yellow,
      border: '#2A3B37',
      error: base.terracotta,
    }
  }
  return {
    bg: '#FBF6EC',
    text: '#2A2721',
    textMuted: '#6E6A5E',
    green: base.teal,
    greenDark: '#17766B',
    blue: base.blue,
    yellow: base.yellow,
    terra: base.terracotta,
    cream: base.cream,
    chipBg: '#FFF8F0',
    badgeBg: '#FBEFD2',
    badgeText: '#9A5312',
    border: '#EADFC8',
    error: '#C74A28',
  }
}

export let colors = palette('light')

export function applyTheme(mode: 'light' | 'dark') {
  colors = palette(mode)
}


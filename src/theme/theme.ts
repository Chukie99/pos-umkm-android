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
  fonts: configureFonts({ config: { fontFamily: 'Roboto' } }),
}

export const colors = {
  bg: '#FBF6EC',          // latar hangat (turunan krem)
  text: '#2A2721',
  textMuted: '#6E6A5E',
  green: '#249D8F',       // teal brand (nama variabel dipertahankan agar diff kecil)
  greenDark: '#17766B',
  blue: '#B3571F',        // aksen terracotta gelap untuk info/link
  yellow: '#E9C46A',
  terra: '#E76F51',
  cream: '#FDF0D5',
  chipBg: '#FDF0D5',
  badgeBg: '#FBEFD2',
  badgeText: '#9A5312',
  border: '#EADFC8',
  error: '#C74A28',
}

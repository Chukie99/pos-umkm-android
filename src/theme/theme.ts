import React from 'react'
import { MD3LightTheme, configureFonts } from 'react-native-paper'

/**
 * High-contrast Material Design 3 theme.
 * Deliberately flat: no neon gradients, no heavy shadows.
 * Primary green #2E7D32 is reserved strictly for primary actions
 * (Bayar / Checkout) so the thumb always lands on the right button.
 */
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceVariant: '#EDEBE9',
    primary: '#2E7D32',
    onPrimary: '#FFFFFF',
    primaryContainer: '#C8E6C9',
    onPrimaryContainer: '#0B3D0E',
    secondary: '#1C1B1F',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E0E0E0',
    onSecondaryContainer: '#1C1B1F',
    tertiary: '#1565C0',
    error: '#B3261E',
    onError: '#FFFFFF',
    errorContainer: '#F9DEDC',
    onErrorContainer: '#410E0B',
    outline: '#79747E',
    outlineVariant: '#DEDEDE',
  },
  fonts: configureFonts({ config: { fontFamily: 'Roboto' } }),
}

export const colors = {
  bg: '#F5F5F5',
  text: '#1C1B1F',
  textMuted: '#5F5E58',
  green: '#2E7D32',
  greenDark: '#1B5E20',
  blue: '#1565C0',
  chipBg: '#E8F5E9',
  badgeBg: '#FFF3E0',
  badgeText: '#BF360C',
  border: '#DEDEDE',
  error: '#B3261E',
}

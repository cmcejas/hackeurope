/**
 * Dark background with warm amber/gold accent — PollenCast.
 */
export const colors = {
  bg: '#1C1C1E',
  background: 'transparent',
  surface: 'rgba(255, 255, 255, 0.06)',
  surfaceSubtle: 'rgba(255, 255, 255, 0.04)',
  surfaceElevated: 'rgba(255, 255, 255, 0.09)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderLight: 'rgba(255, 255, 255, 0.06)',

  text: '#F5F0E8',
  textSecondary: '#A89F91',
  textTertiary: '#6B6359',

  primary: '#F5A623',
  primaryHover: '#E69517',
  primaryMuted: 'rgba(245, 166, 35, 0.14)',
  secondary: '#1C1C1E',
  accentStripe: '#FFCC02',

  success: '#5CB85C',
  successMuted: 'rgba(92, 184, 92, 0.14)',
  warning: '#F5A623',
  danger: '#E74C3C',
  dangerMuted: 'rgba(231, 76, 60, 0.14)',

  onPrimary: '#1C1C1E',
  onSecondary: '#F5F0E8',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  safeTop: 56,
} as const;

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 9999,
} as const;

/** Max content width on desktop/tablet. */
export const contentMaxWidth = 480;

export function getSeverityColor(probability: number): string {
  if (probability < 30) return colors.success;
  if (probability < 60) return colors.warning;
  return colors.danger;
}

/** Space Grotesk font family (load in root layout). */
export const fonts = {
  regular: 'SpaceGrotesk_400Regular',
  medium: 'SpaceGrotesk_500Medium',
  semibold: 'SpaceGrotesk_600SemiBold',
  bold: 'SpaceGrotesk_700Bold',
} as const;

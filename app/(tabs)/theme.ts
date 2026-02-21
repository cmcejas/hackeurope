/**
 * Dark #1a1a1a background with teal accent.
 */
export const colors = {
  background: 'transparent',
  surface: 'rgba(255, 255, 255, 0.06)',
  surfaceSubtle: 'rgba(255, 255, 255, 0.04)',
  surfaceElevated: 'rgba(255, 255, 255, 0.09)',
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.06)',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',

  primary: '#14B8A6',
  primaryHover: '#0D9488',
  secondary: '#1a1a1a',
  accentStripe: '#2DD4BF',

  success: '#10B981',
  warning: '#EAB308',
  danger: '#F43F5E',
  dangerMuted: 'rgba(244, 63, 94, 0.14)',

  onPrimary: '#FFFFFF',
  onSecondary: '#FFFFFF',
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

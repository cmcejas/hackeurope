/**
 * Modern health-app design system — light, warm, editorial.
 */
export const colors = {
  background: '#F8F7F5',
  surface: '#FFFFFF',
  surfaceSubtle: '#F2F1EF',
  surfaceElevated: '#FFFFFF',
  border: '#EBE9E6',
  borderLight: '#F0EEEC',

  text: '#1A1A1A',
  textSecondary: '#5C5C5C',
  textTertiary: '#8E8E93',

  primary: '#0D9488',
  primaryHover: '#0F766E',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  dangerMuted: 'rgba(220, 38, 38, 0.08)',

  onPrimary: '#FFFFFF',
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

/** Max content width on desktop/tablet so layout doesn't stretch. */
export const contentMaxWidth = 480;

export function getSeverityColor(probability: number): string {
  if (probability < 30) return colors.success;
  if (probability < 60) return colors.warning;
  return colors.danger;
}

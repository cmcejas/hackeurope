/**
 * Apple-inspired design tokens — dark mode, system blue accent.
 */
export const colors = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  surfaceSecondary: '#38383A',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  border: 'rgba(255,255,255,0.08)',

  primary: '#0A84FF',
  primaryDark: '#0066CC',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  teal: '#64D2FF',
  indigo: '#5E5CE6',

  onPrimary: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  safeTop: 60,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 9999,
} as const;

export function getSeverityColor(probability: number): string {
  if (probability < 30) return colors.success;
  if (probability < 60) return colors.warning;
  return colors.danger;
}

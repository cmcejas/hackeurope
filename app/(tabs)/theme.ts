/**
 * Shared design tokens for the Health Check tab.
 */
export const colors = {
  background: '#f5f5f5',
  surface: '#fff',
  text: '#333',
  textMuted: '#666',
  border: '#eee',

  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  neutral: '#999',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 30,
  topPadding: 40,
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
} as const;

/** Severity thresholds (probability %) for low / medium / high. */
export function getSeverityColor(probability: number): string {
  if (probability < 30) return colors.success;
  if (probability < 60) return colors.warning;
  return colors.danger;
}

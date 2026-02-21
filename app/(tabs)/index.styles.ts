import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from './theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.topPadding,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textMuted,
  },
  resultBox: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  probabilityText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  severityText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  infoBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  symptomText: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  permissionFailed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: borderRadius.sm,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonStart: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  buttonCapture: {
    backgroundColor: colors.success,
  },
  buttonRecord: {
    backgroundColor: colors.primary,
  },
  buttonStop: {
    backgroundColor: colors.danger,
  },
  buttonCancel: {
    backgroundColor: colors.neutral,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  recordingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  instructionText: {
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  sentenceBox: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    maxWidth: '100%',
  },
  sentenceText: {
    fontSize: 20,
    color: colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  analyzingText: {
    fontSize: 18,
    marginTop: spacing.md,
    color: colors.text,
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
});

import { Platform, StyleSheet } from 'react-native';
import { colors, spacing, radii } from './theme';

const softShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      }
    : { elevation: 4 };

export const styles = StyleSheet.create({
  /* ── Layout ── */
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: spacing.safeTop,
    paddingBottom: spacing.xxl + 20,
  },

  /* ── Menu ── */
  heroSection: {
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.37,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  featureGrid: {
    gap: 12,
    marginBottom: spacing.lg,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...softShadow,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCardContent: {
    flex: 1,
  },
  featureCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  featureCardDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 19,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...softShadow,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.onPrimary,
    letterSpacing: -0.4,
  },

  /* ── Step header ── */
  stepHeader: {
    paddingTop: spacing.safeTop,
    paddingHorizontal: 20,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.36,
  },

  /* ── Step indicator (dots) ── */
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceSecondary,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 24,
    borderRadius: 4,
  },

  /* ── Camera ── */
  camera: {
    flex: 1,
    width: '100%',
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginHorizontal: 20,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.xl,
  },
  captureRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  captureInnerDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  permissionFailed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionFailedText: {
    fontWeight: '400',
    color: colors.textSecondary,
    fontSize: 17,
  },

  /* ── Bottom bar (camera / recording) ── */
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 12,
    backgroundColor: colors.background,
  },
  pillButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillPrimary: {
    backgroundColor: colors.primary,
  },
  pillDanger: {
    backgroundColor: colors.danger,
  },
  pillSecondary: {
    backgroundColor: colors.surfaceElevated,
  },
  pillDisabled: {
    opacity: 0.4,
  },
  pillText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  pillTextOnColor: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.onPrimary,
  },

  /* ── Recording ── */
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  micCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...softShadow,
  },
  micCircleActive: {
    backgroundColor: 'rgba(255,69,58,0.15)',
  },
  micIcon: {
    fontSize: 48,
  },
  recordingLabel: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  recordingHint: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 21,
  },
  sentenceCard: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: radii.lg,
    width: '100%',
    maxWidth: 360,
    ...softShadow,
  },
  sentenceQuote: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sentenceText: {
    fontSize: 19,
    fontWeight: '500',
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 28,
  },

  /* ── Analyzing ── */
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  analyzingText: {
    fontSize: 17,
    fontWeight: '500',
    marginTop: spacing.lg,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 21,
  },

  /* ── Results ── */
  resultRingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resultRingOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 10,
    borderColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  resultPercentage: {
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -2,
  },
  resultPercentSign: {
    fontSize: 24,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  resultSeverityPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  resultSeverityText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 20,
    marginBottom: 12,
    ...softShadow,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  resultCardIcon: {
    fontSize: 20,
  },
  resultCardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  resultCardBody: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 22,
  },
  symptomChip: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    marginRight: 8,
    marginBottom: 8,
  },
  symptomChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  doctorBanner: {
    backgroundColor: 'rgba(255,69,58,0.12)',
    borderRadius: radii.lg,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorBannerIcon: {
    fontSize: 28,
  },
  doctorBannerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
    lineHeight: 21,
  },
});

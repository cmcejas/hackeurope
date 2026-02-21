import { Platform, StyleSheet } from 'react-native';
import { colors, spacing, radii, contentMaxWidth } from './theme';

const cardShadow =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      }
    : { elevation: 2 };

export const styles = StyleSheet.create({
  /* ── Layout ── */
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  contentWrap: {
    flex: 1,
    width: '100%',
    maxWidth: contentMaxWidth,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: spacing.safeTop,
    paddingBottom: spacing.xxl + 24,
  },

  /* ── Menu ── */
  heroSection: {
    marginBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 22,
    maxWidth: 320,
  },
  featureGrid: {
    gap: 12,
    marginBottom: spacing.xl,
  },
  /* ── Swipeable onboarding tiles ── */
  tileCarouselWrap: {
    marginBottom: spacing.lg,
    marginHorizontal: -20,
  },
  tileCarousel: {},
  tileCarouselContent: {
    flexGrow: 0,
  },
  tileCard: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  tileCardInner: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
    alignItems: 'center',
  },
  tileIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tileIconEmoji: {
    fontSize: 28,
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tileDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tilePagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  tileDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  tileDotActive: {
    backgroundColor: colors.primary,
    width: 18,
  },
  /* ── Allergy history input ── */
  allergySection: {
    marginBottom: spacing.xl,
  },
  allergyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  allergyHint: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  allergyInput: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 88,
    ...cardShadow,
  },
  allergyCharCount: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCardContent: {
    flex: 1,
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  featureCardDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...cardShadow,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onPrimary,
    letterSpacing: -0.2,
  },

  /* ── Step header ── */
  stepHeader: {
    paddingTop: spacing.safeTop,
    paddingHorizontal: 20,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },

  /* ── Step indicator ── */
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    width: 18,
    borderRadius: 3,
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
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surface,
  },
  captureInnerDisabled: {
    backgroundColor: colors.border,
  },

  permissionFailed: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionFailedText: {
    fontWeight: '400',
    color: colors.textSecondary,
    fontSize: 15,
  },

  /* ── Bottom bar ── */
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + 16,
    backgroundColor: colors.background,
  },
  pillButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  pillTextOnColor: {
    fontSize: 15,
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
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  micCircleActive: {
    backgroundColor: colors.dangerMuted,
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  micIcon: {
    fontSize: 40,
  },
  recordingLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  recordingHint: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  sentenceCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: radii.lg,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  sentenceQuote: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sentenceText: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 26,
  },

  /* ── Analyzing ── */
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  analyzingText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: spacing.lg,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },

  /* ── Results ── */
  resultRingContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resultRingOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resultPercentage: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  resultPercentSign: {
    fontSize: 20,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  resultSeveritySubtext: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 24,
    color: colors.textSecondary,
  },
  resultSeverityPill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  resultSeverityText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  resultCardIcon: {
    fontSize: 18,
  },
  resultCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  resultCardBody: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 21,
  },
  symptomChip: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  symptomChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  doctorBanner: {
    backgroundColor: colors.dangerMuted,
    borderRadius: radii.lg,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  doctorBannerIcon: {
    fontSize: 24,
  },
  doctorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
    lineHeight: 20,
  },
});

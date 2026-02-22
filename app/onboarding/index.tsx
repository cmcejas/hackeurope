import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../(tabs)/GradientBackground';
import { GlassCard } from '../(tabs)/GlassCard';
import { colors, spacing, radii, fonts, contentMaxWidth } from '../(tabs)/theme';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <GradientBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to PollenCast</Text>
            <Text style={styles.subtitle}>Here's how it works</Text>
          </View>

          <GlassCard style={styles.card} innerStyle={styles.cardInner}>
            <View style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name="camera-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.stepTitle}>1. Eye photo</Text>
              <Text style={styles.stepBody}>
                Take a quick photo of your eyes with your phone. We look for redness, puffiness, or other signs that can help inform the assessment.
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name="mic-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.stepTitle}>2. Voice (optional)</Text>
              <Text style={styles.stepBody}>
                You can record a short voice sample. It helps us detect congestion or hoarseness that might be relevant.
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name="leaf-outline" size={24} color={colors.primary} />
              </View>
              <Text style={styles.stepTitle}>3. Location & pollen</Text>
              <Text style={styles.stepBody}>
                We use your location to include local pollen and environmental data in your assessment when available.
              </Text>
            </View>
            <View style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name="sparkles" size={24} color={colors.primary} />
              </View>
              <Text style={styles.stepTitle}>4. AI assessment</Text>
              <Text style={styles.stepBody}>
                Our AI combines the image, optional voice, and pollen data to give you a simple assessment and recommendations. It's meant to support, not replace, professional care.
              </Text>
            </View>
          </GlassCard>

          <TouchableOpacity
            style={styles.cta}
            onPress={() => router.push('/onboarding/questionnaire')}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: spacing.safeTop,
    paddingBottom: spacing.xxl + 24,
  },
  content: {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.xl,
  },
  cardInner: {
    padding: spacing.lg,
  },
  step: {
    marginBottom: spacing.lg,
  },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stepTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  stepBody: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radii.md,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.onPrimary,
  },
});

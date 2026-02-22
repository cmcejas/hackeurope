import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import type { OnboardingAnswers } from '../../hooks/useProfile';
import { GradientBackground } from '../(tabs)/GradientBackground';
import { GlassCard } from '../(tabs)/GlassCard';
import { colors, spacing, radii, fonts, contentMaxWidth } from '../(tabs)/theme';

type Answer = boolean | null;

function QuestionRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Answer;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={questionStyles.row}>
      <Text style={questionStyles.label}>{label}</Text>
      <View style={questionStyles.buttons}>
        <TouchableOpacity
          style={[
            questionStyles.btn,
            value === true && questionStyles.btnSelected,
          ]}
          onPress={() => onChange(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              questionStyles.btnText,
              value === true && questionStyles.btnTextSelected,
            ]}
          >
            Yes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            questionStyles.btn,
            value === false && questionStyles.btnSelected,
          ]}
          onPress={() => onChange(false)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              questionStyles.btnText,
              value === false && questionStyles.btnTextSelected,
            ]}
          >
            No
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const questionStyles = StyleSheet.create({
  row: { marginBottom: spacing.lg },
  label: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  buttons: { flexDirection: 'row', gap: 12 },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnSelected: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  btnText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  btnTextSelected: {
    color: colors.text,
  },
});

export default function OnboardingQuestionnaireScreen() {
  const { user } = useAuth();
  const { completeOnboarding } = useProfile(user?.id);
  const router = useRouter();
  const [hadAllergies, setHadAllergies] = useState<Answer>(null);
  const [respiratoryIssues, setRespiratoryIssues] = useState<Answer>(null);
  const [immunocompromised, setImmunocompromised] = useState<Answer>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allAnswered =
    hadAllergies !== null &&
    respiratoryIssues !== null &&
    immunocompromised !== null;
  const canSubmit = allAnswered && disclaimerAccepted;

  const handleGetStarted = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const answers: OnboardingAnswers = {
      hadAllergies: hadAllergies!,
      respiratoryIssues: respiratoryIssues!,
      immunocompromised: immunocompromised!,
    };
    await completeOnboarding(answers);
    setSubmitting(false);
    router.replace('/(tabs)');
  };

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
            <Text style={styles.title}>A few quick questions</Text>
            <Text style={styles.subtitle}>
              This helps us personalize your experience.
            </Text>
          </View>

          <GlassCard style={styles.card} innerStyle={styles.cardInner}>
            <QuestionRow
              label="Have you had allergies before?"
              value={hadAllergies}
              onChange={setHadAllergies}
            />
            <QuestionRow
              label="Do you have any respiratory issues?"
              value={respiratoryIssues}
              onChange={setRespiratoryIssues}
            />
            <QuestionRow
              label="Are you immunocompromised?"
              value={immunocompromised}
              onChange={setImmunocompromised}
            />
          </GlassCard>

          <GlassCard style={styles.disclaimerCard} innerStyle={styles.disclaimerInner}>
            <View style={styles.disclaimerHeader}>
              <Ionicons name="warning-outline" size={22} color={colors.warning} />
              <Text style={styles.disclaimerTitle}>Important disclaimer</Text>
            </View>
            <Text style={styles.disclaimerBody}>
              PollenCast is for <Text style={styles.disclaimerBold}>informational use only</Text>. It does not provide medical advice, diagnosis, or treatment. Always exercise caution and use your best judgment. If you have health concerns, worsening symptoms, or need a diagnosis, please consult a qualified healthcare provider.
            </Text>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setDisclaimerAccepted((a) => !a)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, disclaimerAccepted && styles.checkboxChecked]}>
                {disclaimerAccepted ? (
                  <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
                ) : null}
              </View>
              <Text style={styles.checkboxLabel}>
                I understand this is not medical advice and I will use caution.
              </Text>
            </TouchableOpacity>
          </GlassCard>

          <TouchableOpacity
            style={[styles.cta, (submitting || !canSubmit) && styles.ctaDisabled]}
            onPress={handleGetStarted}
            disabled={submitting || !canSubmit}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.ctaText}>Get started</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
              </>
            )}
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
    marginBottom: spacing.lg,
  },
  cardInner: {
    padding: spacing.lg,
  },
  disclaimerCard: {
    marginBottom: spacing.xl,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  disclaimerInner: {
    padding: spacing.lg,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  disclaimerBody: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  disclaimerBold: {
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    lineHeight: 20,
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
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.onPrimary,
  },
});

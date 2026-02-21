import React from 'react';
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
import { GradientBackground } from './GradientBackground';
import { GlassCard } from './GlassCard';
import { colors, spacing, radii, fonts, contentMaxWidth } from './theme';

export default function ProfileScreen() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <GradientBackground />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  const fullName = user?.user_metadata?.full_name as string | undefined;
  const email = user?.email ?? '';

  return (
    <View style={styles.container}>
      <GradientBackground />
      <View style={styles.contentWrap}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.heroSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.subtitle}>Your PollenCast account</Text>
          </View>

          <GlassCard style={styles.card} innerStyle={styles.cardInner}>
            <View style={styles.row}>
              <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <Text style={styles.label}>Name</Text>
                <Text style={styles.value}>{fullName || 'Not set'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.rowIcon} />
              <View style={styles.rowContent}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{email || '—'}</Text>
              </View>
            </View>
          </GlassCard>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: 6,
  },
  backText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 166, 35, 0.2)',
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  card: {
    marginBottom: spacing.lg,
  },
  cardInner: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: spacing.md,
  },
  rowContent: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    backgroundColor: colors.dangerMuted,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.danger,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { GradientBackground } from '../(tabs)/GradientBackground';
import { GlassCard } from '../(tabs)/GlassCard';
import { colors, spacing, radii, fonts, contentMaxWidth } from '../(tabs)/theme';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      Alert.alert(
        'Success!',
        'Account created successfully. Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join HackEurope to track your health</Text>
            </View>

            {/* Sign Up Form */}
            <GlassCard style={styles.formCard}>
              {/* Full Name Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor={colors.textTertiary}
                    value={fullName}
                    onChangeText={setFullName}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.textTertiary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Create Account</Text>
                    <Ionicons name="checkmark-circle" size={20} color={colors.onPrimary} />
                  </>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                  <Text style={styles.link}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: {
    maxWidth: contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  formCard: {
    padding: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  eyeIcon: {
    padding: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 52,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.onPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  link: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
});

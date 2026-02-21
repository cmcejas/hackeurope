import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { radii, colors } from './theme';

type GlassCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
};

/**
 * Frosted glass card.
 * Native: uses expo-blur for a real backdrop blur.
 * Web: uses a semi-transparent background (avoids blurry text on mobile browsers).
 */
export function GlassCard({ children, style, innerStyle }: GlassCardProps) {
  return (
    <View style={[styles.outer, style]}>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.webFill]} />
      ) : (
        <BlurView intensity={36} tint="dark" style={StyleSheet.absoluteFill} />
      )}
      <View style={[styles.inner, innerStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inner: {
    padding: 18,
    borderRadius: radii.lg,
  },
  webFill: {
    backgroundColor: 'rgba(30, 30, 32, 0.92)',
  },
});

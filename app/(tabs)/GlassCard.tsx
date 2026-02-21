import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { radii, colors } from './theme';

type GlassCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
};

/**
 * Frosted glass card: blur layer + soft border, rounded corners.
 */
export function GlassCard({ children, style, innerStyle }: GlassCardProps) {
  return (
    <View style={[styles.outer, style]}>
      <BlurView
        intensity={36}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />
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
});

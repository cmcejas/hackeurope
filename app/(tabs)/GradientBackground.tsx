import React from 'react';
import { View, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
  },
});

/**
 * Solid #1a1a1a background. Renders as a layer behind content.
 */
export function GradientBackground() {
  return <View style={styles.fill} />;
}

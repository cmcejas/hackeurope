import React from 'react';
import { View, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1C1C1E',
  },
});

export function GradientBackground() {
  return <View style={styles.fill} />;
}

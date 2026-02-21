import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing, borderRadius, shadow } from '../theme';
import { useTheme } from '../context/ThemeContext';

export function Card({ children, style, padded = true, elevated = true }: any) {
  const { colors } = useTheme();
  return (
    <View style={[styles.base, elevated && shadow.md, padded && styles.padded, { backgroundColor: colors.backgroundCard }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  padded: { padding: spacing.base },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, fontWeight } from '../theme';

export function PlaceholderScreen({ route }: any) {
  const name = route?.params?.name ?? route?.name ?? 'Screen';
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>{name}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
});

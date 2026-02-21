import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fontSize, fontWeight, spacing, borderRadius } from '../theme';
import { useTheme } from '../context/ThemeContext';

export const ExpenseItem = memo(function ExpenseItem({ title, amount, date, category, currency = 'USD' }: any) {
  const { colors } = useTheme();
  const sym = currency === 'INR' || currency === '₹' ? '₹' : currency === 'USD' ? '$' : currency;
  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundCard }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surface }]}><Text style={[styles.iconText, { color: colors.primary }]}>{category?.[0] ?? '?'}</Text></View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.date, { color: colors.textMuted }]}>{date}</Text>
      </View>
      <Text style={[styles.amount, { color: colors.expense }]}>-{sym}{Math.abs(amount).toLocaleString()}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.base, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  iconText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  content: { flex: 1 },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
  date: { fontSize: fontSize.xs, marginTop: 2 },
  amount: { fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
});

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpenseItem } from '../components';
import { colors, fontSize, fontWeight, spacing } from '../theme';

const MOCK_EXPENSES = [
  { id: '1', title: 'Lunch at cafe', amount: 250, date: 'Today', category: 'Food' },
  { id: '2', title: 'Uber ride', amount: 180, date: 'Yesterday', category: 'Transport' },
  { id: '3', title: 'Netflix', amount: 649, date: 'Feb 18', category: 'Entertainment' },
  { id: '4', title: 'Groceries', amount: 1200, date: 'Feb 17', category: 'Shopping' },
  { id: '5', title: 'Electricity bill', amount: 850, date: 'Feb 15', category: 'Bills' },
];

export function ExpenseListScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <Text style={styles.subtitle}>This month</Text>
      </View>
      <FlatList
        data={MOCK_EXPENSES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ExpenseItem
            title={item.title}
            amount={item.amount}
            date={item.date}
            category={item.category}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.base,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.base,
    paddingTop: 0,
  },
});

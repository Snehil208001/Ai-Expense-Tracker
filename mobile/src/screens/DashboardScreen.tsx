import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, AITipCard, ExpenseItem, Button } from '../components';
import { colors, fontSize, fontWeight, spacing } from '../theme';

export function DashboardScreen({ navigation }: any) {
  const greeting = getGreeting();
  const totalBalance = 45230;
  const income = 75000;
  const expense = 29770;
  const budgetUsed = 59; // %

  const recentExpenses = [
    { id: '1', title: 'Lunch at cafe', amount: 250, date: 'Today', category: 'Food' },
    { id: '2', title: 'Uber ride', amount: 180, date: 'Yesterday', category: 'Transport' },
    { id: '3', title: 'Netflix', amount: 649, date: 'Feb 18', category: 'Entertainment' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>Alex</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.avatarText}>A</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>₹{totalBalance.toLocaleString()}</Text>
        </Card>

        {/* Income vs Expense */}
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, styles.incomeCard]}>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statAmount, { color: colors.income }]}>
              +₹{income.toLocaleString()}
            </Text>
          </Card>
          <Card style={[styles.statCard, styles.expenseCard]}>
            <Text style={styles.statLabel}>Expense</Text>
            <Text style={[styles.statAmount, { color: colors.expense }]}>
              -₹{expense.toLocaleString()}
            </Text>
          </Card>
        </View>

        {/* Budget Progress */}
        <Card>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>Monthly Budget</Text>
            <Text style={styles.budgetValue}>{budgetUsed}% used</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${budgetUsed}%` }]} />
          </View>
        </Card>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Expenses</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ExpenseList')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentExpenses.map((e) => (
            <ExpenseItem
              key={e.id}
              title={e.title}
              amount={e.amount}
              date={e.date}
              category={e.category}
            />
          ))}
        </View>

        {/* AI Tip Card - Differentiator */}
        <AITipCard
          title="AI Insight"
          message="You're spending 23% more on dining this month. Consider meal prepping to save ~₹2,500."
          icon="💡"
        />

        <View style={styles.fabSpace} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense')}
        activeOpacity={0.9}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.sm,
  },
  iconText: {
    fontSize: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontWeight: fontWeight.semiBold,
    fontSize: fontSize.base,
  },
  balanceCard: {
    marginBottom: spacing.base,
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  statCard: {
    flex: 1,
  },
  incomeCard: {},
  expenseCard: {},
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  statAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  budgetLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  budgetValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  seeAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  fabSpace: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#FFF',
    fontWeight: fontWeight.medium,
    lineHeight: 32,
  },
});

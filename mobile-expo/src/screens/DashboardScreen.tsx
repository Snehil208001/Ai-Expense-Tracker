import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '../utils/responsive';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadow } from '../theme';
import { Card, AITipCard, ExpenseItem } from '../components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getExpenses, getExpenseSummary, getInsights } from '../api';
import type { Expense } from '../types/api';

function formatDate(d: string) {
  const date = new Date(d);
  const today = new Date();
  const diff = Math.floor((today.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardScreen({ navigation }: { navigation: any }) {
  const { padding } = useResponsive();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [expRes, summaryRes] = await Promise.all([
      getExpenses({ limit: 10 }),
      getExpenseSummary(),
    ]);
    if (expRes.data?.expenses) setExpenses(expRes.data.expenses);
    if (summaryRes.data) {
      setTotalSpent(summaryRes.data.totalSpent);
      setMonthlySpent(summaryRes.data.monthlySpent);
    }
  }, []);

  const loadInsights = useCallback(async () => {
    const insRes = await getInsights();
    if (insRes.data?.insights) setInsight(insRes.data.insights);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (!loading) loadInsights();
  }, [loading, loadInsights]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), loadInsights()]);
    setRefreshing(false);
  }, [load, loadInsights]);

  const currency = user?.currency || 'USD';
  const budget = user?.monthlyBudget ? Number(user.monthlyBudget) : null;
  const budgetUsed = budget ? Math.min(100, Math.round((monthlySpent / budget) * 100)) : 0;

  if (loading) {
    return (
      <View style={[styles.center, { paddingHorizontal: padding.horizontal, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingHorizontal: padding.horizontal }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name || user?.email?.split('@')[0] || 'User'}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.avatarText}>{(user?.name || user?.email || 'U')[0].toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <Card>
        <View style={styles.summaryRow}>
          <View style={styles.summaryBlock}>
            <Text style={styles.balanceLabel}>Total Spent</Text>
            <Text style={styles.balanceAmount}>
              {currency} {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryBlock}>
            <Text style={styles.balanceLabel}>This Month</Text>
            <Text style={styles.balanceAmount}>
              {currency} {monthlySpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </Card>

      {budget != null && (
        <Card>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>Monthly Budget</Text>
            <Text style={styles.budgetValue}>{budgetUsed}% used</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(budgetUsed, 100)}%` }]} />
          </View>
        </Card>
      )}

      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ExpenseList')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {expenses.length === 0 ? (
          <Text style={styles.empty}>No expenses yet. Add one!</Text>
        ) : (
          expenses.map((e) => (
            <ExpenseItem
              key={e.id}
              title={e.description || 'Expense'}
              amount={Number(e.amount)}
              date={formatDate(e.date)}
              category={undefined}
              currency={currency}
            />
          ))
        )}
      </View>

      {insight && (
        <AITipCard title="AI Insight" message={insight} icon="💡" />
      )}

      <View style={styles.fabArea} />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.base, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  greeting: { fontSize: fontSize.sm, color: colors.textSecondary },
  userName: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: fontWeight.semiBold, fontSize: fontSize.base },
  summaryRow: { flexDirection: 'row', gap: spacing.lg },
  summaryBlock: { flex: 1 },
  balanceLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 4 },
  balanceAmount: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  budgetLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  budgetValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textPrimary },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.sm },
  section: { marginTop: spacing.xl },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semiBold, color: colors.textPrimary },
  seeAll: { fontSize: fontSize.sm, color: colors.primary },
  empty: { fontSize: fontSize.sm, color: colors.textMuted, paddingVertical: spacing.lg },
  fabArea: { height: 80 },
});

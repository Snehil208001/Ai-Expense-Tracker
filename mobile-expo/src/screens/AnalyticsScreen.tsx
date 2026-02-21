import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '../utils/responsive';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import { Card } from '../components';
import { getReport, getAnomalies, getExpenses, getCategories } from '../api';
import type { Anomaly } from '../types/api';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'];

function getMonthRange(month: number, year: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

export function AnalyticsScreen() {
  const { padding } = useResponsive();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [report, setReport] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [byCategory, setByCategory] = useState<{ name: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { from, to } = getMonthRange(selectedMonth, selectedYear);
    const [repRes, anomRes, expRes, catRes] = await Promise.all([
      getReport(selectedMonth, selectedYear),
      getAnomalies(selectedMonth, selectedYear),
      getExpenses({ from, to, limit: 100 }),
      getCategories('expense'),
    ]);
    if (repRes.error) setError(repRes.error);
    else if (repRes.data?.report) {
      setReport(repRes.data.report);
      setError(null);
    }
    if (anomRes.data?.anomalies) setAnomalies(anomRes.data.anomalies);
    else setAnomalies([]);
    if (expRes.data?.expenses && catRes.data?.categories) {
      const catMap = Object.fromEntries(catRes.data.categories.map((c) => [c.id, c.name]));
      const grouped: Record<string, number> = {};
      for (const e of expRes.data.expenses) {
        const name = e.categoryId ? (catMap[e.categoryId] ?? 'Other') : 'Uncategorized';
        grouped[name] = (grouped[name] ?? 0) + Number(e.amount);
      }
      setByCategory(
        Object.entries(grouped)
          .map(([name, amount]) => ({ name, amount }))
          .sort((a, b) => b.amount - a.amount)
      );
    } else {
      setByCategory([]);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const goPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };
  const goNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { paddingHorizontal: padding.horizontal }]} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: padding.horizontal }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={goPrevMonth} style={styles.monthBtn}>
            <Text style={styles.monthBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[selectedMonth]} {selectedYear}</Text>
          <TouchableOpacity
            onPress={goNextMonth}
            style={styles.monthBtn}
            disabled={selectedMonth === now.getMonth() && selectedYear === now.getFullYear()}
          >
            <Text style={[styles.monthBtnText, (selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) && styles.monthBtnDisabled]}>→</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Monthly Report</Text>

        {byCategory.length > 0 && (() => {
          const categoryTotal = byCategory.reduce((s, x) => s + x.amount, 0);
          return (
            <>
              <Text style={styles.sectionTitle}>Spending by Category</Text>
              <Card style={styles.chartCard}>
                {byCategory.map((item, i) => {
                  const pct = categoryTotal > 0 ? (item.amount / categoryTotal) * 100 : 0;
                  return (
                    <View key={item.name} style={styles.barRow}>
                      <Text style={styles.barLabel} numberOfLines={1}>{item.name}</Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
                      </View>
                      <Text style={styles.barValue}>{item.amount.toFixed(0)}</Text>
                    </View>
                  );
                })}
              </Card>
            </>
          );
        })()}

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <Card>
            <Text style={styles.reportText}>{report || 'No data for this month.'}</Text>
          </Card>
        )}

        {anomalies.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Spending Alerts</Text>
            {anomalies.map((a, i) => (
              <Card key={i} style={styles.alertCard}>
                <Text style={styles.alertText}>{typeof a === 'string' ? a : a.message}</Text>
                {typeof a === 'object' && a.severity && (
                  <Text style={[styles.severityBadge, a.severity === 'high' && styles.severityHigh]}>
                    {a.severity}
                  </Text>
                )}
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.base },
  monthBtn: { padding: spacing.sm, paddingHorizontal: spacing.base },
  monthBtnText: { fontSize: fontSize.xl, color: colors.primary, fontWeight: fontWeight.bold },
  monthBtnDisabled: { color: colors.textMuted, opacity: 0.5 },
  monthLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.semiBold, color: colors.textPrimary },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary, marginBottom: spacing.base },
  reportText: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 22 },
  errorCard: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  errorText: { fontSize: fontSize.sm, color: colors.danger, marginBottom: spacing.sm },
  retryBtn: { alignSelf: 'flex-start', paddingVertical: spacing.sm, paddingHorizontal: spacing.base },
  retryText: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semiBold },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semiBold, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.base },
  chartCard: { marginBottom: spacing.base },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
  barLabel: { width: 80, fontSize: fontSize.sm, color: colors.textSecondary },
  barTrack: { flex: 1, height: 20, backgroundColor: colors.surface, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { width: 50, fontSize: fontSize.sm, color: colors.textPrimary, textAlign: 'right' },
  alertCard: { borderLeftWidth: 4, borderLeftColor: colors.danger },
  alertText: { fontSize: fontSize.sm, color: colors.textSecondary },
  severityBadge: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 4 },
  severityHigh: { color: colors.danger },
});

import React, { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useResponsive } from '../utils/responsive';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import { ExpenseItem, EmptyState } from '../components';
import { useAuth } from '../context/AuthContext';
import { getExpenses, deleteExpense } from '../api';
import type { Expense } from '../types/api';

function formatDate(d: string) {
  const date = new Date(d);
  const today = new Date();
  const diff = Math.floor((today.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ExpenseListScreen({ navigation }: { navigation: any }) {
  const { padding } = useResponsive();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    const res = await getExpenses({ page: p, limit: 20 });
    if (res.data?.expenses) {
      setExpenses((prev) => (append ? [...prev, ...res.data!.expenses] : res.data!.expenses));
    }
    if (res.data?.pagination) {
      setTotal(res.data.pagination.total);
    }
    setPage(p);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(1);
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(1);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (loadingMore || loading || expenses.length >= total) return;
    load(page + 1, true);
  };

  const handleEdit = useCallback((item: Expense) => {
    navigation.navigate('EditExpense', {
      expenseId: item.id,
      amount: Number(item.amount),
      description: item.description,
      date: item.date.slice(0, 10),
      categoryId: item.categoryId,
    });
  }, [navigation]);

  const handleDelete = useCallback((item: Expense) => {
    Alert.alert('Delete expense', `Delete "${item.description || 'this expense'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await deleteExpense(item.id);
        if (error) Alert.alert('Error', error);
        else setExpenses((prev) => prev.filter((e) => e.id !== item.id));
      }},
    ]);
  }, []);

  const currency = user?.currency || 'USD';

  const renderItem = useCallback(({ item }: { item: Expense }) => (
    <TouchableOpacity
      onPress={() => handleEdit(item)}
      onLongPress={() => {
        Alert.alert('Expense', 'Edit or delete?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Edit', onPress: () => handleEdit(item) },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(item) },
        ]);
      }}
    >
      <ExpenseItem
        title={item.description || 'Expense'}
        amount={Number(item.amount)}
        date={formatDate(item.date)}
        currency={currency}
      />
    </TouchableOpacity>
  ), [handleEdit, handleDelete, currency]);

  const listHeader = useMemo(() => (
    <View style={styles.header}>
      <Text style={styles.title}>All Expenses</Text>
      <Text style={styles.subtitle}>{total} total</Text>
    </View>
  ), [total]);

  const listEmpty = useMemo(() => (
    <EmptyState icon="📋" title="No expenses yet" message="Add one from the dashboard or scan a receipt!" />
  ), []);

  if (loading && expenses.length === 0) {
    return (
      <View style={[styles.center, { paddingHorizontal: padding.horizontal }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={expenses}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { paddingHorizontal: padding.horizontal }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
      renderItem={renderItem}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.base, paddingBottom: 100 },
  header: { marginBottom: spacing.xl },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  footer: { padding: spacing.lg, alignItems: 'center' },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useResponsive } from '../utils/responsive';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useAuth } from '../context/AuthContext';
import { updateExpense, getCategories } from '../api';
import type { Category } from '../types/api';

export function EditExpenseScreen({ route, navigation }: any) {
  const { padding } = useResponsive();
  const { user } = useAuth();
  const params = route?.params ?? {};
  const { expenseId = '', amount = 0, description = '', date = '', categoryId } = params;
  const [amountVal, setAmountVal] = useState(String(amount));
  const [descVal, setDescVal] = useState(description || '');
  const [dateVal, setDateVal] = useState((date || '').slice(0, 10));
  const [categoryIdVal, setCategoryIdVal] = useState<string | null>(categoryId || null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCategories('expense').then((r) => {
      if (r.data?.categories) setCategories(r.data.categories);
    });
  }, []);

  const handleSave = async () => {
    const amt = parseFloat(amountVal.replace(/,/g, ''));
    if (!amountVal || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setLoading(true);
    const { error } = await updateExpense(expenseId, {
      amount: amt,
      description: descVal.trim() || null,
      date: dateVal,
      categoryId: categoryIdVal,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { deleteExpense } = await import('../api');
        const { error } = await deleteExpense(expenseId);
        if (error) Alert.alert('Error', error);
        else navigation.goBack();
      }},
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingHorizontal: padding.horizontal }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.field}>
        <Text style={styles.label}>Amount ({user?.currency || 'USD'})</Text>
        <TextInput
          style={styles.input}
          value={amountVal}
          onChangeText={setAmountVal}
          keyboardType="decimal-pad"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={descVal}
          onChangeText={setDescVal}
          placeholder="What was this for?"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={dateVal}
          onChangeText={setDateVal}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
        />
      </View>
      {categories.length > 0 && (
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, categoryIdVal === c.id && styles.chipActive]}
                onPress={() => setCategoryIdVal(categoryIdVal === c.id ? null : c.id)}
              >
                <Text style={[styles.chipText, categoryIdVal === c.id && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Save</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete expense</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  field: { marginBottom: spacing.xl },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: 999, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: fontSize.sm, color: colors.textPrimary },
  chipTextActive: { color: '#FFF' },
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.base, alignItems: 'center', marginTop: spacing.lg },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#FFF', fontWeight: fontWeight.semiBold },
  deleteBtn: { marginTop: spacing.lg, padding: spacing.base, alignItems: 'center' },
  deleteText: { color: colors.danger, fontSize: fontSize.sm },
});

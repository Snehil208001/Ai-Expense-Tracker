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
  Platform,
} from 'react-native';
import { useResponsive } from '../utils/responsive';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useAuth } from '../context/AuthContext';
import { createExpense, getCategories, expenseFromText } from '../api';
import type { Category } from '../types/api';

export function AddExpenseScreen({ navigation }: { navigation: any }) {
  const { padding } = useResponsive();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCats, setLoadingCats] = useState(true);
  const [quickText, setQuickText] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  const handleQuickAdd = async () => {
    const text = quickText.trim();
    if (!text) return;
    setQuickLoading(true);
    const { data, error } = await expenseFromText(text, true);
    setQuickLoading(false);
    if (error) {
      Alert.alert('Could not parse', error + '\n\nTry: "$50 lunch" or "100 for groceries yesterday"');
      return;
    }
    if (data?.expense) {
      Alert.alert('Added!', `Expense of ${user?.currency || 'USD'} ${data.parsed?.amount ?? data.expense?.amount} added.`, [
        { text: 'OK', onPress: () => { setQuickText(''); navigation.goBack(); } },
      ]);
    }
  };

  useEffect(() => {
    getCategories('expense').then((r) => {
      if (r.data?.categories) setCategories(r.data.categories);
      setLoadingCats(false);
    });
  }, []);

  const handleSubmit = async () => {
    const amt = parseFloat(amount.replace(/,/g, ''));
    if (!amount || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    setLoading(true);
    const date = new Date().toISOString().slice(0, 10);
    const { error } = await createExpense({
      amount: amt,
      currency: user?.currency || 'USD',
      categoryId: categoryId || undefined,
      description: description.trim() || undefined,
      date,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    navigation.goBack();
  };

  const currency = user?.currency || 'USD';
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingHorizontal: padding.horizontal }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Add Expense</Text>
      <View style={styles.quickAdd}>
        <Text style={styles.quickLabel}>Quick add (e.g. "$50 lunch" or "100 groceries yesterday")</Text>
        <View style={styles.quickRow}>
          <TextInput
            style={[styles.input, styles.quickInput]}
            placeholder="Type expense in plain English..."
            placeholderTextColor={colors.textMuted}
            value={quickText}
            onChangeText={setQuickText}
          />
          <TouchableOpacity
            style={[styles.quickBtn, (!quickText.trim() || quickLoading) && styles.btnDisabled]}
            onPress={handleQuickAdd}
            disabled={!quickText.trim() || quickLoading}
          >
            {quickLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.quickBtnText}>Add</Text>}
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.divider}>— or add manually —</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Amount ({currency})</Text>
        <TextInput
          style={styles.input}
          placeholder={`0.00`}
          placeholderTextColor={colors.textMuted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="What was this for?"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      {!loadingCats && categories.length > 0 && (
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.categoryChip, categoryId === c.id && styles.categoryChipActive]}
                onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    categoryId === c.id && styles.categoryChipTextActive,
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Add Expense</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xl },
  quickAdd: { marginBottom: spacing.xl },
  quickLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickInput: { flex: 1 },
  quickBtn: { backgroundColor: colors.accent, paddingHorizontal: spacing.lg, justifyContent: 'center', borderRadius: borderRadius.md },
  quickBtnText: { color: '#FFF', fontWeight: fontWeight.semiBold },
  divider: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
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
  categoryChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  categoryChipActive: { backgroundColor: colors.primary },
  categoryChipText: { fontSize: fontSize.sm, color: colors.textPrimary },
  categoryChipTextActive: { color: '#FFF' },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.7 },
  btnDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFF', fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
});

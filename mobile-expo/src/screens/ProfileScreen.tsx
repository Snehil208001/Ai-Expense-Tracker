import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useResponsive } from '../utils/responsive';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { Card } from '../components';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateProfile } from '../api';

export function ProfileScreen({ navigation }: { navigation: any }) {
  const { padding } = useResponsive();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme, colors: themeColors } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [monthlyBudget, setMonthlyBudget] = useState(
    user?.monthlyBudget != null ? String(user.monthlyBudget) : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const budget = monthlyBudget ? parseFloat(monthlyBudget) : null;
    const { error } = await updateProfile({
      name: name.trim() || undefined,
      monthlyBudget: isNaN(budget as number) ? null : budget,
    });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else Alert.alert('Saved', 'Profile updated.');
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: themeColors.background }}
      contentContainerStyle={[styles.scroll, { paddingHorizontal: padding.horizontal }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || user?.email || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Card>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={[styles.label, { marginTop: spacing.base }]}>Monthly Budget ({user?.currency || 'USD'})</Text>
        <TextInput
          style={styles.input}
          value={monthlyBudget}
          onChangeText={setMonthlyBudget}
          placeholder="Optional"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </Card>

      <Card>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark mode</Text>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFF" />
        </View>
      </Card>

      <TouchableOpacity style={[styles.linkBtn, { backgroundColor: themeColors.backgroundCard }]} onPress={() => navigation.navigate('Categories')}>
        <Text style={[styles.linkText, { color: themeColors.textPrimary }]}>Manage Categories</Text>
        <Text style={[styles.linkArrow, { color: themeColors.textMuted }]}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.linkBtn, { backgroundColor: themeColors.backgroundCard }]} onPress={() => navigation.navigate('AIChat')}>
        <Text style={[styles.linkText, { color: themeColors.textPrimary }]}>AI Assistant</Text>
        <Text style={[styles.linkArrow, { color: themeColors.textMuted }]}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: fontSize['2xl'], fontWeight: fontWeight.bold },
  email: { marginTop: spacing.sm, fontSize: fontSize.sm, color: colors.textSecondary },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  btnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontWeight: fontWeight.semiBold },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: fontSize.base, color: colors.textPrimary },
  linkBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.md, marginTop: spacing.base },
  linkText: { fontSize: fontSize.base, color: colors.textPrimary },
  linkArrow: { fontSize: fontSize.base, color: colors.textMuted },
  logoutBtn: {
    marginTop: spacing.xl,
    padding: spacing.base,
    alignItems: 'center',
  },
  logoutText: { color: colors.danger, fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '../utils/responsive';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import { getCategories, createCategory, deleteCategory } from '../api';
import type { Category } from '../types/api';

export function CategoriesScreen({ navigation }: { navigation: any }) {
  const { padding } = useResponsive();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await getCategories();
    if (res.data?.categories) setCategories(res.data.categories);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    const { error } = await createCategory({ name, type: 'expense' });
    setSaving(false);
    if (error) Alert.alert('Error', error);
    else {
      setNewName('');
      setModalVisible(false);
      load();
    }
  };

  const removeCategory = (cat: Category) => {
    Alert.alert('Delete category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await deleteCategory(cat.id);
        if (error) Alert.alert('Error', error);
        else load();
      }},
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.header, { paddingHorizontal: padding.horizontal }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingHorizontal: padding.horizontal }]}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.colorDot, item.color && { backgroundColor: item.color }]} />
            <Text style={styles.catName}>{item.name}</Text>
            {!item.isSystem && (
              <TouchableOpacity onPress={() => removeCategory(item)}>
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New category</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Category name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.btnDisabled]} onPress={addCategory} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Add</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { fontSize: fontSize.base, color: colors.primary },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.semiBold, color: colors.textPrimary },
  addBtn: { padding: spacing.sm },
  addBtnText: { fontSize: fontSize.base, color: colors.primary, fontWeight: fontWeight.semiBold },
  list: { padding: spacing.base },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, backgroundColor: colors.backgroundCard, borderRadius: 12, marginBottom: spacing.sm },
  colorDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary, marginRight: spacing.sm },
  catName: { flex: 1, fontSize: fontSize.base, color: colors.textPrimary },
  deleteText: { fontSize: fontSize.sm, color: colors.danger },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
  modal: { backgroundColor: colors.backgroundCard, borderRadius: 16, padding: spacing.xl },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semiBold, color: colors.textPrimary, marginBottom: spacing.base },
  input: { backgroundColor: colors.background, borderRadius: 8, padding: spacing.base, fontSize: fontSize.base, color: colors.textPrimary, marginBottom: spacing.xl },
  modalActions: { flexDirection: 'row', gap: spacing.base, justifyContent: 'flex-end' },
  cancelBtn: { padding: spacing.base },
  cancelText: { color: colors.textSecondary },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.base, borderRadius: 8 },
  btnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontWeight: fontWeight.semiBold },
});

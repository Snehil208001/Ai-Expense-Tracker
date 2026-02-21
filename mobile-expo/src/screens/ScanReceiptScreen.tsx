import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useResponsive } from '../utils/responsive';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { Card } from '../components';
import { parseReceiptFromImage, receiptToExpense } from '../api';

export function ScanReceiptScreen({ navigation }: { navigation: any }) {
  const { padding } = useResponsive();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow access to your photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: false,
      });
      if (!result.canceled && result.assets[0]) {
        try {
          const resized = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 800 } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
          );
          setImageUri(resized.uri);
        } catch {
          setImageUri(result.assets[0].uri);
        }
        setParsed(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to open gallery';
      Alert.alert('Error', msg);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow camera access.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
        base64: false,
      });
      if (!result.canceled && result.assets[0]) {
        try {
          const resized = await ImageManipulator.manipulateAsync(
            result.assets[0].uri,
            [{ resize: { width: 800 } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
          );
          setImageUri(resized.uri);
        } catch {
          setImageUri(result.assets[0].uri);
        }
        setParsed(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to open camera';
      Alert.alert('Error', msg);
    }
  };

  const parseReceipt = async () => {
    if (!imageUri) return;
    setLoading(true);
    try {
      const { data, error } = await parseReceiptFromImage(imageUri);
      if (error) {
        Alert.alert('Parse failed', error);
        return;
      }
      if (data) setParsed(data as Record<string, unknown>);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Scan failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const [editAmount, setEditAmount] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');

  React.useEffect(() => {
    if (parsed) {
      setEditAmount(String(parsed.amount ?? ''));
      setEditDesc(String(parsed.merchant ?? parsed.description ?? ''));
      setEditDate(String(parsed.date ?? new Date().toISOString().slice(0, 10)));
    }
  }, [parsed]);

  const saveAsExpense = async () => {
    if (!parsed) return;
    const amt = parseFloat(editAmount);
    if (!editAmount || isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    const receiptData = { ...parsed, amount: amt, description: editDesc.trim() || parsed.merchant || parsed.description, date: editDate || new Date().toISOString().slice(0, 10), currency: parsed.currency || 'USD' };
    setSaving(true);
    try {
      const { error } = await receiptToExpense(receiptData, undefined, true);
      if (error) {
        Alert.alert('Error', error);
        return;
      }
      Alert.alert('Saved', 'Expense added from receipt.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingHorizontal: padding.horizontal }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Scan Receipt</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={styles.actionText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Card style={styles.previewCard}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
          {!parsed ? (
            <TouchableOpacity
              style={[styles.parseBtn, loading && styles.btnDisabled]}
              onPress={parseReceipt}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.parseBtnText}>Scan with AI</Text>
              )}
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.editFields}>
                <Text style={styles.editLabel}>Amount ({typeof parsed.currency === 'string' ? parsed.currency : 'USD'})</Text>
                <TextInput style={styles.editInput} value={editAmount} onChangeText={setEditAmount} keyboardType="decimal-pad" />
                <Text style={styles.editLabel}>Description</Text>
                <TextInput style={styles.editInput} value={editDesc} onChangeText={setEditDesc} placeholder="Merchant or description" placeholderTextColor={colors.textMuted} />
                <Text style={styles.editLabel}>Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.editInput} value={editDate} onChangeText={setEditDate} placeholder="2025-02-21" placeholderTextColor={colors.textMuted} />
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.btnDisabled]}
                onPress={saveAsExpense}
                disabled={saving}
              >
                {saving && <ActivityIndicator color="#FFF" />}
                {!saving && <Text style={styles.saveBtnText}>Add as Expense</Text>}
              </TouchableOpacity>
            </>
          )}
        </Card>
      )}

      {!imageUri && (
        <Card>
          <Text style={styles.hint}>Take a photo or choose from gallery to scan a receipt with AI.</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xl },
  actions: { flexDirection: 'row', gap: spacing.base, marginBottom: spacing.xl },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  actionIcon: { fontSize: 32, marginBottom: spacing.sm },
  actionText: { color: '#FFF', fontSize: fontSize.base, fontWeight: fontWeight.semiBold },
  previewCard: { marginBottom: spacing.xl },
  preview: { width: '100%', height: 200, borderRadius: borderRadius.md, marginBottom: spacing.base },
  parseBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
  },
  parseBtnText: { color: '#FFF', fontWeight: fontWeight.semiBold },
  btnDisabled: { opacity: 0.7 },
  parsed: { marginVertical: spacing.base },
  parsedLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 4 },
  editFields: { marginVertical: spacing.base },
  editLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 4, marginTop: spacing.sm },
  editInput: { backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.base, fontSize: fontSize.base, color: colors.textPrimary, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { color: '#FFF', fontWeight: fontWeight.semiBold },
  hint: { fontSize: fontSize.sm, color: colors.textSecondary },
});

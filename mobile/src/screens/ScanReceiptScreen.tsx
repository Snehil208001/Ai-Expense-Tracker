import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '../components';
import { colors, fontSize, fontWeight, spacing } from '../theme';

type Step = 'camera' | 'processing' | 'result';

export function ScanReceiptScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('camera');

  const handleCapture = () => {
    setStep('processing');
    setTimeout(() => setStep('result'), 2500);
  };

  if (step === 'camera') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.cameraPlaceholder}>
          <View style={styles.guideFrame} />
          <Text style={styles.cameraHint}>Position receipt within frame</Text>
          <Text style={styles.aiBranding}>AI-powered scan</Text>
        </View>
        <View style={styles.captureBar}>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'processing') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.processingContainer}>
          <View style={styles.spinnerWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.processingTitle}>AI analyzing receipt</Text>
          <Text style={styles.processingSubtitle}>Extracting amount, date & merchant...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Receipt scanned</Text>
        <Card>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Amount</Text>
            <Text style={styles.resultValue}>₹ 250.00</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Merchant</Text>
            <Text style={styles.resultValue}>Cafe Coffee Day</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Date</Text>
            <Text style={styles.resultValue}>Feb 21, 2025</Text>
          </View>
        </Card>
        <Button
          title="Confirm & Add Expense"
          onPress={() => navigation.goBack()}
          fullWidth
          size="lg"
          style={styles.confirmButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideFrame: {
    width: 280,
    height: 360,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
  },
  cameraHint: {
    color: '#FFF',
    marginTop: spacing.lg,
    fontSize: fontSize.sm,
  },
  aiBranding: {
    color: colors.primaryLight,
    fontSize: fontSize.xs,
    marginTop: spacing.sm,
  },
  captureBar: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  spinnerWrap: {
    marginBottom: spacing.xl,
  },
  processingTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semiBold,
    color: '#FFF',
    marginBottom: spacing.sm,
  },
  processingSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.base,
  },
  resultTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  resultLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  resultValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
  },
  confirmButton: {
    marginTop: spacing.xl,
  },
});

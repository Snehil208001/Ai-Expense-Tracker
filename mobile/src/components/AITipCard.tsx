import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors, fontSize, fontWeight, spacing } from '../theme';

interface AITipCardProps {
  title: string;
  message: string;
  icon?: string;
}

export function AITipCard({ title, message, icon = '✨' }: AITipCardProps) {
  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.message}>{message}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semiBold,
    color: colors.textPrimary,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

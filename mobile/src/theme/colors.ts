/**
 * AI Expense Tracker - Design System Colors
 * Clean fintech + AI modern feel
 */

export const colors = {
  // Primary - Indigo / Deep blue (trust + fintech)
  primary: '#4F46E5',
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',

  // Accent - Emerald (positive money)
  accent: '#10B981',
  accentLight: '#34D399',
  accentDark: '#059669',

  // Danger - Soft red
  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerDark: '#DC2626',

  // Backgrounds
  background: '#F8FAFC',
  backgroundCard: '#FFFFFF',
  surface: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Income / Expense
  income: '#10B981',
  expense: '#EF4444',

  // AI branding
  aiHighlight: '#4F46E5',
  aiGradient: ['#4F46E5', '#7C3AED'],
} as const;

export type Colors = typeof colors;

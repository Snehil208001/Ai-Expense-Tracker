import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useResponsive } from '../utils/responsive';
import { colors, spacing, fontSize, fontWeight } from '../theme';
import { aiChat } from '../api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

export function AIChatScreen() {
  const { padding } = useResponsive();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const send = async () => {
    const q = query.trim();
    if (!q || loading) return;
    setQuery('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: q };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    const { data, error } = await aiChat(q);
    setLoading(false);
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: error || data?.answer || 'Could not get a response.',
    };
    setMessages((m) => [...m, assistantMsg]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>Ask about your spending</Text>
      </View>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingHorizontal: padding.horizontal }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>Ask questions like:</Text>
              <Text style={styles.hint}>"How much did I spend on food this month?"</Text>
              <Text style={styles.hint}>"What's my biggest expense category?"</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>
                {item.text}
              </Text>
            </View>
          )}
        />
        <View style={[styles.inputRow, { paddingHorizontal: padding.horizontal }]}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Ask about your expenses..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!query.trim() || loading) && styles.sendDisabled]}
            onPress={send}
            disabled={!query.trim() || loading}
          >
            {loading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.sendText}>Send</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { padding: spacing.base, paddingBottom: spacing.sm },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 2 },
  list: { flexGrow: 1, paddingBottom: spacing.base },
  empty: { paddingVertical: spacing['2xl'], alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: spacing.base },
  emptyText: { fontSize: fontSize.base, color: colors.textSecondary },
  hint: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm },
  bubble: { maxWidth: '85%', padding: spacing.base, borderRadius: 16, marginBottom: spacing.sm },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface },
  userText: { color: '#FFF', fontSize: fontSize.sm },
  assistantText: { color: colors.textPrimary, fontSize: fontSize.sm },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.base, paddingBottom: spacing.xl, gap: spacing.sm, backgroundColor: colors.backgroundCard, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: 20, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, fontSize: fontSize.base, color: colors.textPrimary, maxHeight: 100 },
  sendBtn: { backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: spacing.lg, paddingVertical: spacing.base, justifyContent: 'center' },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#FFF', fontWeight: fontWeight.semiBold },
});

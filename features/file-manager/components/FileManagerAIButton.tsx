import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { FileManagerEntry } from '../FileManagerTypes';
import { runLocalFileAI, type LocalFileAIAction } from '../FileManagerAIService';

const ACTIONS: ReadonlyArray<{ id: LocalFileAIAction; title: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: 'summarize', title: 'Summarize', icon: 'file-text' },
  { id: 'classify', title: 'Classify', icon: 'tag' },
  { id: 'extract-text', title: 'Extract text', icon: 'align-left' },
  { id: 'suggest-name', title: 'Suggest name', icon: 'edit-3' },
];

export function FileManagerAIButton({ entry }: { entry: FileManagerEntry }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<LocalFileAIAction | null>(null);
  const [result, setResult] = useState<{ title: string; body: string } | null>(null);

  const run = async (action: LocalFileAIAction) => {
    setBusy(action);
    try {
      const next = await runLocalFileAI(entry, action);
      setResult(next);
    } catch (error) {
      Alert.alert('Local AI failed', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Local AI tools for ${entry.name}`}
        onPress={() => { setResult(null); setOpen(true); }}
        style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Feather name="cpu" size={18} color={colors.primary} />
        <Text style={[styles.label, { color: colors.foreground }]}>Local AI</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} accessibilityViewIsModal>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close local AI" onPress={() => setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.handle} />
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Local AI</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Runs on the device boundary; this feature does not upload your file to a remote AI service.</Text>
            {!result ? (
              <View style={styles.grid}>
                {ACTIONS.map((action) => (
                  <Pressable key={action.id} accessibilityRole="button" accessibilityLabel={`${action.title} ${entry.name}`} onPress={() => void run(action.id)} disabled={busy !== null} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }, busy !== null && busy !== action.id && styles.disabled]}>
                    {busy === action.id ? <ActivityIndicator color={colors.primary} /> : <Feather name={action.icon} size={20} color={colors.primary} />}
                    <Text style={[styles.actionText, { color: colors.foreground }]}>{action.title}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={[styles.result, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.resultTitle, { color: colors.foreground }]}>{result.title}</Text>
                <Text selectable style={[styles.resultBody, { color: colors.foreground }]}>{result.body}</Text>
                <Pressable accessibilityRole="button" onPress={() => setResult(null)} style={[styles.back, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>Back to AI tools</Text></Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 42, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  label: { fontSize: 11, fontWeight: '700' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 16, paddingBottom: 28 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#888', marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 10.5, lineHeight: 16, marginTop: 4, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  action: { width: '48%', minHeight: 76, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontSize: 10.5, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  result: { borderRadius: 15, borderWidth: 1, padding: 13, gap: 9 },
  resultTitle: { fontSize: 13, fontWeight: '700' },
  resultBody: { fontSize: 11, lineHeight: 17 },
  back: { minHeight: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});

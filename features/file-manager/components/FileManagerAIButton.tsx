import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { FileManagerEntry } from '../FileManagerTypes';
import { ensureLocalFileModel, isLocalFileModelReady, FILE_MANAGER_MODEL_MANIFEST } from '../FileManagerLocalModel';
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
  const [modelReady, setModelReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [preparing, setPreparing] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    void isLocalFileModelReady().then((ready) => {
      if (active) setModelReady(ready);
    });
    return () => { active = false; };
  }, [open]);

  const openAI = async () => {
    setOpen(true);
    setResult(null);
    if (modelReady) return;
    setPreparing(true);
    setDownloadProgress(0);
    try {
      await ensureLocalFileModel((progress) => setDownloadProgress(progress));
      setModelReady(true);
    } catch (error) {
      Alert.alert('Local AI model', error instanceof Error ? error.message : String(error));
    } finally {
      setPreparing(false);
    }
  };

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
        onPress={() => void openAI()}
        style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Feather name="cpu" size={18} color={colors.primary} />
        <Text style={[styles.label, { color: colors.foreground }]}>Local AI</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)} accessibilityViewIsModal>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close local AI" onPress={() => !preparing && setOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.handle} />
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>File Manager Local AI</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>On-device analysis. Your file content is not uploaded to a remote AI service.</Text>

            {preparing ? (
              <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text accessibilityRole="text" style={[styles.loadingTitle, { color: colors.foreground }]}>Please wait</Text>
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Downloading the File Manager AI model for first use.</Text>
                <Text style={[styles.progressText, { color: colors.primary }]}>{Math.round(downloadProgress * 100)}%</Text>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}><View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.round(downloadProgress * 100)}%` }]} /></View>
                <Text style={[styles.sizeText, { color: colors.mutedForeground }]}>Model download: approximately {Math.round(FILE_MANAGER_MODEL_MANIFEST.sizeBytes / (1024 * 1024))} MB</Text>
              </View>
            ) : !modelReady ? (
              <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="download-cloud" size={28} color={colors.primary} />
                <Text style={[styles.loadingTitle, { color: colors.foreground }]}>AI model required</Text>
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>The model is downloaded only when you open File Manager AI for the first time.</Text>
                <Pressable accessibilityRole="button" onPress={() => void openAI()} style={[styles.primary, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>Download and continue</Text></Pressable>
              </View>
            ) : !result ? (
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
  loadingCard: { borderRadius: 15, borderWidth: 1, padding: 18, alignItems: 'center', gap: 9 },
  loadingTitle: { fontSize: 15, fontWeight: '700' },
  loadingText: { fontSize: 10.5, lineHeight: 16, textAlign: 'center' },
  progressText: { fontSize: 13, fontWeight: '800' },
  progressTrack: { width: '100%', height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 7, borderRadius: 4 },
  sizeText: { fontSize: 9.5 },
  primary: { minHeight: 44, borderRadius: 11, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
});

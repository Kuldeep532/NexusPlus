import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { normalizeAudio, type AudioNormalizationTarget } from '@/features/audio-editor/audioNormalizer';
import type { AudioEditorSource } from '@/features/audio-editor/types';

const TARGETS: Array<{ id: AudioNormalizationTarget; title: string; description: string }> = [
  { id: 0.7, title: 'Safe', description: 'Peak target around 70% for extra headroom.' },
  { id: 0.85, title: 'Balanced', description: 'Peak target around 85% for general-purpose audio.' },
  { id: 0.95, title: 'Loud', description: 'Peak target around 95% while retaining a small safety margin.' },
];

export default function AudioNormalizerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [target, setTarget] = useState<AudioNormalizationTarget>(0.85);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('Choose audio to normalize its peak level.');
  const [output, setOutput] = useState<{ path: string; uri: string } | null>(null);

  const choose = useCallback(async () => {
    if (working) return;
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setSource(picked);
    setOutput(null);
    setMessage(`${picked.name} selected. Choose a target level.`);
  }, [working]);

  const generate = useCallback(async () => {
    if (!source || working) return;
    setWorking(true);
    setOutput(null);
    setMessage('Analyzing peak level and generating a normalized copy…');
    try {
      const outputPath = await createAudioEditorOutputPath('Audio Normalizer', source.name, `peak-${Math.round(target * 100)}`, 'm4a');
      const result = await normalizeAudio(source.uri, outputPath, target);
      setOutput({ path: result.outputPath, uri: `file://${result.outputPath}` });
      setMessage('Normalized audio saved as a new copy.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to normalize the selected audio.');
    } finally {
      setWorking(false);
    }
  }, [source, target, working]);

  const reset = useCallback(() => {
    setSource(null);
    setOutput(null);
    setTarget(0.85);
    setMessage('Choose audio to normalize its peak level.');
  }, []);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 34 }}>
      <Stack.Screen options={{ title: 'Audio Normalizer' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="bar-chart-2" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Normalizer</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Measure the source peak and create a new copy at a controlled peak level.</Text>
        </View>
      </View>

      {output ? (
        <AudioEditorResultPanel message="Audio normalized and saved." outputPath={output.path} resultUri={output.uri} onClose={reset} />
      ) : (
        <>
          <Pressable onPress={choose} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: working ? 0.65 : 1 }]}>
            <Feather name="folder" size={19} color={colors.primaryForeground} />
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{source ? 'Choose Different Audio' : 'Choose Audio'}</Text>
          </Pressable>

          {source && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text accessibilityRole="header" style={[styles.source, { color: colors.foreground }]} numberOfLines={2}>{source.name}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>The original file is not modified.</Text>
              <View style={styles.targetList}>
                {TARGETS.map((item) => (
                  <Pressable key={item.id} onPress={() => setTarget(item.id)} accessibilityRole="button" accessibilityState={{ selected: target === item.id }} style={[styles.target, { borderColor: target === item.id ? colors.primary : colors.border, backgroundColor: target === item.id ? colors.secondary : colors.background }]}>
                    <View style={styles.targetCopy}>
                      <Text style={[styles.targetTitle, { color: colors.foreground }]}>{item.title} · {Math.round(item.id * 100)}%</Text>
                      <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.description}</Text>
                    </View>
                    {target === item.id && <Feather name="check-circle" size={19} color={colors.primary} />}
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={generate} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { marginTop: 4, backgroundColor: working ? colors.muted : colors.primary }]}>
                {working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="volume-2" size={19} color={colors.primaryForeground} />}
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{working ? 'Generating…' : 'Normalize Audio'}</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
      <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 14 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 11.5, lineHeight: 17 },
  primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 16 },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  source: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 10.5, lineHeight: 15 },
  targetList: { gap: 8 },
  target: { minHeight: 66, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  targetCopy: { flex: 1 },
  targetTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  message: { marginTop: 12, fontSize: 11, lineHeight: 16 },
});

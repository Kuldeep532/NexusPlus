import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { discoverLocalAudio, pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { AUDIO_COMPRESSION_PRESETS, compressAudio, type AudioCompressionPreset } from '@/features/audio-editor/audioCompressor';
import type { AudioEditorSource } from '@/features/audio-editor/types';

function formatBytes(value?: number): string {
  if (!Number.isFinite(value) || value === undefined) return 'Unknown';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AudioCompressorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [preset, setPreset] = useState<AudioCompressionPreset>(AUDIO_COMPRESSION_PRESETS[1]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ inputBytes?: number; outputBytes?: number } | null>(null);

  const loadSource = useCallback(async (next: AudioEditorSource) => {
    setSource(next);
    setResult(null);
    setMessage('Audio selected. Choose a compression preset.');
  }, []);

  const chooseFile = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (picked) await loadSource(picked);
  }, [loadSource]);

  const scanLocal = useCallback(async () => {
    setLoading(true);
    try {
      const discovered = await discoverLocalAudio('');
      if (!discovered.permissionGranted) setMessage('Music and audio permission is required to scan local audio.');
      else if (discovered.audio[0]) await loadSource(discovered.audio[0]);
      else setMessage('No local audio files found.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to scan local audio.');
    } finally {
      setLoading(false);
    }
  }, [loadSource]);

  const compress = useCallback(async () => {
    if (!source) return;
    setLoading(true);
    setMessage(`Compressing at ${preset.bitrate / 1000} kbps / ${preset.sampleRate / 1000} kHz…`);
    try {
      const outputPath = await createAudioEditorOutputPath('Compressed Audio', source.name, 'm4a');
      const compressed = await compressAudio({
        inputPath: source.uri,
        outputPath,
        bitrate: preset.bitrate,
        sampleRate: preset.sampleRate,
      });
      setResult({ inputBytes: compressed.inputBytes, outputBytes: compressed.outputBytes });
      setMessage(`Compression complete: ${compressed.outputPath}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to compress this audio file.');
    } finally {
      setLoading(false);
    }
  }, [preset, source]);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}>
      <Stack.Screen options={{ title: 'Audio Compressor' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="archive" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Compressor</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Reduce file size with bitrate and sample-rate presets.</Text>
        </View>
      </View>

      <View style={styles.rowButtons}>
        <Pressable onPress={chooseFile} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Feather name="folder" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose Audio</Text>
        </Pressable>
        <Pressable onPress={scanLocal} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.primary }]}>
          <Feather name="music" size={18} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Local Audio</Text>
        </Pressable>
      </View>

      {source && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={1}>{source.name}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Choose the desired file-size/quality trade-off.</Text>

          <View style={styles.presetList}>
            {AUDIO_COMPRESSION_PRESETS.map((item) => {
              const selected = item.id === preset.id;
              return (
                <Pressable key={item.id} onPress={() => setPreset(item)} accessibilityRole="button" accessibilityState={{ selected }} style={[styles.preset, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}>
                  <View style={styles.presetCopy}>
                    <Text style={[styles.presetTitle, { color: colors.foreground }]}>{item.title}</Text>
                    <Text style={[styles.presetDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                  </View>
                  <Text style={[styles.presetMeta, { color: colors.primary }]}>{item.bitrate / 1000} kbps • {item.sampleRate / 1000} kHz</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable disabled={loading} onPress={compress} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: loading ? 0.65 : 1 }]}>
            {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="archive" size={18} color={colors.primaryForeground} />}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{loading ? 'Compressing…' : 'Compress Audio'}</Text>
          </Pressable>

          {result && <Text style={[styles.result, { color: colors.mutedForeground }]}>Input: {formatBytes(result.inputBytes)} • Output: {formatBytes(result.outputBytes)}</Text>}
        </View>
      )}

      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
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
  rowButtons: { flexDirection: 'row', gap: 8 },
  primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 15, flex: 1 },
  secondaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 15, borderWidth: 1, flex: 1 },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  secondaryButtonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  sourceTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 11, lineHeight: 16 },
  presetList: { gap: 8 },
  preset: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  presetCopy: { flex: 1 },
  presetTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  presetDesc: { fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  presetMeta: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  result: { fontSize: 11 },
  message: { marginTop: 14, fontSize: 11, lineHeight: 16 },
});

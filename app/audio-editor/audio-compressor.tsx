import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { discoverLocalAudio, pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { AUDIO_COMPRESSION_PRESETS, compressAudio, type AudioCompressionPreset, type CompressAudioResult } from '@/features/audio-editor/audioCompressor';
import { assertAudioEditorNative, type AudioProbeResult } from '@/modules/audio-editor-native';
import type { AudioEditorSource } from '@/features/audio-editor/types';

function formatBytes(value?: number): string {
  if (!Number.isFinite(value) || value === undefined) return 'Unknown';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatTime(ms?: number): string {
  if (!Number.isFinite(ms) || ms === undefined) return 'Unknown';
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function AudioCompressorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [probe, setProbe] = useState<AudioProbeResult | null>(null);
  const [preset, setPreset] = useState<AudioCompressionPreset>(AUDIO_COMPRESSION_PRESETS[1]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<CompressAudioResult | null>(null);

  const loadSource = useCallback(async (next: AudioEditorSource) => {
    setLoading(true);
    setMessage('Reading audio metadata…');
    setResult(null);
    try {
      const metadata = await assertAudioEditorNative().probe(next.uri);
      setSource({ ...next, durationMs: metadata.durationMs });
      setProbe(metadata);
      setMessage('Audio selected. Choose a compression preset.');
    } catch (error) {
      setSource(null);
      setProbe(null);
      setMessage(error instanceof Error ? error.message : 'Unable to inspect this audio file.');
    } finally {
      setLoading(false);
    }
  }, []);

  const chooseFile = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (picked) await loadSource(picked);
  }, [loadSource]);

  const scanLocal = useCallback(async () => {
    setLoading(true);
    setMessage('Scanning local audio…');
    try {
      const discovered = await discoverLocalAudio('');
      if (!discovered.permissionGranted) {
        setMessage('Music and audio permission is required to scan local audio.');
      } else if (discovered.audio[0]) {
        await loadSource(discovered.audio[0]);
      } else {
        setMessage('No local audio files found.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to scan local audio.');
    } finally {
      setLoading(false);
    }
  }, [loadSource]);

  const expectedOutputBytes = useMemo(() => {
    const durationMs = probe?.durationMs ?? source?.durationMs ?? 0;
    if (!durationMs || !Number.isFinite(durationMs)) return null;
    return Math.max(1, Math.round((preset.bitrate * durationMs) / 8000));
  }, [preset.bitrate, probe?.durationMs, source?.durationMs]);

  const canCompress = Boolean(source && probe && probe.durationMs > 0 && !loading);

  const compress = useCallback(async () => {
    if (!source || !probe || probe.durationMs <= 0 || loading) return;
    setLoading(true);
    setResult(null);
    setMessage(`Compressing at ${preset.bitrate / 1000} kbps / ${preset.sampleRate / 1000} kHz…`);
    try {
      const outputPath = await createAudioEditorOutputPath('Compressed Audio', source.name, 'm4a');
      const compressed = await compressAudio({
        inputPath: source.uri,
        outputPath,
        bitrate: preset.bitrate,
        sampleRate: preset.sampleRate,
      });
      setResult(compressed);
      setMessage(`Compression complete. Output: ${compressed.outputPath}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to compress this audio file.');
    } finally {
      setLoading(false);
    }
  }, [loading, preset, probe, source]);

  const reduction = result?.inputBytes && result.outputBytes && result.inputBytes > 0
    ? Math.max(0, (1 - result.outputBytes / result.inputBytes) * 100)
    : null;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Audio Compressor' }} />

      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="archive" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Compressor</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Reduce file size with bitrate and sample-rate presets.</Text>
        </View>
      </View>

      <View style={styles.rowButtons}>
        <Pressable
          onPress={chooseFile}
          disabled={loading}
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
          style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: loading ? 0.65 : 1 }]}
        >
          <Feather name="folder" size={18} color={colors.primaryForeground} />
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose Audio</Text>
        </Pressable>
        <Pressable
          onPress={scanLocal}
          disabled={loading}
          accessibilityRole="button"
          accessibilityState={{ disabled: loading }}
          style={[styles.secondaryButton, { borderColor: colors.primary, opacity: loading ? 0.65 : 1 }]}
        >
          <Feather name="music" size={18} color={colors.primary} />
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Local Audio</Text>
        </Pressable>
      </View>

      {source && probe && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={1}>{source.name}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            Duration {formatTime(probe.durationMs)} • {probe.sampleRate || 'Unknown'} Hz • {probe.channels || 'Unknown'} channel(s)
          </Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Output format: AAC in M4A container.</Text>

          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Compression preset</Text>
          <View style={styles.presetList}>
            {AUDIO_COMPRESSION_PRESETS.map((item) => {
              const selected = item.id === preset.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => { setPreset(item); setResult(null); setMessage(`Preset selected: ${item.title}.`); }}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}. ${item.description}. ${item.bitrate / 1000} kbps, ${item.sampleRate / 1000} kHz.`}
                  accessibilityState={{ selected }}
                  style={[styles.preset, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}
                >
                  <View style={styles.presetCopy}>
                    <Text style={[styles.presetTitle, { color: colors.foreground }]}>{item.title}</Text>
                    <Text style={[styles.presetDesc, { color: colors.mutedForeground }]}>{item.description}</Text>
                  </View>
                  <View style={[styles.selectionMark, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}>
                    {selected ? <Feather name="check" size={13} color={colors.primaryForeground} /> : null}
                  </View>
                  <Text style={[styles.presetMeta, { color: colors.primary }]}>{item.bitrate / 1000} kbps • {item.sampleRate / 1000} kHz</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.estimateBox, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <View style={styles.estimateIcon}>
              <Feather name="info" size={17} color={colors.primary} />
            </View>
            <View style={styles.estimateCopy}>
              <Text style={[styles.estimateTitle, { color: colors.foreground }]}>Estimated compressed audio size</Text>
              <Text style={[styles.estimateValue, { color: colors.primary }]}>{formatBytes(expectedOutputBytes ?? undefined)}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Actual M4A size can differ because the container and encoder add overhead.</Text>
            </View>
          </View>

          <Pressable
            disabled={!canCompress}
            onPress={compress}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canCompress }}
            style={[styles.primaryButton, { backgroundColor: canCompress ? colors.primary : colors.muted }]}
          >
            {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="archive" size={18} color={colors.primaryForeground} />}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{loading ? 'Compressing…' : 'Compress Audio'}</Text>
          </Pressable>

          {result && (
            <View style={[styles.resultBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>Compression result</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Input: {formatBytes(result.inputBytes)}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Output: {formatBytes(result.outputBytes)}</Text>
              {reduction !== null ? <Text style={[styles.resultReduction, { color: colors.primary }]}>{reduction.toFixed(1)}% smaller</Text> : null}
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Output sample rate: {result.sampleRate} Hz • Bitrate: {Math.round(result.bitrate / 1000)} kbps</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={2}>Saved to: {result.outputPath}</Text>
            </View>
          )}
        </View>
      )}

      {!source && (
        <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="music" size={24} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Choose an audio file to begin</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>The selected file is inspected before compression so invalid or unsupported audio is rejected before export.</Text>
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
  meta: { fontSize: 10.5, lineHeight: 15 },
  sectionTitle: { fontSize: 13.5, fontFamily: 'Inter_700Bold', marginTop: 2 },
  presetList: { gap: 8 },
  preset: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 7, position: 'relative' },
  presetCopy: { paddingRight: 26 },
  presetTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  presetDesc: { fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  selectionMark: { position: 'absolute', top: 11, right: 11, width: 22, height: 22, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  presetMeta: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  estimateBox: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 10 },
  estimateIcon: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  estimateCopy: { flex: 1 },
  estimateTitle: { fontSize: 11.5, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  estimateValue: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  resultBox: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 5 },
  resultTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  resultReduction: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 2 },
  emptyCard: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 },
  emptyTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  message: { marginTop: 14, fontSize: 11, lineHeight: 16 },
});
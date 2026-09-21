import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { discoverLocalAudio, pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import {
  AUDIO_COMPRESSION_PRESETS,
  compressAudioSource,
  formatBytes,
  type AudioCompressionPreset,
} from '@/features/audio-editor/audioCompression';
import type { AudioEditorSource } from '@/features/audio-editor/types';
import { assertAudioEditorNative, type AudioProbeResult } from '@/modules/audio-editor-native';

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
}

export default function AudioCompressorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [probe, setProbe] = useState<AudioProbeResult | null>(null);
  const [library, setLibrary] = useState<AudioEditorSource[]>([]);
  const [query, setQuery] = useState('');
  const [presetId, setPresetId] = useState<AudioCompressionPreset['id']>('balanced');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [lastResult, setLastResult] = useState<{
    path: string;
    inputSizeBytes: number;
    outputSizeBytes: number;
  } | null>(null);

  const preset = AUDIO_COMPRESSION_PRESETS.find((item) => item.id === presetId) ?? AUDIO_COMPRESSION_PRESETS[1];

  const loadSource = useCallback(async (next: AudioEditorSource) => {
    setLoading(true);
    setMessage('Reading audio metadata…');
    setLastResult(null);
    try {
      const metadata = await assertAudioEditorNative().probe(next.uri);
      setSource({ ...next, durationMs: metadata.durationMs });
      setProbe(metadata);
      setMessage('Audio loaded. Choose a compression preset.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to inspect this audio file.');
    } finally {
      setLoading(false);
    }
  }, []);

  const chooseFromFileManager = useCallback(async () => {
    try {
      const picked = await pickAudioFromFileManager();
      if (picked) await loadSource(picked);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to choose an audio file.');
    }
  }, [loadSource]);

  const discover = useCallback(async () => {
    setLoading(true);
    setMessage('Scanning local audio…');
    try {
      const result = await discoverLocalAudio(query);
      setLibrary(result.audio);
      setMessage(
        result.permissionGranted
          ? `${result.audio.length} audio file${result.audio.length === 1 ? '' : 's'} found.`
          : 'Music and audio permission is required to scan local audio.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to scan local audio.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const compress = useCallback(async () => {
    if (!source || loading) return;
    setLoading(true);
    setMessage(`Compressing with ${preset.title.toLowerCase()} preset…`);
    setLastResult(null);
    try {
      const outputPath = await createAudioEditorOutputPath(
        'Audio Compress',
        source.name,
        preset.id,
        'm4a',
      );
      const result = await compressAudioSource(source.uri, outputPath, preset);
      setLastResult({
        path: result.outputPath,
        inputSizeBytes: Number(result.inputSizeBytes ?? 0),
        outputSizeBytes: Number(result.outputSizeBytes ?? 0),
      });
      setMessage('Audio compressed and saved successfully to Nexus Plus // audio // audio compress');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to compress this audio file.');
    } finally {
      setLoading(false);
    }
  }, [loading, preset, source]);

  const reduction =
    lastResult && lastResult.inputSizeBytes > 0 && lastResult.outputSizeBytes > 0
      ? Math.max(
          0,
          Math.round((1 - lastResult.outputSizeBytes / lastResult.inputSizeBytes) * 100),
        )
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
          <Feather name="minimize-2" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Compressor</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Reduce audio size with real native AAC re-encoding while keeping the original source untouched.
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => void chooseFromFileManager()}
        accessibilityRole="button"
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
      >
        <Feather name="folder" size={19} color={colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose from File Manager</Text>
      </Pressable>

      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search local audio"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
          accessibilityLabel="Search local audio"
        />
        <Pressable
          onPress={() => void discover()}
          accessibilityRole="button"
          accessibilityLabel="Search local audio library"
          style={[styles.scanButton, { backgroundColor: colors.secondary }]}
        >
          <Feather name="search" size={19} color={colors.primary} />
        </Pressable>
      </View>

      {library.length > 0 && (
        <View style={styles.libraryList}>
          {library.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => void loadSource(item)}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              style={[styles.libraryItem, { borderColor: colors.border, backgroundColor: colors.card }]}
            >
              <Feather name="music" size={18} color={colors.primary} />
              <View style={styles.libraryCopy}>
                <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{formatTime(item.durationMs)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {source && (
        <View style={[styles.editorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={1}>{source.name}</Text>
          <Text style={[styles.metadata, { color: colors.mutedForeground }]}>
            {formatTime(probe?.durationMs ?? source.durationMs)} • {probe?.sampleRate ?? 0} Hz • {probe?.channels ?? 0} channel(s)
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Compression preset</Text>
          <View style={styles.presetList}>
            {AUDIO_COMPRESSION_PRESETS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setPresetId(item.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: item.id === presetId }}
                style={[
                  styles.presetCard,
                  {
                    borderColor: item.id === presetId ? colors.primary : colors.border,
                    backgroundColor: item.id === presetId ? colors.secondary : colors.background,
                  },
                ]}
              >
                <View style={styles.presetHeader}>
                  <Text style={[styles.presetTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.presetSpecs, { color: colors.primary }]}>
                    {item.bitrateKbps} kbps • {item.sampleRateHz / 1000} kHz
                  </Text>
                </View>
                <Text style={[styles.presetDescription, { color: colors.mutedForeground }]}>{item.description}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Selected output</Text>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>
              AAC • {preset.bitrateKbps} kbps • {preset.sampleRateHz} Hz
            </Text>
          </View>

          <Pressable
            disabled={loading}
            onPress={() => void compress()}
            accessibilityRole="button"
            accessibilityLabel={loading ? 'Compressing audio' : 'Compress audio'}
            style={[styles.primaryButton, { backgroundColor: loading ? colors.muted : colors.primary }]}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Feather name="minimize-2" size={19} color={colors.primaryForeground} />
            )}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {loading ? 'Compressing…' : 'Compress & Save'}
            </Text>
          </Pressable>

          {lastResult && (
            <View style={[styles.resultCard, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>Compression complete</Text>
              <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
                Original: {formatBytes(lastResult.inputSizeBytes)} • Compressed: {formatBytes(lastResult.outputSizeBytes)}
              </Text>
              {reduction !== null && (
                <Text style={[styles.resultText, { color: colors.foreground }]}>
                  Size reduction: {reduction}%
                </Text>
              )}
              <Text numberOfLines={3} style={[styles.pathText, { color: colors.mutedForeground }]}>{lastResult.path}</Text>
            </View>
          )}
        </View>
      )}

      {!!message && (
        <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>
          {message}
        </Text>
      )}
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
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  searchInput: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 13 },
  scanButton: { width: 48, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  libraryList: { gap: 8, marginTop: 12 },
  libraryItem: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center' },
  libraryCopy: { flex: 1, marginLeft: 10 },
  itemTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  itemMeta: { fontSize: 10.5, marginTop: 3 },
  editorCard: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  sourceTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  metadata: { fontSize: 10.5, lineHeight: 15 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 3 },
  presetList: { gap: 9 },
  presetCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  presetHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  presetTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  presetSpecs: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  presetDescription: { fontSize: 10.5, lineHeight: 15 },
  summaryCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 3 },
  summaryTitle: { fontSize: 11.5, fontFamily: 'Inter_700Bold' },
  summaryText: { fontSize: 10.5 },
  resultCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 5 },
  resultTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  resultText: { fontSize: 10.5, lineHeight: 15 },
  pathText: { fontSize: 9.5, lineHeight: 14 },
  message: { fontSize: 11, lineHeight: 16, marginTop: 14 },
});

import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createAudioEditorOutputPath, ensureAudioEditorExportFolder } from '@/features/audio-editor/audioEditorExport';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { discoverLocalAudio, pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { AUDIO_FORMAT_OPTIONS, convertAudioFormat, type AudioFormat, type AudioFormatConversionResult } from '@/features/audio-editor/audioFormatConverter';
import { assertAudioEditorNative, type AudioProbeResult } from '@/features/audio-editor/audioEditorNative';
import type { AudioEditorSource } from '@/features/audio-editor/types';

export default function AudioFormatConverterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [probe, setProbe] = useState<AudioProbeResult | null>(null);
  const [format, setFormat] = useState<AudioFormat>('wav');
  const [bitrate, setBitrate] = useState(128_000);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Choose an audio file to convert.');
  const [result, setResult] = useState<AudioFormatConversionResult | null>(null);

  const selectedOption = useMemo(() => AUDIO_FORMAT_OPTIONS.find((item) => item.id === format) ?? AUDIO_FORMAT_OPTIONS[0], [format]);

  const reset = useCallback(() => {
    setSource(null);
    setProbe(null);
    setResult(null);
    setMessage('Choose an audio file to convert.');
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (source || result) {
        reset();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [reset, result, source]);

  const loadSource = useCallback(async (next: AudioEditorSource) => {
    setLoading(true);
    setResult(null);
    setMessage('Reading audio metadata…');
    try {
      const metadata = await assertAudioEditorNative().probe(next.uri);
      setSource({ ...next, durationMs: metadata.durationMs });
      setProbe(metadata);
      setMessage('Audio selected. Choose an output format.');
    } catch (error) {
      reset();
      setMessage(error instanceof Error ? error.message : 'Unable to inspect this audio file.');
    } finally {
      setLoading(false);
    }
  }, [reset]);

  const chooseFile = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (picked) await loadSource(picked);
  }, [loadSource]);

  const scanLocal = useCallback(async () => {
    setLoading(true);
    setMessage('Scanning local audio…');
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

  const convert = useCallback(async () => {
    if (!source || !probe || probe.durationMs <= 0 || loading) return;
    setLoading(true);
    setResult(null);
    setMessage(`Converting to ${selectedOption.title}…`);
    try {
      await ensureAudioEditorExportFolder('Format Converter');
      const outputPath = await createAudioEditorOutputPath('Format Converter', source.name, `converted-${format}`, selectedOption.extension);
      const converted = await convertAudioFormat({
        inputPath: source.uri,
        outputPath,
        format,
        bitrate,
        sampleRate: probe.sampleRate > 0 ? probe.sampleRate : 44_100,
        quality: 5,
      });
      setResult(converted);
      setMessage(`${selectedOption.title} conversion completed successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Unable to convert to ${selectedOption.title}.`);
    } finally {
      setLoading(false);
    }
  }, [bitrate, format, loading, probe, selectedOption, source]);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Format Converter' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="repeat" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Format Converter</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Convert audio between common formats with explicit capability checks.</Text>
        </View>
      </View>

      {!result && (
        <>
          <View style={styles.rowButtons}>
            <Pressable onPress={chooseFile} disabled={loading} accessibilityRole="button" accessibilityState={{ disabled: loading }} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: loading ? 0.65 : 1 }]}><Feather name="folder" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose Audio</Text></Pressable>
            <Pressable onPress={scanLocal} disabled={loading} accessibilityRole="button" accessibilityState={{ disabled: loading }} style={[styles.secondaryButton, { borderColor: colors.primary, opacity: loading ? 0.65 : 1 }]}><Feather name="music" size={18} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Audio Library</Text></Pressable>
          </View>

          {source && probe && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={1}>{source.name}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Duration {Math.round(probe.durationMs / 1000)}s • {probe.sampleRate || 'Unknown'} Hz • {probe.channels || 'Unknown'} channel(s)</Text>

              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Output format</Text>
              <View style={styles.formatList}>
                {AUDIO_FORMAT_OPTIONS.map((item) => {
                  const selected = item.id === format;
                  return <Pressable key={item.id} onPress={() => { setFormat(item.id); setMessage(`${item.title} selected.`); }} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.description}`} accessibilityState={{ selected }} style={[styles.format, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}>
                    <View style={styles.formatCopy}><Text style={[styles.formatTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.formatDesc, { color: colors.mutedForeground }]}>{item.description}</Text></View>
                    <View style={[styles.selectionMark, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}>{selected ? <Feather name="check" size={13} color={colors.primaryForeground} /> : null}</View>
                  </Pressable>;
                })}
              </View>

              {(format === 'aac' || format === 'm4a') && (
                <View style={[styles.settingBox, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                  <Text style={[styles.settingTitle, { color: colors.foreground }]}>AAC bitrate</Text>
                  <View style={styles.presetRow}>
                    {[96_000, 128_000, 192_000, 256_000].map((value) => {
                      const selected = bitrate === value;
                      return <Pressable key={value} onPress={() => setBitrate(value)} accessibilityRole="button" accessibilityState={{ selected }} style={[styles.bitrateButton, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.background }]}><Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 11 }}>{value / 1000} kbps</Text></Pressable>;
                    })}
                  </View>
                </View>
              )}

              <View style={[styles.capabilityBox, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                <Feather name="info" size={17} color={colors.primary} />
                <Text style={[styles.meta, { color: colors.mutedForeground, flex: 1 }]}>This build guarantees WAV and AAC/M4A conversion through the local native codec path. MP3, FLAC and OGG are shown in the format list but require the approved FFmpeg runtime to be packaged for actual export.</Text>
              </View>

              <Pressable disabled={loading} onPress={convert} accessibilityRole="button" accessibilityState={{ disabled: loading }} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: loading ? 0.65 : 1 }]}>{loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="repeat" size={18} color={colors.primaryForeground} />}<Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{loading ? `Converting…` : `Convert to ${selectedOption.title}`}</Text></Pressable>
            </View>
          )}

          {!source && <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="repeat" size={24} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Format conversion</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>Choose an audio file, select the desired output format, and export a new copy without changing the original.</Text></View>}
        </>
      )}

      {result && <AudioEditorResultPanel outputPath="Nexus Plus // audio // Format Converter" resultUri={result.outputPath} message={`${selectedOption.title} conversion completed successfully.`} onClose={reset} />}
      {!result && !!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
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
  sectionTitle: { fontSize: 13.5, fontFamily: 'Inter_700Bold' },
  formatList: { gap: 8 },
  format: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 7, position: 'relative' },
  formatCopy: { paddingRight: 26 },
  formatTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  formatDesc: { fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  selectionMark: { position: 'absolute', top: 11, right: 11, width: 22, height: 22, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  settingBox: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 9 },
  settingTitle: { fontSize: 11.5, fontFamily: 'Inter_700Bold' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bitrateButton: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  capabilityBox: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 9 },
  emptyCard: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 },
  emptyTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  message: { marginTop: 14, fontSize: 11, lineHeight: 16 },
});

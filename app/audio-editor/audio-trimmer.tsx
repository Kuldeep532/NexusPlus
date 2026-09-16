import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { discoverLocalAudio, pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import type { AudioEditorSource } from '@/features/audio-editor/types';
import { assertAudioEditorNative, type AudioProbeResult, type AudioTrimResult } from '@/modules/audio-editor-native';

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function parseTime(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed) * 1000;
  const parts = trimmed.split(':').map(Number);
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) return null;
  return (parts[0] * 60 + parts[1]) * 1000;
}

export default function AudioTrimmerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [probe, setProbe] = useState<AudioProbeResult | null>(null);
  const [startMs, setStartMs] = useState(0);
  const [endMs, setEndMs] = useState(0);
  const [startText, setStartText] = useState('0:00');
  const [endText, setEndText] = useState('0:00');
  const [query, setQuery] = useState('');
  const [library, setLibrary] = useState<AudioEditorSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Audio library ready. Choose an audio file to begin.');
  const [result, setResult] = useState<AudioTrimResult | null>(null);
  const durationMs = probe?.durationMs ?? source?.durationMs ?? 0;

  const reset = useCallback(() => {
    setSource(null);
    setProbe(null);
    setResult(null);
    setStartMs(0);
    setEndMs(0);
    setStartText('0:00');
    setEndText('0:00');
    setLibrary([]);
    setMessage('Audio library ready. Choose an audio file to begin.');
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
      const native = assertAudioEditorNative();
      const metadata = await native.probe(next.uri);
      const resolved = { ...next, durationMs: metadata.durationMs };
      setSource(resolved);
      setProbe(metadata);
      setStartMs(0);
      setEndMs(metadata.durationMs);
      setStartText(formatTime(0));
      setEndText(formatTime(metadata.durationMs));
      setMessage('Audio loaded. Choose the section to keep.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to inspect this audio file.');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectFromFileManager = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (picked) await loadSource(picked);
  }, [loadSource]);

  const discover = useCallback(async () => {
    setLoading(true);
    setMessage('Scanning local audio…');
    try {
      const found = await discoverLocalAudio(query);
      setLibrary(found.audio);
      if (!found.permissionGranted) setMessage('Music and audio permission is required to scan local audio.');
      else setMessage(`${found.audio.length} audio file${found.audio.length === 1 ? '' : 's'} found.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to scan local audio.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const applyStartText = () => {
    const parsed = parseTime(startText);
    if (parsed === null) {
      setStartText(formatTime(startMs));
      return;
    }
    const next = Math.max(0, Math.min(parsed, Math.max(0, endMs - 1)));
    setStartMs(next);
    setStartText(formatTime(next));
  };

  const applyEndText = () => {
    const parsed = parseTime(endText);
    if (parsed === null) {
      setEndText(formatTime(endMs));
      return;
    }
    const next = Math.min(durationMs, Math.max(startMs + 1, parsed));
    setEndMs(next);
    setEndText(formatTime(next));
  };

  const updateStart = (next: number) => {
    const value = Math.max(0, Math.min(next, Math.max(0, endMs - 1)));
    setStartMs(value);
    setStartText(formatTime(value));
  };

  const updateEnd = (next: number) => {
    const value = Math.min(durationMs, Math.max(startMs + 1, next));
    setEndMs(value);
    setEndText(formatTime(value));
  };

  const stepMs = Math.max(100, Math.min(1000, durationMs / 100));
  const cutDuration = Math.max(0, endMs - startMs);
  const validRange = Boolean(source && durationMs > 0 && startMs >= 0 && endMs > startMs && endMs <= durationMs && !loading && !result);

  const smartSuggestion = useMemo(() => {
    if (!durationMs) return null;
    const target = Math.min(durationMs, Math.max(15_000, Math.min(30_000, durationMs)));
    return { start: Math.max(0, (durationMs - target) / 2), end: Math.min(durationMs, (durationMs + target) / 2) };
  }, [durationMs]);

  const applySmartSuggestion = () => {
    if (!smartSuggestion) return;
    setStartMs(smartSuggestion.start);
    setEndMs(smartSuggestion.end);
    setStartText(formatTime(smartSuggestion.start));
    setEndText(formatTime(smartSuggestion.end));
    setMessage('Smart ringtone-length suggestion applied. Review the range before exporting.');
  };

  const exportTrim = useCallback(async () => {
    if (!source || !validRange) return;
    setLoading(true);
    setMessage('Exporting trimmed audio…');
    try {
      const native = assertAudioEditorNative();
      const outputPath = await createAudioEditorOutputPath('Audio Trims', source.name, 'trim', 'm4a');
      const trimmed = await native.trim(source.uri, outputPath, startMs, endMs);
      setResult(trimmed);
      setMessage('Audio trimmed and saved successfully to Nexus Plus // audio // audio trims.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to export the trimmed audio.');
    } finally {
      setLoading(false);
    }
  }, [endMs, loading, source, startMs, validRange]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Audio Trimmer' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="scissors" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Trimmer</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose an audio file, set exact boundaries, and save a real trimmed file.</Text>
        </View>
      </View>

      {!result && (
        <>
          <Pressable onPress={selectFromFileManager} disabled={loading} accessibilityRole="button" accessibilityState={{ disabled: loading }} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: loading ? 0.65 : 1 }]}>
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
            <Pressable onPress={discover} disabled={loading} accessibilityRole="button" accessibilityState={{ disabled: loading }} style={[styles.scanButton, { backgroundColor: colors.secondary, opacity: loading ? 0.65 : 1 }]}>
              <Feather name="search" size={19} color={colors.primary} />
            </Pressable>
          </View>

          {library.length > 0 && (
            <View style={styles.libraryList}>
              {library.map((item) => (
                <Pressable key={item.id} onPress={() => loadSource(item)} disabled={loading} accessibilityRole="button" accessibilityLabel={`Select ${item.name}`} style={[styles.libraryItem, { borderColor: colors.border, backgroundColor: colors.card, opacity: loading ? 0.65 : 1 }]}>
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
              <Text style={[styles.metadata, { color: colors.mutedForeground }]}>{formatTime(durationMs)} • {probe?.sampleRate ? `${probe.sampleRate} Hz` : 'Unknown sample rate'} • {probe?.channels ?? 0} channel(s)</Text>

              <View style={[styles.timeline, { backgroundColor: colors.secondary }]}>
                <View style={[styles.timelineSelected, { backgroundColor: colors.primary, left: durationMs ? `${(startMs / durationMs) * 100}%` : '0%', right: durationMs ? `${100 - (endMs / durationMs) * 100}%` : '0%' }]} />
              </View>

              <View style={styles.timeRow}>
                <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>Start</Text>
                <Text style={[styles.rangeValue, { color: colors.foreground }]}>{formatTime(startMs)}</Text>
                <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>End</Text>
                <Text style={[styles.rangeValue, { color: colors.foreground }]}>{formatTime(endMs)}</Text>
              </View>

              <View style={styles.nudgeRow}>
                <Pressable onPress={() => updateStart(startMs - stepMs)} disabled={loading} style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>Start −</Text></Pressable>
                <Pressable onPress={() => updateStart(startMs + stepMs)} disabled={loading} style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>Start +</Text></Pressable>
                <Pressable onPress={() => updateEnd(endMs - stepMs)} disabled={loading} style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>End −</Text></Pressable>
                <Pressable onPress={() => updateEnd(endMs + stepMs)} disabled={loading} style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>End +</Text></Pressable>
              </View>

              <View style={styles.inputsRow}>
                <TextInput value={startText} onChangeText={setStartText} onBlur={applyStartText} placeholder="0:00" placeholderTextColor={colors.mutedForeground} style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Trim start time" keyboardType="numeric" />
                <TextInput value={endText} onChangeText={setEndText} onBlur={applyEndText} placeholder={formatTime(durationMs)} placeholderTextColor={colors.mutedForeground} style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Trim end time" keyboardType="numeric" />
              </View>

              {smartSuggestion && (
                <Pressable onPress={applySmartSuggestion} disabled={loading} style={[styles.secondaryButton, { borderColor: colors.primary, opacity: loading ? 0.65 : 1 }]} accessibilityRole="button" accessibilityState={{ disabled: loading }}>
                  <Feather name="zap" size={18} color={colors.primary} />
                  <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Suggest ringtone cut ({formatTime(smartSuggestion.start)}–{formatTime(smartSuggestion.end)})</Text>
                </Pressable>
              )}

              <Text style={[styles.durationText, { color: colors.mutedForeground }]}>Selected length: {formatTime(cutDuration)}</Text>
              <Pressable disabled={!validRange} onPress={exportTrim} style={[styles.primaryButton, { backgroundColor: validRange ? colors.primary : colors.muted }]} accessibilityRole="button" accessibilityState={{ disabled: !validRange }}>
                {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="check" size={19} color={colors.primaryForeground} />}
                <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{loading ? 'Saving…' : 'Generate Trimmed Audio'}</Text>
              </Pressable>
            </View>
          )}

          {!source && <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="music" size={24} color={colors.primary} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Audio library</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>Choose audio from the file manager or search the local audio library.</Text></View>}
        </>
      )}

      {result && <AudioEditorResultPanel outputPath="Nexus Plus // audio // audio trims" resultUri={result.outputPath} message="Audio trimmed and saved successfully to Nexus Plus // audio // audio trims." onClose={reset} />}
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
  metadata: { fontSize: 10.5 },
  timeline: { height: 54, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  timelineSelected: { position: 'absolute', top: 0, bottom: 0 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rangeLabel: { fontSize: 10.5 },
  rangeValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  nudgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  smallButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  smallButtonText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  inputsRow: { flexDirection: 'row', gap: 8 },
  timeInput: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
  secondaryButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  secondaryButtonText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' },
  durationText: { fontSize: 11 },
  emptyCard: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 },
  emptyTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 10.5, lineHeight: 15 },
  message: { fontSize: 11, lineHeight: 16, marginTop: 14 },
});

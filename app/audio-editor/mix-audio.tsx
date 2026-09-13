import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { discoverLocalAudio, pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { mixAudioProject } from '@/features/audio-editor/audioMixProcessing';
import { createAudioMixTrack, type AudioMixTrack } from '@/features/audio-editor/audioMixTypes';
import type { AudioEditorSource } from '@/features/audio-editor/types';
import { assertAudioEditorNative, type AudioProbeResult } from '@/modules/audio-editor-native';

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

export default function MixAudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [base, setBase] = useState<AudioMixTrack | null>(null);
  const [overlays, setOverlays] = useState<AudioMixTrack[]>([]);
  const [baseProbe, setBaseProbe] = useState<AudioProbeResult | null>(null);
  const [overlayProbes, setOverlayProbes] = useState<Record<string, AudioProbeResult>>({});
  const [library, setLibrary] = useState<AudioEditorSource[]>([]);
  const [pickerMode, setPickerMode] = useState<'base' | 'overlay'>('base');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const activeOverlays = useMemo(() => overlays.filter((track) => !track.muted), [overlays]);
  const mixDuration = useMemo(() => {
    if (!base) return 0;
    return Math.max(
      base.source.durationMs,
      ...activeOverlays.map((track) => track.startMs + track.source.durationMs),
    );
  }, [activeOverlays, base]);

  const setOverlay = (id: string, patch: Partial<AudioMixTrack>) => {
    setOverlays((current) => current.map((track) => track.id === id ? { ...track, ...patch } : track));
  };

  const loadSource = useCallback(async (next: AudioEditorSource, mode: 'base' | 'overlay') => {
    setLoading(true);
    setMessage('Reading audio metadata…');
    try {
      const metadata = await assertAudioEditorNative().probe(next.uri);
      const source = { ...next, durationMs: metadata.durationMs };
      if (mode === 'base') {
        setBase(createAudioMixTrack(source, 0));
        setBaseProbe(metadata);
        setOverlays([]);
        setOverlayProbes({});
        setMessage('Base audio loaded. Add as many overlay tracks as needed.');
      } else {
        setOverlays((current) => [...current, createAudioMixTrack(source, current.length + 1)]);
        setOverlayProbes((current) => ({ ...current, [source.id]: metadata }));
        setMessage(`Track added: ${source.name}. Total active tracks: ${overlays.filter((track) => !track.muted).length + 2}.`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to inspect this audio file.');
    } finally {
      setLoading(false);
    }
  }, [overlays]);

  const chooseFromManager = useCallback(async (mode: 'base' | 'overlay') => {
    const picked = await pickAudioFromFileManager();
    if (picked) await loadSource(picked, mode);
  }, [loadSource]);

  const discover = useCallback(async () => {
    setLoading(true);
    setMessage('Scanning local audio…');
    try {
      const result = await discoverLocalAudio(query);
      setLibrary(result.audio);
      setMessage(result.permissionGranted ? `${result.audio.length} audio file${result.audio.length === 1 ? '' : 's'} found.` : 'Music and audio permission is required to scan local audio.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to scan local audio.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const removeOverlay = (id: string) => {
    setOverlays((current) => current.filter((track) => track.id !== id));
    setOverlayProbes((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    setMessage('Track removed.');
  };

  const exportMix = async () => {
    if (!base || activeOverlays.length === 0 || loading) return;
    setLoading(true);
    setMessage('Mixing all tracks natively…');
    try {
      const outputPath = await createAudioEditorOutputPath('Audio Mixes', base.source.name, 'mixed');
      const result = await mixAudioProject({ base, overlays: activeOverlays }, outputPath);
      setMessage(`Mix complete: ${result.outputPath}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to mix these audio files.');
    } finally {
      setLoading(false);
    }
  };

  const renderOverlay = ({ item, index }: { item: AudioMixTrack; index: number }) => {
    const probe = overlayProbes[item.source.id];
    return (
      <View style={[styles.editorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.trackBadge, { backgroundColor: colors.secondary }]}><Text style={[styles.trackBadgeText, { color: colors.primary }]}>{index + 1}</Text></View>
          <View style={styles.cardTitleWrap}>
            <Text numberOfLines={1} style={[styles.sourceTitle, { color: colors.foreground }]}>{item.source.name}</Text>
            <Text numberOfLines={1} style={[styles.metadata, { color: colors.mutedForeground }]}>{formatTime(item.source.durationMs)} • {probe?.sampleRate ?? 0} Hz • {probe?.channels ?? 0} ch</Text>
          </View>
          <Pressable onPress={() => setOverlay(item.id, { muted: !item.muted })} accessibilityRole="button" accessibilityLabel={item.muted ? `Unmute track ${index + 1}` : `Mute track ${index + 1}`} style={[styles.smallButton, { borderColor: colors.border }]}><Feather name={item.muted ? 'volume-x' : 'volume-2'} size={16} color={colors.primary} /></Pressable>
          <Pressable onPress={() => removeOverlay(item.id)} accessibilityRole="button" accessibilityLabel={`Remove track ${index + 1}`} style={[styles.smallButton, { borderColor: colors.border }]}><Feather name="trash-2" size={16} color={colors.primary} /></Pressable>
        </View>
        <Text style={[styles.controlLabel, { color: colors.foreground }]}>Start time</Text>
        <View style={styles.inputsRow}>
          <TextInput value={formatTime(item.startMs)} onChangeText={(value) => { const parsed = parseTime(value); if (parsed !== null) setOverlay(item.id, { startMs: parsed }); }} keyboardType="numbers-and-punctuation" style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel={`Track ${index + 1} start time`} />
          <Pressable onPress={() => setOverlay(item.id, { startMs: Math.max(0, item.startMs - 1000) })} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>−1s</Text></Pressable>
          <Pressable onPress={() => setOverlay(item.id, { startMs: item.startMs + 1000 })} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>+1s</Text></Pressable>
        </View>
        <Text style={[styles.controlLabel, { color: colors.foreground }]}>Volume (%)</Text>
        <View style={styles.inputsRow}>
          <TextInput value={String(Math.round(item.volume * 100))} onChangeText={(value) => { const parsed = Number(value); if (Number.isFinite(parsed)) setOverlay(item.id, { volume: Math.max(0, Math.min(200, parsed)) / 100 }); }} keyboardType="numeric" style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel={`Track ${index + 1} volume percent`} />
          <Pressable onPress={() => setOverlay(item.id, { volume: Math.max(0, item.volume - 0.1) })} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>−10%</Text></Pressable>
          <Pressable onPress={() => setOverlay(item.id, { volume: Math.min(2, item.volume + 0.1) })} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>+10%</Text></Pressable>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}
      data={overlays}
      keyExtractor={(item) => item.id}
      renderItem={renderOverlay}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View>
          <Stack.Screen options={{ title: 'Mix Audio' }} />
          <View style={styles.headerRow}>
            <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="layers" size={24} color={colors.primary} /></View>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Mix Audio</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Add unlimited audio tracks. Processing stays native while the UI keeps only lightweight timing and volume metadata.</Text>
            </View>
          </View>
          <View style={styles.selectorRow}>
            <Pressable onPress={() => setPickerMode('base')} accessibilityRole="button" style={[styles.modeButton, { borderColor: pickerMode === 'base' ? colors.primary : colors.border, backgroundColor: pickerMode === 'base' ? colors.secondary : colors.card }]}><Text style={[styles.modeButtonText, { color: pickerMode === 'base' ? colors.primary : colors.foreground }]}>Base audio</Text></Pressable>
            <Pressable onPress={() => setPickerMode('overlay')} accessibilityRole="button" style={[styles.modeButton, { borderColor: pickerMode === 'overlay' ? colors.primary : colors.border, backgroundColor: pickerMode === 'overlay' ? colors.secondary : colors.card }]}><Text style={[styles.modeButtonText, { color: pickerMode === 'overlay' ? colors.primary : colors.foreground }]}>Overlay tracks</Text></Pressable>
          </View>
          <Pressable onPress={() => chooseFromManager(pickerMode)} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Feather name="folder" size={19} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose {pickerMode === 'base' ? 'Base Audio' : 'Audio Track'}</Text></Pressable>
          <View style={styles.searchRow}>
            <TextInput value={query} onChangeText={setQuery} placeholder="Search local audio" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} accessibilityLabel="Search local audio" />
            <Pressable onPress={discover} accessibilityRole="button" style={[styles.scanButton, { backgroundColor: colors.secondary }]}><Feather name="search" size={19} color={colors.primary} /></Pressable>
          </View>
          {library.length > 0 && <View style={styles.libraryList}>{library.map((item) => <Pressable key={item.id} onPress={() => loadSource(item, pickerMode)} accessibilityRole="button" style={[styles.libraryItem, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="music" size={18} color={colors.primary} /><View style={styles.libraryCopy}><Text numberOfLines={1} style={[styles.itemTitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{formatTime(item.durationMs)}</Text></View></Pressable>)}</View>}
          {base && <View style={[styles.editorCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={1}>Base: {base.source.name}</Text><Text style={[styles.metadata, { color: colors.mutedForeground }]}>{formatTime(base.source.durationMs)} • {baseProbe?.sampleRate ?? 0} Hz • {baseProbe?.channels ?? 0} ch</Text><Text style={[styles.metadata, { color: colors.mutedForeground }]}>Output length: {formatTime(mixDuration)} • Active tracks: {activeOverlays.length + 1}</Text></View>}
        </View>
      }
      ListFooterComponent={
        <View>
          <Pressable onPress={() => chooseFromManager('overlay')} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.primary }]}><Feather name="plus" size={18} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Add another audio track</Text></Pressable>
          <Pressable disabled={!base || activeOverlays.length === 0 || loading} onPress={exportMix} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: base && activeOverlays.length > 0 && !loading ? colors.primary : colors.muted, marginTop: 12 }]}>{loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="layers" size={19} color={colors.primaryForeground} />}<Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{loading ? 'Mixing…' : 'Mix & Export Audio'}</Text></Pressable>
          {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 14 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 11.5, lineHeight: 17 },
  selectorRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeButton: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeButtonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 16 },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  searchInput: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 13 },
  scanButton: { width: 48, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  libraryList: { gap: 8, marginTop: 12, marginBottom: 12 },
  libraryItem: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center' },
  libraryCopy: { flex: 1, marginLeft: 10 },
  itemTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  itemMeta: { fontSize: 10.5, marginTop: 3 },
  editorCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  trackBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trackBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  cardTitleWrap: { flex: 1, marginLeft: 10, marginRight: 8 },
  sourceTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  metadata: { fontSize: 10.5 },
  controlLabel: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  inputsRow: { flexDirection: 'row', gap: 7 },
  timeInput: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, fontSize: 12 },
  smallButton: { borderWidth: 1, borderRadius: 10, minHeight: 40, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 },
  smallButtonText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  secondaryButton: { minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginTop: 4 },
  secondaryButtonText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  message: { fontSize: 11, lineHeight: 17, marginTop: 12 },
});

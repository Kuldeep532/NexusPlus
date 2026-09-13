import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { discoverLocalAudio, pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { mixAudio } from '@/features/audio-editor/audioMixProcessing';
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
  const [overlay, setOverlay] = useState<AudioMixTrack | null>(null);
  const [baseProbe, setBaseProbe] = useState<AudioProbeResult | null>(null);
  const [overlayProbe, setOverlayProbe] = useState<AudioProbeResult | null>(null);
  const [library, setLibrary] = useState<AudioEditorSource[]>([]);
  const [pickerMode, setPickerMode] = useState<'base' | 'overlay'>('base');
  const [query, setQuery] = useState('');
  const [overlayStartText, setOverlayStartText] = useState('0:00');
  const [overlayVolumeText, setOverlayVolumeText] = useState('100');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadSource = useCallback(async (next: AudioEditorSource, mode: 'base' | 'overlay') => {
    setLoading(true);
    setMessage('Reading audio metadata…');
    try {
      const metadata = await assertAudioEditorNative().probe(next.uri);
      const track = createAudioMixTrack({ ...next, durationMs: metadata.durationMs }, mode === 'base' ? 0 : 1);
      if (mode === 'base') {
        setBase(track);
        setBaseProbe(metadata);
      } else {
        setOverlay(track);
        setOverlayProbe(metadata);
        setOverlayStartText('0:00');
      }
      setMessage(mode === 'base' ? 'Base audio loaded. Select the second track to overlay.' : 'Overlay audio loaded. Adjust its timing and volume.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to inspect this audio file.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      if (!result.permissionGranted) setMessage('Music and audio permission is required to scan local audio.');
      else setMessage(`${result.audio.length} audio file${result.audio.length === 1 ? '' : 's'} found.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to scan local audio.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const updateOverlay = (patch: Partial<AudioMixTrack>) => {
    if (!overlay) return;
    setOverlay({ ...overlay, ...patch });
  };

  const applyOverlayStart = () => {
    const parsed = parseTime(overlayStartText);
    if (parsed === null) {
      setOverlayStartText(formatTime(overlay?.startMs ?? 0));
      return;
    }
    const next = Math.max(0, parsed);
    updateOverlay({ startMs: next });
    setOverlayStartText(formatTime(next));
  };

  const applyOverlayVolume = () => {
    const parsed = Number(overlayVolumeText);
    if (!Number.isFinite(parsed)) {
      setOverlayVolumeText(String(Math.round((overlay?.volume ?? 1) * 100)));
      return;
    }
    const percent = Math.max(0, Math.min(200, parsed));
    updateOverlay({ volume: percent / 100 });
    setOverlayVolumeText(String(Math.round(percent)));
  };

  const mixDuration = useMemo(() => {
    if (!base) return 0;
    if (!overlay || overlay.muted) return base.source.durationMs;
    return Math.max(base.source.durationMs, overlay.startMs + overlay.source.durationMs);
  }, [base, overlay]);

  const valid = Boolean(
    base &&
      overlay &&
      baseProbe &&
      overlayProbe &&
      !overlay.muted &&
      overlay.startMs >= 0 &&
      overlay.volume >= 0 &&
      overlay.volume <= 2 &&
      baseProbe.sampleRate === overlayProbe.sampleRate &&
      baseProbe.channels === overlayProbe.channels,
  );

  const exportMix = async () => {
    if (!base || !overlay || !valid) return;
    setLoading(true);
    setMessage('Mixing audio…');
    try {
      const outputPath = await createAudioEditorOutputPath('Audio Mixes', base.source.name, 'mixed');
      const result = await mixAudio({
        inputPath: base.source.uri,
        overlayPath: overlay.source.uri,
        outputPath,
        overlayStartMs: overlay.startMs,
        overlayVolume: overlay.volume,
      });
      setMessage(`Mix complete: ${result.outputPath}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to mix these audio files.');
    } finally {
      setLoading(false);
    }
  };

  const activePickerLabel = pickerMode === 'base' ? 'Base audio' : 'Overlay audio';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Mix Audio' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="layers" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Mix Audio</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Combine two audio tracks. Choose a base track, overlay a second track, set its timing and level, then export.</Text>
        </View>
      </View>
      <View style={styles.selectorRow}>
        <Pressable onPress={() => setPickerMode('base')} accessibilityRole="button" style={[styles.modeButton, { borderColor: pickerMode === 'base' ? colors.primary : colors.border, backgroundColor: pickerMode === 'base' ? colors.secondary : colors.card }]}>
          <Text style={[styles.modeButtonText, { color: pickerMode === 'base' ? colors.primary : colors.foreground }]}>Base audio</Text>
        </Pressable>
        <Pressable onPress={() => setPickerMode('overlay')} accessibilityRole="button" style={[styles.modeButton, { borderColor: pickerMode === 'overlay' ? colors.primary : colors.border, backgroundColor: pickerMode === 'overlay' ? colors.secondary : colors.card }]}>
          <Text style={[styles.modeButtonText, { color: pickerMode === 'overlay' ? colors.primary : colors.foreground }]}>Overlay audio</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => chooseFromManager(pickerMode)} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
        <Feather name="folder" size={19} color={colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose {activePickerLabel} from File Manager</Text>
      </Pressable>
      <View style={styles.searchRow}>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search local audio" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} accessibilityLabel="Search local audio" />
        <Pressable onPress={discover} accessibilityRole="button" style={[styles.scanButton, { backgroundColor: colors.secondary }]}>
          <Feather name="search" size={19} color={colors.primary} />
        </Pressable>
      </View>
      {library.length > 0 && (
        <View style={styles.libraryList}>
          {library.map((item) => (
            <Pressable key={item.id} onPress={() => loadSource(item, pickerMode)} accessibilityRole="button" style={[styles.libraryItem, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="music" size={18} color={colors.primary} />
              <View style={styles.libraryCopy}>
                <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{formatTime(item.durationMs)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      <TrackCard label="Base track" track={base} metadata={baseProbe} colors={colors} icon="music" />
      {overlay && (
        <View style={[styles.editorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleWrap}>
              <Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={1}>{overlay.source.name}</Text>
              <Text style={[styles.metadata, { color: colors.mutedForeground }]}>{formatTime(overlay.source.durationMs)} • {overlayProbe?.sampleRate ?? 0} Hz • {overlayProbe?.channels ?? 0} channel(s)</Text>
            </View>
            <Pressable onPress={() => updateOverlay({ muted: !overlay.muted })} accessibilityRole="button" accessibilityLabel={overlay.muted ? 'Unmute overlay audio' : 'Mute overlay audio'} style={[styles.muteButton, { borderColor: colors.border }]}>
              <Feather name={overlay.muted ? 'volume-x' : 'volume-2'} size={18} color={colors.primary} />
              <Text style={[styles.muteText, { color: colors.foreground }]}>{overlay.muted ? 'Muted' : 'Active'}</Text>
            </Pressable>
          </View>
          <View style={[styles.timeline, { backgroundColor: colors.secondary }]}>
            <View style={[styles.timelineBase, { backgroundColor: colors.border }]} />
            <View style={[styles.timelineOverlay, { backgroundColor: colors.primary, left: mixDuration ? `${Math.min(100, (overlay.startMs / mixDuration) * 100)}%` : '0%', width: mixDuration ? `${Math.min(100, (overlay.source.durationMs / mixDuration) * 100)}%` : '0%' }]} />
          </View>
          <View style={styles.controlBlock}>
            <Text style={[styles.controlLabel, { color: colors.foreground }]}>Overlay start</Text>
            <View style={styles.inputsRow}>
              <TextInput value={overlayStartText} onChangeText={setOverlayStartText} onBlur={applyOverlayStart} keyboardType="numbers-and-punctuation" placeholder="0:00" placeholderTextColor={colors.mutedForeground} style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Overlay start time" />
              <Pressable onPress={() => { const next = Math.max(0, overlay.startMs - 1000); updateOverlay({ startMs: next }); setOverlayStartText(formatTime(next)); }} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>−1s</Text></Pressable>
              <Pressable onPress={() => { const next = overlay.startMs + 1000; updateOverlay({ startMs: next }); setOverlayStartText(formatTime(next)); }} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>+1s</Text></Pressable>
            </View>
          </View>
          <View style={styles.controlBlock}>
            <Text style={[styles.controlLabel, { color: colors.foreground }]}>Overlay volume (%)</Text>
            <View style={styles.inputsRow}>
              <TextInput value={overlayVolumeText} onChangeText={setOverlayVolumeText} onBlur={applyOverlayVolume} keyboardType="numeric" placeholder="100" placeholderTextColor={colors.mutedForeground} style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Overlay volume percent" />
              <Pressable onPress={() => { const next = Math.max(0, overlay.volume - 0.1); updateOverlay({ volume: next }); setOverlayVolumeText(String(Math.round(next * 100))); }} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>−10%</Text></Pressable>
              <Pressable onPress={() => { const next = Math.min(2, overlay.volume + 0.1); updateOverlay({ volume: next }); setOverlayVolumeText(String(Math.round(next * 100))); }} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>+10%</Text></Pressable>
            </View>
          </View>
          {baseProbe && overlayProbe && (baseProbe.sampleRate !== overlayProbe.sampleRate || baseProbe.channels !== overlayProbe.channels) && (
            <View style={[styles.warningBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="alert-circle" size={18} color={colors.primary} />
              <Text style={[styles.warningText, { color: colors.foreground }]}>The two tracks have different audio formats ({baseProbe.sampleRate} Hz / {baseProbe.channels} ch vs {overlayProbe.sampleRate} Hz / {overlayProbe.channels} ch). Choose matching audio sources for the current native mixer.</Text>
            </View>
          )}
          <Text style={[styles.durationText, { color: colors.mutedForeground }]}>Estimated output length: {formatTime(mixDuration)}</Text>
        </View>
      )}
      <Pressable disabled={!valid || loading} onPress={exportMix} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: valid ? colors.primary : colors.muted, marginTop: 16 }]}>
        {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="layers" size={19} color={colors.primaryForeground} />}
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{loading ? 'Mixing…' : 'Mix & Export Audio'}</Text>
      </Pressable>
      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
    </ScrollView>
  );
}

function TrackCard({ label, track, metadata, colors, icon }: { label: string; track: AudioMixTrack | null; metadata: AudioProbeResult | null; colors: ReturnType<typeof useColors>; icon: 'music' | 'layers' }) {
  return (
    <View style={[styles.editorCard, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLabel={track ? `${label}: ${track.source.name}` : `${label}: not selected`}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.trackBadge, { backgroundColor: colors.secondary }]}><Feather name={icon} size={17} color={colors.primary} /></View>
        <View style={styles.cardTitleWrap}>
          <Text style={[styles.sourceTitle, { color: colors.foreground }]}>{label}</Text>
          <Text style={[styles.metadata, { color: colors.mutedForeground }]} numberOfLines={1}>{track ? `${track.source.name} • ${formatTime(track.source.durationMs)} • ${metadata?.sampleRate ?? 0} Hz` : 'Not selected yet'}</Text>
        </View>
      </View>
    </View>
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
  libraryList: { gap: 8, marginTop: 12 },
  libraryItem: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center' },
  libraryCopy: { flex: 1, marginLeft: 10 },
  itemTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  itemMeta: { fontSize: 10.5, marginTop: 3 },
  editorCard: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitleWrap: { flex: 1 },
  trackBadge: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sourceTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  metadata: { fontSize: 10.5, marginTop: 3 },
  timeline: { height: 54, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  timelineBase: { position: 'absolute', left: 0, right: 0, top: 24, height: 6 },
  timelineOverlay: { position: 'absolute', top: 14, height: 26, borderRadius: 7 },
  muteButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  muteText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  controlBlock: { gap: 7 },
  controlLabel: { fontSize: 11.5, fontFamily: 'Inter_700Bold' },
  inputsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  timeInput: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
  smallButton: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  warningBox: { borderWidth: 1, borderRadius: 12, padding: 11, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  warningText: { flex: 1, fontSize: 10.5, lineHeight: 15 },
  durationText: { fontSize: 11 },
  message: { marginTop: 12, fontSize: 10.5, lineHeight: 15 },
});
import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { pickAudioFromFileManager, discoverLocalAudio } from '@/features/audio-editor/audioEditorSource';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { assertAudioEditorNative, type VocalRemovalNativeResult } from '@/modules/audio-editor-native';
import type { AudioEditorSource } from '@/features/audio-editor/types';

function formatTime(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export default function VocalRemoverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [library, setLibrary] = useState<AudioEditorSource[]>([]);
  const [mode, setMode] = useState<'instrumental' | 'vocals'>('instrumental');
  const [quality, setQuality] = useState<'preview' | 'balanced' | 'studio'>('balanced');
  const [preserveBass, setPreserveBass] = useState(true);
  const [preserveStereo, setPreserveStereo] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Select a local stereo audio track.');
  const [result, setResult] = useState<VocalRemovalNativeResult | null>(null);

  const load = useCallback(async (item: AudioEditorSource) => {
    setSource(item);
    setResult(null);
    setStatus('Audio selected. Ready to separate.');
  }, []);

  const pick = useCallback(async () => {
    try {
      const item = await pickAudioFromFileManager();
      if (item) await load(item);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to select audio.');
    }
  }, [load]);

  const discover = useCallback(async () => {
    try {
      const found = await discoverLocalAudio('');
      setLibrary(found.audio);
      setStatus(found.permissionGranted ? `${found.audio.length} local audio files found.` : 'Music permission is required to scan local audio.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to scan local audio.');
    }
  }, []);

  const process = useCallback(async () => {
    if (!source || busy) return;
    setBusy(true);
    setResult(null);
    setStatus('Separating audio…');
    try {
      const outputPath = await createAudioEditorOutputPath(
        'Vocal Remover',
        source.name,
        mode === 'instrumental' ? 'instrumental' : 'vocals',
        'wav',
      );
      const native = assertAudioEditorNative();
      const next = await native.vocalRemove(
        source.uri,
        outputPath,
        mode,
        quality,
        preserveBass,
        preserveStereo,
      );
      setResult(next);
      setStatus('Vocal separation completed and saved to Nexus Plus.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Vocal separation failed.');
    } finally {
      setBusy(false);
    }
  }, [busy, mode, preserveBass, preserveStereo, quality, source]);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36, gap: 12 }}
    >
      <Stack.Screen options={{ title: 'Vocal Remover' }} />
      <View style={styles.headerRow}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
          <Feather name="mic-off" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Vocal Remover</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Android-native center-channel separation for local stereo audio.
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Pressable onPress={() => void pick()} accessibilityRole="button" style={[styles.primary, { backgroundColor: colors.primary }]}>
          <Feather name="folder" size={18} color={colors.primaryForeground} />
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose Audio</Text>
        </Pressable>
        <Pressable onPress={() => void discover()} accessibilityRole="button" style={[styles.secondary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.primary} />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>Scan Library</Text>
        </Pressable>
      </View>

      {library.length > 0 ? (
        <View style={styles.list}>
          {library.map((item) => (
            <Pressable key={item.id} onPress={() => void load(item)} accessibilityRole="button" style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="music" size={17} color={colors.primary} />
              <View style={styles.itemCopy}>
                <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{formatTime(item.durationMs)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {source ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text numberOfLines={2} style={[styles.source, { color: colors.foreground }]}>{source.name}</Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Output</Text>
          <View style={styles.row}>
            <Pressable onPress={() => setMode('instrumental')} accessibilityRole="radio" accessibilityState={{ selected: mode === 'instrumental' }} style={[styles.choice, { borderColor: mode === 'instrumental' ? colors.primary : colors.border, backgroundColor: mode === 'instrumental' ? colors.secondary : colors.background }]}>
              <Text style={{ color: colors.foreground }}>Instrumental</Text>
            </Pressable>
            <Pressable onPress={() => setMode('vocals')} accessibilityRole="radio" accessibilityState={{ selected: mode === 'vocals' }} style={[styles.choice, { borderColor: mode === 'vocals' ? colors.primary : colors.border, backgroundColor: mode === 'vocals' ? colors.secondary : colors.background }]}>
              <Text style={{ color: colors.foreground }}>Vocals</Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>Quality</Text>
          <View style={styles.row}>
            {(['preview', 'balanced', 'studio'] as const).map((value) => (
              <Pressable key={value} onPress={() => setQuality(value)} accessibilityRole="radio" accessibilityState={{ selected: quality === value }} style={[styles.choice, { borderColor: quality === value ? colors.primary : colors.border, backgroundColor: quality === value ? colors.secondary : colors.background }]}>
                <Text style={{ color: colors.foreground }}>{value}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => setPreserveBass((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: preserveBass }} style={[styles.toggle, { borderColor: colors.border }]}>
            <Text style={{ color: colors.foreground }}>Preserve some bass center</Text>
            <Text style={{ color: colors.primary }}>{preserveBass ? 'On' : 'Off'}</Text>
          </Pressable>

          <Pressable onPress={() => setPreserveStereo((value) => !value)} accessibilityRole="checkbox" accessibilityState={{ checked: preserveStereo }} style={[styles.toggle, { borderColor: colors.border }]}>
            <Text style={{ color: colors.foreground }}>Preserve stereo side field</Text>
            <Text style={{ color: colors.primary }}>{preserveStereo ? 'On' : 'Off'}</Text>
          </Pressable>

          <Pressable disabled={busy} onPress={() => void process()} accessibilityRole="button" style={[styles.process, { backgroundColor: busy ? colors.muted : colors.primary }]}>
            {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="mic-off" size={19} color={colors.primaryForeground} />}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? 'Separating…' : 'Process & Save'}</Text>
          </Pressable>

          {result ? (
            <View style={[styles.result, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.resultTitle, { color: colors.foreground }]}>Saved successfully</Text>
              <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
                {result.sampleRate} Hz • {result.channels} channels • {formatTime(result.durationMs)}
              </Text>
              <Text numberOfLines={3} style={[styles.resultText, { color: colors.mutedForeground }]}>{result.outputPath}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 14 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  primary: { flex: 1, minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  secondary: { flex: 1, minHeight: 50, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
  buttonText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  list: { gap: 8 },
  item: { minHeight: 52, borderRadius: 14, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemCopy: { flex: 1 },
  itemTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  itemMeta: { fontSize: 10.5, marginTop: 2 },
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 11 },
  source: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 2 },
  choice: { minHeight: 42, flex: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  toggle: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  process: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  result: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 5 },
  resultTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  resultText: { fontSize: 10.5, lineHeight: 15 },
  status: { fontSize: 11, lineHeight: 16 },
});

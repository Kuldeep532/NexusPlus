import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { discoverLocalAudio, pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { assertAudioEffectsNative, type AudioEffectInput, type AudioEffectType } from '@/features/audio-editor/audioEffectsNative';
import {
  clampEffectTimelineClip,
  validateEffectTimelineClip,
  type AudioEffectTimelineClip,
} from '@/features/audio-editor/audioEffectTimeline';
import type { AudioEditorSource } from '@/features/audio-editor/types';
import { assertAudioEditorNative, type AudioProbeResult } from '@/modules/audio-editor-native';

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
}

function parseTime(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed) * 1000;
  const parts = trimmed.split(':').map(Number);
  if (parts.length !== 2 || parts.some((part) => !Number.isFinite(part))) return null;
  return (parts[0] * 60 + parts[1]) * 1000;
}

const EFFECTS: Array<{ id: AudioEffectType; title: string; description: string }> = [
  { id: 'volume', title: 'Volume', description: 'Adjust the level of a selected section.' },
  { id: 'fade-in', title: 'Fade In', description: 'Ramp the selected section from silence to full level.' },
  { id: 'fade-out', title: 'Fade Out', description: 'Ramp the selected section from full level to silence.' },
  { id: 'normalize', title: 'Normalize', description: 'Bring the selected section to a controlled peak level.' },
];

export default function AudioEffectsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [probe, setProbe] = useState<AudioProbeResult | null>(null);
  const [library, setLibrary] = useState<AudioEditorSource[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [effect, setEffect] = useState<AudioEffectType>('volume');
  const [amount, setAmount] = useState('1');
  const [startText, setStartText] = useState('0:00');
  const [endText, setEndText] = useState('0:00');
  const durationMs = probe?.durationMs ?? source?.durationMs ?? 0;

  const [clip, setClip] = useState<AudioEffectTimelineClip>({
    id: 'effect-range',
    name: 'Effect Range',
    uri: '',
    startMs: 0,
    endMs: 1,
    volume: 1,
  });

  const currentEffect = EFFECTS.find((item) => item.id === effect) ?? EFFECTS[0];

  const loadSource = useCallback(async (next: AudioEditorSource) => {
    setLoading(true);
    setMessage('Reading audio metadata…');
    try {
      const native = assertAudioEditorNative();
      const metadata = await native.probe(next.uri);
      const resolved = { ...next, durationMs: metadata.durationMs };
      setSource(resolved);
      setProbe(metadata);
      setClip({
        id: 'effect-range',
        name: 'Effect Range',
        uri: resolved.uri,
        startMs: 0,
        endMs: metadata.durationMs,
        volume: 1,
      });
      setStartText('0:00');
      setEndText(formatTime(metadata.durationMs));
      setMessage('Audio loaded. Choose an effect and range.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to inspect this audio file.');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectFromFileManager = useCallback(async () => {
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

  const applyStart = () => {
    const parsed = parseTime(startText);
    if (parsed === null) {
      setStartText(formatTime(clip.startMs));
      return;
    }
    const next = Math.max(0, Math.min(parsed, Math.max(0, clip.endMs - 1)));
    const nextClip = clampEffectTimelineClip({ ...clip, startMs: next }, durationMs);
    setClip(nextClip);
    setStartText(formatTime(nextClip.startMs));
  };

  const applyEnd = () => {
    const parsed = parseTime(endText);
    if (parsed === null) {
      setEndText(formatTime(clip.endMs));
      return;
    }
    const next = Math.min(durationMs, Math.max(clip.startMs + 1, parsed));
    const nextClip = clampEffectTimelineClip({ ...clip, endMs: next }, durationMs);
    setClip(nextClip);
    setEndText(formatTime(nextClip.endMs));
  };

  const selectedLength = Math.max(0, clip.endMs - clip.startMs);

  const valid = useMemo(() => {
    if (!source || durationMs <= 0) return false;
    try {
      validateEffectTimelineClip(clip, durationMs);
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount)) return false;
      if (effect === 'volume' && (numericAmount < 0 || numericAmount > 2)) return false;
      if (effect === 'normalize' && (numericAmount <= 0 || numericAmount > 1)) return false;
      return true;
    } catch {
      return false;
    }
  }, [amount, clip, durationMs, effect, source]);

  const applyEffect = async () => {
    if (!source || !valid) {
      setMessage('Select a valid audio file, effect range, and effect value first.');
      return;
    }

    setLoading(true);
    setMessage(`Applying ${currentEffect.title.toLowerCase()}…`);
    try {
      const outputPath = await createAudioEditorOutputPath(
        'Audio Effects',
        source.name,
        `${effect}-${Date.now()}`,
        'wav',
      );
      const input: AudioEffectInput = {
        inputPath: source.uri,
        outputPath,
        effect,
        startMs: clip.startMs,
        endMs: clip.endMs,
        amount: Number(amount),
      };
      const result = await assertAudioEffectsNative().apply(input);
      setMessage(`Audio effect applied and saved successfully to ${result.outputPath}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to apply this audio effect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Audio Effects' }} />

      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="sliders" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Effects</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Apply real volume and fade processing to a selected part of an audio file.
          </Text>
        </View>
      </View>

      <Pressable
        onPress={selectFromFileManager}
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
          onPress={discover}
          accessibilityRole="button"
          style={[styles.scanButton, { backgroundColor: colors.secondary }]}
          accessibilityLabel="Search local audio library"
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
            {formatTime(durationMs)} • {probe?.sampleRate ?? 0} Hz • {probe?.channels ?? 0} channel(s)
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Effect</Text>
          <View style={styles.effectGrid}>
            {EFFECTS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => setEffect(item.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: effect === item.id }}
                style={[
                  styles.effectCard,
                  {
                    borderColor: effect === item.id ? colors.primary : colors.border,
                    backgroundColor: effect === item.id ? colors.secondary : colors.background,
                  },
                ]}
              >
                <Text style={[styles.effectTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.effectDescription, { color: colors.mutedForeground }]}>{item.description}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Effect range</Text>
          <View style={[styles.timeline, { backgroundColor: colors.secondary }]}>
            <View
              style={[
                styles.timelineSelected,
                {
                  backgroundColor: colors.primary,
                  left: `${durationMs ? (clip.startMs / durationMs) * 100 : 0}%`,
                  right: `${durationMs ? 100 - (clip.endMs / durationMs) * 100 : 0}%`,
                },
              ]}
            />
          </View>

          <View style={styles.inputsRow}>
            <View style={styles.inputBlock}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Start</Text>
              <TextInput
                value={startText}
                onChangeText={setStartText}
                onBlur={applyStart}
                style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border }]}
                accessibilityLabel="Effect start time"
              />
            </View>
            <View style={styles.inputBlock}>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>End</Text>
              <TextInput
                value={endText}
                onChangeText={setEndText}
                onBlur={applyEnd}
                style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border }]}
                accessibilityLabel="Effect end time"
              />
            </View>
          </View>

          <Text style={[styles.durationText, { color: colors.mutedForeground }]}>
            Selected length: {formatTime(selectedLength)}
          </Text>

          {(effect === 'volume' || effect === 'normalize') && (
            <View>
              <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
                {effect === 'volume' ? 'Volume (0 to 2)' : 'Target peak (0.1 to 1)'}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                style={[styles.timeInput, { color: colors.foreground, borderColor: colors.border }]}
                accessibilityLabel={effect === 'volume' ? 'Volume amount' : 'Normalize target peak'}
              />
            </View>
          )}

          <Pressable
            disabled={!valid || loading}
            onPress={() => void applyEffect()}
            accessibilityRole="button"
            style={[styles.primaryButton, { backgroundColor: valid && !loading ? colors.primary : colors.muted }]}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Feather name="sliders" size={19} color={colors.primaryForeground} />
            )}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {loading ? 'Processing…' : `Apply ${currentEffect.title}`}
            </Text>
          </Pressable>
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
  metadata: { fontSize: 10.5 },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  effectGrid: { gap: 8 },
  effectCard: { borderWidth: 1, borderRadius: 14, padding: 12 },
  effectTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  effectDescription: { fontSize: 10.5, lineHeight: 15, marginTop: 3 },
  timeline: { height: 54, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  timelineSelected: { position: 'absolute', top: 0, bottom: 0 },
  inputsRow: { flexDirection: 'row', gap: 8 },
  inputBlock: { flex: 1, gap: 5 },
  inputLabel: { fontSize: 10.5, marginBottom: 5 },
  timeInput: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
  durationText: { fontSize: 11 },
  message: { fontSize: 11, lineHeight: 16, marginTop: 14 },
});

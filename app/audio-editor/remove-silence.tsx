import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import {
  DEFAULT_REMOVE_SILENCE_SETTINGS,
  processRemoveSilence,
  type RemoveSilenceSettings,
} from '@/features/audio-editor/removeSilenceEngine';
import type { AudioEditorSource } from '@/features/audio-editor/types';

const THRESHOLDS = [-50, -45, -40, -35, -30];
const MIN_SILENCES = [200, 350, 500, 750, 1000];
const PADDINGS = [0, 40, 80, 120, 200];

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function RemoveSilenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [settings, setSettings] = useState<RemoveSilenceSettings>(DEFAULT_REMOVE_SILENCE_SETTINGS);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('Choose an audio file to detect and remove quiet gaps.');
  const [output, setOutput] = useState<{ path: string; uri: string; removedSilenceMs: number } | null>(null);

  const choose = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setSource(picked);
    setOutput(null);
    setMessage(`${picked.name} selected. Adjust silence detection settings, then generate.`);
  }, []);

  const update = <K extends keyof RemoveSilenceSettings>(key: K, value: RemoveSilenceSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setOutput(null);
  };

  const generate = useCallback(async () => {
    if (!source) {
      setMessage('Choose an audio file first.');
      return;
    }
    setWorking(true);
    setOutput(null);
    setMessage('Detecting quiet gaps and generating audio…');
    try {
      const outputPath = await createAudioEditorOutputPath('Remove Silence', source.name, 'silence-removed', 'm4a');
      const result = await processRemoveSilence(source.uri, outputPath, settings);
      setOutput({ path: result.outputPath, uri: `file://${result.outputPath}`, removedSilenceMs: result.removedSilenceMs });
      setMessage(`Generated and saved. Removed ${formatTime(result.removedSilenceMs)} of quiet gaps.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove silence from this audio.');
    } finally {
      setWorking(false);
    }
  }, [settings, source]);

  const hasCustomSettings = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(DEFAULT_REMOVE_SILENCE_SETTINGS),
    [settings],
  );

  const reset = () => {
    setSettings(DEFAULT_REMOVE_SILENCE_SETTINGS);
    setOutput(null);
    setMessage('Silence detection settings reset to default.');
  };

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: 'Remove Silence' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="volume-x" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Remove Silence</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Automatically remove sustained quiet gaps while keeping a small amount of natural room tone.</Text>
        </View>
      </View>

      {!output && (
        <>
          <Pressable
            onPress={choose}
            disabled={working}
            accessibilityRole="button"
            accessibilityState={{ disabled: working }}
            style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: working ? 0.65 : 1 }]}
          >
            <Feather name="folder" size={19} color={colors.primaryForeground} />
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{source ? 'Choose another audio' : 'Choose audio'}</Text>
          </Pressable>

          {source && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={2}>{source.name}</Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>First screen: select the file. Second screen/state: configure silence removal and generate the saved result.</Text>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>Silence threshold: {settings.thresholdDb} dB</Text>
              <View style={styles.chips}>
                {THRESHOLDS.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => update('thresholdDb', value)}
                    disabled={working}
                    accessibilityRole="button"
                    accessibilityState={{ selected: settings.thresholdDb === value, disabled: working }}
                    accessibilityLabel={`Silence threshold ${value} decibels`}
                    style={[styles.chip, { borderColor: settings.thresholdDb === value ? colors.primary : colors.border, backgroundColor: settings.thresholdDb === value ? colors.secondary : colors.background }]}
                  >
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{value} dB</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>Minimum quiet gap: {settings.minSilenceMs} ms</Text>
              <View style={styles.chips}>
                {MIN_SILENCES.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => update('minSilenceMs', value)}
                    disabled={working}
                    accessibilityRole="button"
                    accessibilityState={{ selected: settings.minSilenceMs === value, disabled: working }}
                    accessibilityLabel={`Minimum quiet gap ${value} milliseconds`}
                    style={[styles.chip, { borderColor: settings.minSilenceMs === value ? colors.primary : colors.border, backgroundColor: settings.minSilenceMs === value ? colors.secondary : colors.background }]}
                  >
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{value} ms</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>Keep around gaps: {settings.paddingMs} ms</Text>
              <View style={styles.chips}>
                {PADDINGS.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => update('paddingMs', value)}
                    disabled={working}
                    accessibilityRole="button"
                    accessibilityState={{ selected: settings.paddingMs === value, disabled: working }}
                    accessibilityLabel={`Keep ${value} milliseconds around quiet gaps`}
                    style={[styles.chip, { borderColor: settings.paddingMs === value ? colors.primary : colors.border, backgroundColor: settings.paddingMs === value ? colors.secondary : colors.background }]}
                  >
                    <Text style={[styles.chipText, { color: colors.foreground }]}>{value} ms</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.actions}>
                {hasCustomSettings && (
                  <Pressable onPress={reset} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.secondaryButton, { borderColor: colors.border }]}>
                    <Feather name="rotate-ccw" size={18} color={colors.foreground} />
                    <Text style={[styles.buttonText, { color: colors.foreground }]}>Reset</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={generate}
                  disabled={working}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: working }}
                  style={[styles.primaryButton, styles.generateButton, { backgroundColor: working ? colors.muted : colors.primary }]}
                >
                  {working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="zap" size={18} color={colors.primaryForeground} />}
                  <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{working ? 'Generating…' : 'Generate'}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!source && (
            <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="volume-x" size={24} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Select audio first</Text>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>The processing controls stay hidden until an audio file is selected, so each step remains focused and reusable.</Text>
            </View>
          )}
        </>
      )}

      {output && (
        <AudioEditorResultPanel
          message={`Silence removed. ${formatTime(output.removedSilenceMs)} removed and the new audio was saved.`}
          outputPath={output.path}
          resultUri={output.uri}
          onClose={() => {
            setOutput(null);
            setSource(null);
            setMessage('Choose an audio file to begin.');
          }}
        />
      )}

      {!output && !!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
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
  generateButton: { flex: 1 },
  secondaryButton: { minHeight: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 16 },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14 },
  sourceTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  hint: { fontSize: 11, lineHeight: 16 },
  label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  chipText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  actions: { flexDirection: 'row', gap: 9, marginTop: 18 },
  emptyCard: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 16, gap: 7 },
  emptyTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  message: { marginTop: 12, fontSize: 11, lineHeight: 16 },
});

import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { createAudioEditorOutputPath, ensureAudioEditorExportFolder } from '@/features/audio-editor/audioEditorExport';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { processReverbDelay, REVERB_DELAY_PRESETS, type ReverbDelayPreset, type ReverbDelayResult } from '@/features/audio-editor/reverbDelayEngine';
import type { AudioEditorSource } from '@/features/audio-editor/types';

export default function ReverbDelayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [preset, setPreset] = useState<ReverbDelayPreset>('small-room');
  const [amount, setAmount] = useState(0.7);
  const [delayMs, setDelayMs] = useState(220);
  const [feedback, setFeedback] = useState(0.35);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('Choose an audio file to begin.');
  const [result, setResult] = useState<ReverbDelayResult | null>(null);

  const reset = useCallback(() => {
    setSource(null);
    setResult(null);
    setPreset('small-room');
    setAmount(0.7);
    setDelayMs(220);
    setFeedback(0.35);
    setMessage('Choose an audio file to begin.');
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

  const choose = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setSource(picked);
    setResult(null);
    setMessage(`${picked.name} selected. Choose a reverb space and delay.');`);
  }, []);

  const generate = useCallback(async () => {
    if (!source || working) return;
    setWorking(true);
    setResult(null);
    setMessage('Applying reverb and delay…');
    try {
      await ensureAudioEditorExportFolder('Reverb & Delay');
      const presetName = REVERB_DELAY_PRESETS.find((item) => item.id === preset)?.name ?? 'Small Room';
      const outputPath = await createAudioEditorOutputPath('Reverb & Delay', source.name, `reverb-${preset}`, 'm4a');
      const processed = await processReverbDelay(source.uri, outputPath, { preset, amount, delayMs, feedback });
      setResult(processed);
      setMessage(`${presetName} reverb and delay applied successfully.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to apply reverb and delay.');
    } finally {
      setWorking(false);
    }
  }, [amount, delayMs, feedback, preset, source, working]);

  if (result) {
    return (
      <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
        <Stack.Screen options={{ title: 'Reverb & Delay' }} />
        <AudioEditorResultPanel message="Reverb & Delay applied and saved." outputPath="Nexus Plus // audio // Reverb & Delay" resultUri={result.outputPath} onClose={reset} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
      <Stack.Screen options={{ title: 'Reverb & Delay' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="radio" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Reverb & Delay</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Add room reverb and controllable echo using native DSP.</Text></View>
      </View>

      {!source ? (
        <View style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Select audio</Text>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>Choose the audio first. The reverb and delay controls appear after selection.</Text>
          <Pressable onPress={choose} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Feather name="folder" size={19} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose audio</Text></Pressable>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Editing</Text>
          <Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={2}>{source.name}</Text>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Room reverb</Text>
          <View style={styles.presetList}>
            {REVERB_DELAY_PRESETS.map((item) => {
              const selected = item.id === preset;
              return <Pressable key={item.id} onPress={() => setPreset(item.id)} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${item.name}. ${item.description}`} style={[styles.preset, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}><View style={styles.presetCopy}><Text style={[styles.presetTitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.presetDescription, { color: colors.mutedForeground }]}>{item.description}</Text></View><View style={[styles.selectionMark, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}>{selected ? <Feather name="check" size={13} color={colors.primaryForeground} /> : null}</View></Pressable>;
            })}
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Reverb amount: {Math.round(amount * 100)}%</Text>
          <View style={styles.chips}>{[0.25, 0.5, 0.7, 0.85, 1].map((value) => <Pressable key={value} onPress={() => setAmount(value)} accessibilityRole="button" accessibilityState={{ selected: amount === value }} style={[styles.chip, { borderColor: amount === value ? colors.primary : colors.border, backgroundColor: amount === value ? colors.secondary : colors.background }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{Math.round(value * 100)}%</Text></Pressable>)}</View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Delay: {delayMs} ms</Text>
          <View style={styles.chips}>{[80, 140, 220, 360, 520].map((value) => <Pressable key={value} onPress={() => setDelayMs(value)} accessibilityRole="button" accessibilityState={{ selected: delayMs === value }} style={[styles.chip, { borderColor: delayMs === value ? colors.primary : colors.border, backgroundColor: delayMs === value ? colors.secondary : colors.background }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{value} ms</Text></Pressable>)}</View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Feedback: {Math.round(feedback * 100)}%</Text>
          <View style={styles.chips}>{[0.15, 0.25, 0.35, 0.5, 0.7].map((value) => <Pressable key={value} onPress={() => setFeedback(value)} accessibilityRole="button" accessibilityState={{ selected: feedback === value }} style={[styles.chip, { borderColor: feedback === value ? colors.primary : colors.border, backgroundColor: feedback === value ? colors.secondary : colors.background }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{Math.round(value * 100)}%</Text></Pressable>)}</View>

          <Pressable disabled={working} onPress={generate} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { marginTop: 16, backgroundColor: working ? colors.muted : colors.primary }]}>{working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="zap" size={18} color={colors.primaryForeground} />}<Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{working ? 'Generating…' : 'Generate'}</Text></Pressable>
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
  sourceCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 9 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  helper: { fontSize: 11, lineHeight: 16, marginBottom: 4 },
  primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 16 },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  card: { borderWidth: 1, borderRadius: 18, padding: 14 },
  sourceTitle: { fontSize: 12, marginTop: 3 },
  label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 14, marginBottom: 8 },
  presetList: { gap: 8 },
  preset: { borderWidth: 1, borderRadius: 14, padding: 12, paddingRight: 42, position: 'relative' },
  presetCopy: { gap: 3 },
  presetTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  presetDescription: { fontSize: 10.5, lineHeight: 15 },
  selectionMark: { position: 'absolute', top: 11, right: 11, width: 22, height: 22, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minWidth: 58, minHeight: 40, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 },
  chipText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  message: { marginTop: 12, fontSize: 11, lineHeight: 16 },
});

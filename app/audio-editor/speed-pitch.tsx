import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { processSpeedAndPitch, type SpeedPitchSettings } from '@/features/audio-editor/speedPitchEngine';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import type { AudioEditorSource } from '@/features/audio-editor/types';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PITCHES = [-8, -6, -4, -2, 0, 2, 4, 6, 8];

export default function SpeedPitchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [output, setOutput] = useState<{ path: string; uri: string } | null>(null);

  const choose = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setSource(picked);
    setOutput(null);
    setMessage(`${picked.name} selected.`);
  }, []);

  const settings = useMemo<SpeedPitchSettings>(() => ({ speed, pitchSemitones: pitch }), [speed, pitch]);

  const process = async () => {
    if (!source) {
      setMessage('Choose an audio file first.');
      return;
    }
    setWorking(true);
    setOutput(null);
    setMessage('Processing speed and pitch independently…');
    try {
      const outputPath = await createAudioEditorOutputPath('Speed and Pitch', source.name, 'processed', 'm4a');
      const result = await processSpeedAndPitch(source.uri, outputPath, settings);
      setOutput({ path: result.outputPath, uri: `file://${result.outputPath}` });
      setMessage(`Done. Speed ${result.speed}× • Pitch ${result.pitchSemitones >= 0 ? '+' : ''}${result.pitchSemitones} semitones.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to process this audio.');
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    setSpeed(1);
    setPitch(0);
    setOutput(null);
    setMessage('Speed and pitch reset to original values.');
  };

  useEffect(() => () => setOutput(null), []);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
      <Stack.Screen options={{ title: 'Speed & Pitch' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="sliders" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Speed & Pitch</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Change playback speed and pitch independently, then export a real processed audio file.</Text>
        </View>
      </View>

      <Pressable onPress={choose} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
        <Feather name="folder" size={19} color={colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{source ? 'Choose another audio' : 'Choose audio'}</Text>
      </Pressable>

      {source && <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={2}>{source.name}</Text>
        <Text style={[styles.value, { color: colors.mutedForeground }]}>Speed: {speed.toFixed(2)}×</Text>
        <View style={styles.chips}>{SPEEDS.map((value) => <Pressable key={value} onPress={() => setSpeed(value)} accessibilityRole="button" accessibilityState={{ selected: speed === value }} style={[styles.chip, { borderColor: speed === value ? colors.primary : colors.border, backgroundColor: speed === value ? colors.secondary : colors.background }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{value}×</Text></Pressable>)}</View>

        <Text style={[styles.value, { color: colors.mutedForeground }]}>Pitch: {pitch >= 0 ? '+' : ''}{pitch} semitones</Text>
        <View style={styles.chips}>{PITCHES.map((value) => <Pressable key={value} onPress={() => setPitch(value)} accessibilityRole="button" accessibilityState={{ selected: pitch === value }} style={[styles.chip, { borderColor: pitch === value ? colors.primary : colors.border, backgroundColor: pitch === value ? colors.secondary : colors.background }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{value > 0 ? `+${value}` : value}</Text></Pressable>)}</View>

        <View style={styles.actions}>
          <Pressable onPress={reset} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="rotate-ccw" size={18} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Reset</Text></Pressable>
          <Pressable disabled={working} onPress={process} accessibilityRole="button" style={[styles.primaryButton, { flex: 1, backgroundColor: working ? colors.muted : colors.primary }]}>{working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="check" size={18} color={colors.primaryForeground} />}<Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{working ? 'Processing…' : 'Apply'}</Text></Pressable>
        </View>
      </View>}

      {output && <AudioEditorResultPanel message="Speed & Pitch export complete." outputPath={output.path} resultUri={output.uri} onClose={() => setOutput(null)} />}
      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 14 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 11.5, lineHeight: 17 }, primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 16 }, secondaryButton: { minHeight: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 16 }, buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14 }, sourceTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 10 }, value: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 9, marginBottom: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minWidth: 48, minHeight: 40, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, chipText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' }, actions: { flexDirection: 'row', gap: 9, marginTop: 16 }, message: { marginTop: 12, fontSize: 11, lineHeight: 16 },
});

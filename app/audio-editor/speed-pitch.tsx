import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
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
  const [message, setMessage] = useState('Choose an audio file to begin.');
  const [output, setOutput] = useState<{ path: string; uri: string } | null>(null);

  const choose = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setSource(picked);
    setOutput(null);
    setMessage(`${picked.name} selected. Speed & Pitch controls are ready.`);
  }, []);

  const reset = useCallback(() => {
    setSource(null);
    setSpeed(1);
    setPitch(0);
    setOutput(null);
    setMessage('Choose an audio file to begin.');
  }, []);

  const settings: SpeedPitchSettings = { speed, pitchSemitones: pitch };

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

  if (output) {
    return (
      <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
        <Stack.Screen options={{ title: 'Speed & Pitch' }} />
        <AudioEditorResultPanel message="Speed & Pitch export complete." outputPath={output.path} resultUri={output.uri} onClose={reset} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
      <Stack.Screen options={{ title: 'Speed & Pitch' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="sliders" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Speed & Pitch</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Select audio first, then independently control speed and pitch.</Text></View>
      </View>

      {!source ? (
        <View style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Select audio</Text>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>The editing controls appear after an audio file is selected.</Text>
          <Pressable onPress={choose} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
            <Feather name="folder" size={19} color={colors.primaryForeground} />
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose audio</Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sourceHeader}>
            <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Audio editor</Text><Text style={[styles.sourceTitle, { color: colors.foreground }]} numberOfLines={2}>{source.name}</Text></View>
            <Pressable onPress={choose} accessibilityRole="button" accessibilityLabel="Choose a different audio file" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="refresh-cw" size={17} color={colors.foreground} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Change</Text></Pressable>
          </View>

          <Text style={[styles.value, { color: colors.mutedForeground }]}>Speed: {speed.toFixed(2)}×</Text>
          <View style={styles.chips}>{SPEEDS.map((value) => <Pressable key={value} onPress={() => setSpeed(value)} accessibilityRole="button" accessibilityState={{ selected: speed === value }} style={[styles.chip, { borderColor: speed === value ? colors.primary : colors.border, backgroundColor: speed === value ? colors.secondary : colors.background }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{value}×</Text></Pressable>)}</View>

          <Text style={[styles.value, { color: colors.mutedForeground }]}>Pitch: {pitch >= 0 ? '+' : ''}{pitch} semitones</Text>
          <View style={styles.chips}>{PITCHES.map((value) => <Pressable key={value} onPress={() => setPitch(value)} accessibilityRole="button" accessibilityState={{ selected: pitch === value }} style={[styles.chip, { borderColor: pitch === value ? colors.primary : colors.border, backgroundColor: pitch === value ? colors.secondary : colors.background }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{value > 0 ? `+${value}` : value}</Text></Pressable>)}</View>

          <View style={styles.actions}>
            <Pressable onPress={reset} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="rotate-ccw" size={18} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Reset</Text></Pressable>
            <Pressable disabled={working} onPress={process} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { flex: 1, backgroundColor: working ? colors.muted : colors.primary }]}>{working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="zap" size={18} color={colors.primaryForeground} />}<Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{working ? 'Generating…' : 'Generate'}</Text></Pressable>
          </View>
        </View>
      )}

      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 14 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 11.5, lineHeight: 17 }, sourceCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 9 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, helper: { fontSize: 11, lineHeight: 16, marginBottom: 4 }, card: { borderWidth: 1, borderRadius: 18, padding: 14 }, sourceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, secondaryButton: { minHeight: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, paddingHorizontal: 11 }, secondaryText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' }, primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 16 }, buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, sourceTitle: { fontSize: 12, marginTop: 3 }, value: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 9, marginBottom: 8 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minWidth: 48, minHeight: 40, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, chipText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' }, actions: { flexDirection: 'row', gap: 9, marginTop: 16 }, message: { marginTop: 12, fontSize: 11, lineHeight: 16 },
});
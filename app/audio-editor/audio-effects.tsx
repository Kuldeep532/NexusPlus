import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { AUDIO_EFFECTS, processAudioEffect, type AudioEffectId } from '@/features/audio-editor/audioEffectsEngine';
import type { AudioEditorSource } from '@/features/audio-editor/types';

export default function AudioEffectsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [effect, setEffect] = useState<AudioEffectId>('bass-boost');
  const [amount, setAmount] = useState(0.7);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('Choose an audio file to begin.');
  const [output, setOutput] = useState<{ path: string; uri: string } | null>(null);

  const choose = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setSource(picked);
    setOutput(null);
    setMessage(`${picked.name} selected. Audio effects are ready.`);
  }, []);

  const reset = useCallback(() => {
    setSource(null);
    setOutput(null);
    setMessage('Choose an audio file to begin.');
  }, []);

  const generate = async () => {
    if (!source) {
      setMessage('Choose an audio file first.');
      return;
    }
    setWorking(true);
    setOutput(null);
    setMessage('Applying audio effect…');
    try {
      const outputPath = await createAudioEditorOutputPath('Audio Effects', source.name, effect, 'm4a');
      const result = await processAudioEffect(source.uri, outputPath, { id: effect, amount });
      setOutput({ path: result.outputPath, uri: `file://${result.outputPath}` });
      setMessage('Effect applied and audio saved locally.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to apply the audio effect.');
    } finally {
      setWorking(false);
    }
  };

  if (output) {
    return (
      <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
        <Stack.Screen options={{ title: 'Audio Effects' }} />
        <AudioEditorResultPanel message="Audio effect generated and saved." outputPath={output.path} resultUri={output.uri} onClose={reset} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
      <Stack.Screen options={{ title: 'Audio Effects' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="sliders" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Effects</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Apply native DSP effects without bundled sound assets.</Text></View>
      </View>

      {!source ? (
        <View style={[styles.sourceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Select audio</Text>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>Choose the audio first. The effect controls open after selection.</Text>
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

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Select effect</Text>
          <View style={styles.effects}>{AUDIO_EFFECTS.map((item) => <Pressable key={item.id} onPress={() => setEffect(item.id)} accessibilityRole="button" accessibilityState={{ selected: effect === item.id }} style={[styles.effectChip, { borderColor: effect === item.id ? colors.primary : colors.border, backgroundColor: effect === item.id ? colors.secondary : colors.background }]}><Text style={[styles.effectName, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.effectDescription, { color: colors.mutedForeground }]}>{item.description}</Text></Pressable>)}</View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>Intensity: {Math.round(amount * 100)}%</Text>
          <View style={styles.intensityRow}>{[0.25, 0.5, 0.7, 0.85, 1].map((value) => <Pressable key={value} onPress={() => setAmount(value)} accessibilityRole="button" accessibilityState={{ selected: amount === value }} style={[styles.intensity, { borderColor: amount === value ? colors.primary : colors.border, backgroundColor: amount === value ? colors.secondary : colors.background }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{Math.round(value * 100)}%</Text></Pressable>)}</View>

          <Pressable disabled={working} onPress={generate} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { marginTop: 16, backgroundColor: working ? colors.muted : colors.primary }]}>
            {working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="zap" size={18} color={colors.primaryForeground} />}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{working ? 'Generating…' : 'Generate'}</Text>
          </Pressable>
        </View>
      )}

      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 14 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 11.5, lineHeight: 17 }, sourceCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 9 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, helper: { fontSize: 11, lineHeight: 16, marginBottom: 4 }, sourceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 }, primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 16 }, secondaryButton: { minHeight: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, paddingHorizontal: 11 }, secondaryText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' }, buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, card: { borderWidth: 1, borderRadius: 18, padding: 14 }, sourceTitle: { fontSize: 12, marginTop: 3 }, label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 14, marginBottom: 8 }, effects: { gap: 8 }, effectChip: { borderWidth: 1, borderRadius: 14, padding: 11 }, effectName: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, effectDescription: { fontSize: 10.5, lineHeight: 15, marginTop: 3 }, intensityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, intensity: { minWidth: 58, minHeight: 40, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, chipText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' }, message: { marginTop: 12, fontSize: 11, lineHeight: 16 },
});
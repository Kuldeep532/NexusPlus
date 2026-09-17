import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { manipulateChannels, type ChannelMode } from '@/features/audio-editor/channelManipulation';
import type { AudioEditorSource } from '@/features/audio-editor/types';

const MODES: Array<{ id: ChannelMode; title: string; description: string }> = [
  { id: 'mono', title: 'Mono', description: 'Downmix all channels to one balanced channel.' },
  { id: 'stereo', title: 'Stereo', description: 'Create stereo from mono or keep the first two channels.' },
  { id: 'swap', title: 'Swap L/R', description: 'Exchange the left and right stereo channels.' },
  { id: 'left', title: 'Left Only', description: 'Export the left channel as mono.' },
  { id: 'right', title: 'Right Only', description: 'Export the right channel as mono.' },
];

export default function ChannelManipulationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [source, setSource] = useState<AudioEditorSource | null>(null);
  const [mode, setMode] = useState<ChannelMode>('mono');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('Choose audio to manipulate its channels.');
  const [output, setOutput] = useState<{ path: string; uri: string } | null>(null);

  const choose = useCallback(async () => {
    if (working) return;
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setSource(picked);
    setOutput(null);
    setMessage(`${picked.name} selected. Choose a channel operation.`);
  }, [working]);

  const process = useCallback(async () => {
    if (!source || working) return;
    setWorking(true);
    setOutput(null);
    setMessage('Manipulating channels and exporting a new audio copy…');
    try {
      const outputPath = await createAudioEditorOutputPath('Channel Manipulation', source.name, mode, 'm4a');
      const result = await manipulateChannels(source.uri, outputPath, mode);
      setOutput({ path: result.outputPath, uri: `file://${result.outputPath}` });
      setMessage(`${MODES.find((item) => item.id === mode)?.title ?? mode} export complete.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to manipulate the selected channels.');
    } finally {
      setWorking(false);
    }
  }, [mode, source, working]);

  const reset = useCallback(() => {
    setSource(null);
    setOutput(null);
    setMode('mono');
    setMessage('Choose audio to manipulate its channels.');
  }, []);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 34 }}>
      <Stack.Screen options={{ title: 'Channel Manipulation' }} />
      <View style={styles.headerRow}><View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="columns" size={24} color={colors.primary} /></View><View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Channel Manipulation</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Convert, isolate or swap audio channels while keeping the original file unchanged.</Text></View></View>

      {output ? <AudioEditorResultPanel message="Channel Manipulation export complete." outputPath={output.path} resultUri={output.uri} onClose={reset} /> : <>
        <Pressable onPress={choose} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: working ? 0.65 : 1 }]}><Feather name="folder" size={19} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{source ? 'Choose Different Audio' : 'Choose Audio'}</Text></Pressable>

        {source && <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.source, { color: colors.foreground }]} numberOfLines={2}>{source.name}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Select an operation below.</Text>
          <View style={styles.modeList}>{MODES.map((item) => <Pressable key={item.id} onPress={() => setMode(item.id)} accessibilityRole="button" accessibilityState={{ selected: mode === item.id }} style={[styles.mode, { borderColor: mode === item.id ? colors.primary : colors.border, backgroundColor: mode === item.id ? colors.secondary : colors.background }]}><View style={styles.modeCopy}><Text style={[styles.modeTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.description}</Text></View>{mode === item.id && <Feather name="check-circle" size={19} color={colors.primary} />}</Pressable>)}</View>
          <Pressable onPress={process} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { backgroundColor: working ? colors.muted : colors.primary }]}>{working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="sliders" size={19} color={colors.primaryForeground} />}<Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{working ? 'Processing…' : 'Generate Copy'}</Text></Pressable>
        </View>}
      </>}
      <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
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
  card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  source: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 10.5, lineHeight: 15 },
  modeList: { gap: 8 },
  mode: { minHeight: 62, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modeCopy: { flex: 1 },
  modeTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  message: { marginTop: 12, fontSize: 11, lineHeight: 16 },
});

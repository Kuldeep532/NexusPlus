import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AudioModule, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { createKaraokeOutputPath, startKaraokeRecording, stopKaraokeRecording, cancelKaraokeRecording } from '@/features/audio-editor/karaokeEngine';

type Preset = 'podcast' | 'video' | 'music' | 'broadcast';

const PRESETS: Record<Preset, { label: string; voiceGain: number; bedGain: number }> = {
  podcast: { label: 'Podcast', voiceGain: 1.15, bedGain: 0.24 },
  video: { label: 'Video', voiceGain: 1.1, bedGain: 0.3 },
  music: { label: 'Music', voiceGain: 1.05, bedGain: 0.38 },
  broadcast: { label: 'Broadcast', voiceGain: 1.2, bedGain: 0.2 },
};

export default function VoiceOverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [background, setBackground] = useState<{ uri: string; name: string } | null>(null);
  const [preset, setPreset] = useState<Preset>('podcast');
  const [voiceGain, setVoiceGain] = useState(PRESETS.podcast.voiceGain);
  const [bedGain, setBedGain] = useState(PRESETS.podcast.bedGain);
  const [recording, setRecording] = useState(false);
  const [working, setWorking] = useState(false);
  const [output, setOutput] = useState<{ path: string; uri: string } | null>(null);
  const [message, setMessage] = useState('Choose background audio, then record your voice-over.');
  const recordingRef = useRef(false);
  const player = useAudioPlayer(background?.uri ?? null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);

  const chooseBackground = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    player.pause();
    await cancelKaraokeRecording();
    setBackground({ uri: picked.uri, name: picked.name });
    setOutput(null);
    setRecording(false);
    recordingRef.current = false;
    setMessage(`${picked.name} loaded.`);
  }, [player]);

  const applyPreset = useCallback((next: Preset) => {
    setPreset(next);
    setVoiceGain(PRESETS[next].voiceGain);
    setBedGain(PRESETS[next].bedGain);
  }, []);

  const start = useCallback(async () => {
    if (!background || recordingRef.current || working) return;
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setMessage('Microphone permission is required for Voice Over recording.');
        return;
      }
      setWorking(true);
      const outputPath = await createKaraokeOutputPath(`Voice Over - ${background.name}`);
      await startKaraokeRecording(background.uri, outputPath, true, false, 48_000, 1);
      recordingRef.current = true;
      setRecording(true);
      setOutput(null);
      player.seekTo(0);
      player.play();
      setMessage(`Recording Voice Over over ${background.name}.`);
    } catch (error) {
      recordingRef.current = false;
      setRecording(false);
      await cancelKaraokeRecording();
      setMessage(error instanceof Error ? error.message : 'Unable to start Voice Over recording.');
    } finally {
      setWorking(false);
    }
  }, [background, player, working]);

  const finish = useCallback(async () => {
    if (!recordingRef.current) return;
    recordingRef.current = false;
    player.pause();
    setRecording(false);
    setWorking(true);
    try {
      const result = await stopKaraokeRecording();
      setOutput({ path: result.outputPath, uri: `file://${result.outputPath}` });
      setMessage('Voice Over recording finished.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to finish Voice Over recording.');
    } finally {
      setWorking(false);
    }
  }, [player]);

  useEffect(() => () => {
    recordingRef.current = false;
    player.pause();
    void cancelKaraokeRecording();
  }, [player]);

  const progress = useMemo(() => {
    if (!status.duration || !status.currentTime) return 0;
    return Math.max(0, Math.min(1, status.currentTime / status.duration));
  }, [status.currentTime, status.duration]);

  return (
    <>
      <Stack.Screen options={{ title: 'Voice Over' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Voice Over</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Blend a voice track over background audio with professional presets.</Text>

        <Pressable onPress={chooseBackground} disabled={recording || working} accessibilityRole="button" accessibilityState={{ disabled: recording || working }} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Feather name="music" size={18} color={colors.primaryForeground} />
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose Background Audio</Text>
        </Pressable>

        {background && <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.trackTitle, { color: colors.foreground }]}>{background.name}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Voice Over mix uses the selected professional preset.</Text>

          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Preset</Text>
          <View style={styles.presetGrid}>
            {(Object.keys(PRESETS) as Preset[]).map((key) => (
              <Pressable key={key} onPress={() => applyPreset(key)} disabled={recording || working} accessibilityRole="button" accessibilityState={{ selected: preset === key, disabled: recording || working }} style={[styles.presetButton, { borderColor: preset === key ? colors.primary : colors.border, backgroundColor: preset === key ? colors.secondary : colors.background }]}>
                <Text style={[styles.presetText, { color: colors.foreground }]}>{PRESETS[key].label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.levelRow, { borderColor: colors.border }]}>
            <Text style={[styles.levelLabel, { color: colors.foreground }]}>Voice level</Text>
            <Text style={[styles.levelValue, { color: colors.mutedForeground }]}>{voiceGain.toFixed(2)}×</Text>
          </View>
          <View style={[styles.levelRow, { borderColor: colors.border }]}>
            <Text style={[styles.levelLabel, { color: colors.foreground }]}>Background level</Text>
            <Text style={[styles.levelValue, { color: colors.mutedForeground }]}>{bedGain.toFixed(2)}×</Text>
          </View>

          <View style={[styles.progress, { backgroundColor: colors.border }]} accessibilityLabel={`Background playback ${(progress * 100).toFixed(0)} percent`}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
          </View>

          {!recording ? (
            <Pressable onPress={start} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.actionButton, { backgroundColor: colors.primary }]}>
              {working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="mic" size={18} color={colors.primaryForeground} />}
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Start Voice Over</Text>
            </Pressable>
          ) : (
            <Pressable onPress={finish} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.actionButton, { backgroundColor: colors.destructive }]}>
              {working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="square" size={18} color={colors.primaryForeground} />}
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Finish Voice Over</Text>
            </Pressable>
          )}

          <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
        </View>}

        {output && <AudioEditorResultPanel title="Voice Over Output" filePath={output.path} uri={output.uri} />}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 14 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 16, lineHeight: 23 },
  primaryButton: { minHeight: 52, borderRadius: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  actionButton: { minHeight: 52, borderRadius: 14, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  trackTitle: { fontSize: 20, fontWeight: '700' },
  meta: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 4 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetButton: { borderWidth: 1, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, minWidth: '47%' },
  presetText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  levelRow: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between' },
  levelLabel: { fontSize: 15, fontWeight: '600' },
  levelValue: { fontSize: 15 },
  progress: { height: 8, borderRadius: 8, overflow: 'hidden', marginTop: 2 },
  progressFill: { height: '100%' },
  message: { fontSize: 14, lineHeight: 20 },
});

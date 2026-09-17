import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, AudioModule } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { AudioEditorTransport } from '@/features/audio-editor/AudioEditorTransport';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { mixAudioProject } from '@/features/audio-editor/audioMixProcessing';
import { createAudioMixTrack, type AudioMixTrack } from '@/features/audio-editor/audioMixTypes';
import { assertAudioEditorNative } from '@/modules/audio-editor-native';

const PRESETS = {
  Podcast: { voice: 1.15, background: 0.22 },
  Video: { voice: 1.1, background: 0.3 },
  Music: { voice: 1, background: 0.45 },
  Broadcast: { voice: 1.2, background: 0.18 },
} as const;
type Preset = keyof typeof PRESETS;

function clamp(value: number, min = 0, max = 2) { return Math.max(min, Math.min(max, value)); }
function formatTime(ms: number) { const total = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`; }

export default function VoiceOverScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [background, setBackground] = useState<AudioMixTrack | null>(null);
  const [preset, setPreset] = useState<Preset>('Podcast');
  const [voiceGain, setVoiceGain] = useState(PRESETS.Podcast.voice);
  const [backgroundGain, setBackgroundGain] = useState(PRESETS.Podcast.background);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('Choose background audio to begin.');
  const [output, setOutput] = useState<{ path: string; uri: string } | null>(null);
  const [recordedVoice, setRecordedVoice] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const recordingRef = useRef(false);
  const pausedRef = useRef(false);
  const finishingRef = useRef(false);
  const player = useAudioPlayer(background?.source.uri ?? null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const elapsedMs = useMemo(() => startedAt > 0 ? Math.max(0, status.currentTime * 1000 - startedAt) : 0, [startedAt, status.currentTime]);

  const applyPreset = useCallback((next: Preset) => {
    setPreset(next);
    setVoiceGain(PRESETS[next].voice);
    setBackgroundGain(PRESETS[next].background);
    setMessage(`${next} preset selected.`);
  }, []);

  const chooseBackground = useCallback(async () => {
    if (working || recording) return;
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setWorking(true);
    try {
      const metadata = await assertAudioEditorNative().probe(picked.uri);
      player.pause();
      await assertAudioEditorNative().cancelKaraokeRecording().catch(() => undefined);
      setBackground(createAudioMixTrack({ ...picked, durationMs: metadata.durationMs }, 0));
      setOutput(null);
      setRecordedVoice(null);
      setStartedAt(0);
      recordingRef.current = false;
      pausedRef.current = false;
      finishingRef.current = false;
      setRecording(false);
      setPaused(false);
      setMessage(`${picked.name} loaded as background audio.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to inspect the background audio.');
    } finally {
      setWorking(false);
    }
  }, [player, recording, working]);

  useEffect(() => () => {
    player.pause();
    void assertAudioEditorNative().cancelKaraokeRecording().catch(() => undefined);
  }, [player]);

  const startRecording = useCallback(async () => {
    if (!background || working || recordingRef.current || finishingRef.current) return;
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setMessage('Microphone permission is required for Voice Over recording.');
        return;
      }
      setWorking(true);
      await assertAudioEditorNative().cancelKaraokeRecording().catch(() => undefined);
      const path = await createAudioEditorOutputPath('Voice Over Recordings', background.source.name, 'voice', 'm4a');
      await assertAudioEditorNative().startKaraokeRecording(background.source.uri, path, true, true, 48_000, 1);
      recordingRef.current = true;
      pausedRef.current = false;
      finishingRef.current = false;
      setOutput(null);
      setRecordedVoice(null);
      setStartedAt(0);
      setRecording(true);
      setPaused(false);
      player.seekTo(0);
      player.play();
      setMessage('Voice Over recording started.');
    } catch (error) {
      recordingRef.current = false;
      pausedRef.current = false;
      setRecording(false);
      setPaused(false);
      await assertAudioEditorNative().cancelKaraokeRecording().catch(() => undefined);
      setMessage(error instanceof Error ? error.message : 'Unable to start Voice Over recording.');
    } finally {
      setWorking(false);
    }
  }, [background, player, recording, working]);

  useEffect(() => {
    if (recordingRef.current && startedAt === 0 && status.playing) {
      setStartedAt(status.currentTime * 1000);
    }
  }, [startedAt, status.currentTime, status.playing]);

  useEffect(() => {
    if (!background || !recordingRef.current || pausedRef.current || !status.playing || background.source.durationMs <= 0) return;
    if (status.currentTime * 1000 < Math.max(0, background.source.durationMs - 250)) return;
    void finishRecording('track-end');
  }, [background, status.currentTime, status.playing]);

  const togglePause = useCallback(async () => {
    if (!recordingRef.current || working || finishingRef.current) return;
    setWorking(true);
    try {
      if (pausedRef.current) {
        await assertAudioEditorNative().resumeKaraokeRecording();
        player.play();
        pausedRef.current = false;
        setPaused(false);
        setMessage('Voice Over recording resumed.');
      } else {
        await assertAudioEditorNative().pauseKaraokeRecording();
        player.pause();
        pausedRef.current = true;
        setPaused(true);
        setMessage('Voice Over recording paused.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to change recording state.');
    } finally {
      setWorking(false);
    }
  }, [player, working]);

  const finishRecording = useCallback(async (reason: 'manual' | 'track-end' = 'manual') => {
    if (finishingRef.current || !recordingRef.current) return;
    finishingRef.current = true;
    recordingRef.current = false;
    pausedRef.current = false;
    player.pause();
    setRecording(false);
    setPaused(false);
    setWorking(true);
    try {
      const result = await assertAudioEditorNative().stopKaraokeRecording();
      setRecordedVoice(result.outputPath);
      if (!background) throw new Error('Background audio is no longer selected.');
      const backgroundTrack = { ...background, volume: backgroundGain };
      const voiceTrack = {
        ...createAudioMixTrack({
          id: `voice:${result.outputPath}`,
          uri: result.outputPath,
          name: 'Voice Track',
          durationMs: result.durationMs,
          mimeType: result.mimeType,
          source: 'document',
        }, 1),
        volume: voiceGain,
        startMs: 0,
        muted: false,
      };
      const outputPath = await createAudioEditorOutputPath('Voice Over Exports', background.source.name, 'voice-over', 'wav');
      const mixed = await mixAudioProject({ base: backgroundTrack, overlays: [voiceTrack] }, outputPath);
      setOutput({ path: mixed.outputPath, uri: `file://${mixed.outputPath}` });
      setMessage(reason === 'track-end' ? 'Voice Over finished automatically and the mix was saved.' : 'Voice Over mix saved.');
    } catch (error) {
      await assertAudioEditorNative().cancelKaraokeRecording().catch(() => undefined);
      setMessage(error instanceof Error ? error.message : 'Unable to finish Voice Over recording.');
    } finally {
      finishingRef.current = false;
      setWorking(false);
    }
  }, [background, backgroundGain, player, voiceGain]);

  const reset = useCallback(async () => {
    player.pause();
    await assertAudioEditorNative().cancelKaraokeRecording().catch(() => undefined);
    recordingRef.current = false;
    pausedRef.current = false;
    finishingRef.current = false;
    setBackground(null);
    setRecordedVoice(null);
    setOutput(null);
    setRecording(false);
    setPaused(false);
    setWorking(false);
    setStartedAt(0);
    setMessage('Choose background audio to begin.');
  }, [player]);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}>
      <Stack.Screen options={{ title: 'Voice Over' }} />
      <View style={styles.header}><View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="mic" size={24} color={colors.primary} /></View><View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Voice Over</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Record narration over background audio with reusable professional presets.</Text></View></View>
      <Pressable onPress={chooseBackground} disabled={working || recording} accessibilityRole="button" accessibilityState={{ disabled: working || recording }} style={[styles.primary, { backgroundColor: colors.primary }]}><Feather name="folder" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose Background Audio</Text></Pressable>
      {background && !output && <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.name, { color: colors.foreground }]}>{background.source.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{formatTime(background.source.durationMs)} background track</Text>
        {!recording && <><Text accessibilityRole="header" style={[styles.section, { color: colors.foreground }]}>Preset</Text><View style={styles.row}>{(Object.keys(PRESETS) as Preset[]).map((item) => <Pressable key={item} onPress={() => applyPreset(item)} accessibilityRole="button" accessibilityState={{ selected: preset === item }} style={[styles.chip, { borderColor: preset === item ? colors.primary : colors.border, backgroundColor: preset === item ? colors.secondary : colors.background }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{item}</Text></Pressable>)}</View>
          <Text style={[styles.section, { color: colors.foreground }]}>Voice gain {Math.round(voiceGain * 100)}%</Text><View style={styles.row}><Pressable onPress={() => setVoiceGain((v) => clamp(v - 0.1))} accessibilityRole="button" accessibilityLabel="Decrease voice gain by 10 percent" style={[styles.small, { borderColor: colors.border }]}><Text style={[styles.smallText, { color: colors.foreground }]}>−10%</Text></Pressable><Pressable onPress={() => setVoiceGain((v) => clamp(v + 0.1))} accessibilityRole="button" accessibilityLabel="Increase voice gain by 10 percent" style={[styles.small, { borderColor: colors.border }]}><Text style={[styles.smallText, { color: colors.foreground }]}>+10%</Text></Pressable></View>
          <Text style={[styles.section, { color: colors.foreground }]}>Background gain {Math.round(backgroundGain * 100)}%</Text><View style={styles.row}><Pressable onPress={() => setBackgroundGain((v) => clamp(v - 0.1))} accessibilityRole="button" accessibilityLabel="Decrease background gain by 10 percent" style={[styles.small, { borderColor: colors.border }]}><Text style={[styles.smallText, { color: colors.foreground }]}>−10%</Text></Pressable><Pressable onPress={() => setBackgroundGain((v) => clamp(v + 0.1))} accessibilityRole="button" accessibilityLabel="Increase background gain by 10 percent" style={[styles.small, { borderColor: colors.border }]}><Text style={[styles.smallText, { color: colors.foreground }]}>+10%</Text></Pressable></View>
        </>}
        <Text style={[styles.progress, { color: colors.mutedForeground }]}>{formatTime(status.currentTime * 1000)} / {formatTime(background.source.durationMs)}</Text>
        <AudioEditorTransport active={recording} paused={paused} recording working={working} onStart={startRecording} onTogglePause={togglePause} onFinish={() => void finishRecording('manual')} startLabel="Start Recording" />
        {recording && <Text accessibilityLiveRegion="polite" style={[styles.live, { color: colors.primary }]}>{paused ? 'Voice Over recording paused' : `Recording Voice Over • ${formatTime(elapsedMs)}`}</Text>}
      </View>}
      {output && <AudioEditorResultPanel outputPath={output.path} resultUri={output.uri} message="Voice Over mix saved locally." onClose={() => void reset()} />}
      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
      {working && <ActivityIndicator accessibilityLabel="Voice Over processing" style={{ marginTop: 12 }} color={colors.primary} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:{flex:1}, header:{flexDirection:'row',alignItems:'center',marginBottom:20}, heroIcon:{width:54,height:54,borderRadius:16,alignItems:'center',justifyContent:'center'}, headerCopy:{flex:1,marginLeft:14}, title:{fontSize:27,fontFamily:'Inter_700Bold',marginBottom:5}, subtitle:{fontSize:11.5,lineHeight:17}, primary:{minHeight:52,borderRadius:16,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:9,paddingHorizontal:16}, buttonText:{fontSize:13,fontFamily:'Inter_700Bold'}, card:{marginTop:16,borderWidth:1,borderRadius:18,padding:14,gap:10}, name:{fontSize:15,fontFamily:'Inter_700Bold'}, meta:{fontSize:10.5,lineHeight:15}, section:{fontSize:13.5,fontFamily:'Inter_700Bold',marginTop:4}, row:{flexDirection:'row',gap:8,flexWrap:'wrap'}, chip:{minHeight:40,borderWidth:1,borderRadius:12,paddingHorizontal:13,alignItems:'center',justifyContent:'center'}, chipText:{fontSize:11.5,fontFamily:'Inter_700Bold'}, small:{minHeight:42,minWidth:78,borderWidth:1,borderRadius:12,alignItems:'center',justifyContent:'center'}, smallText:{fontSize:11,fontFamily:'Inter_700Bold'}, progress:{fontSize:11,textAlign:'center'}, live:{fontSize:11.5,textAlign:'center'}, message:{fontSize:11.5,lineHeight:17,marginTop:12}
});
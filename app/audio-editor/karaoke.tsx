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
import { createKaraokeOutputPath, inspectKaraokeTrack, startKaraokeRecording, pauseKaraokeRecording, resumeKaraokeRecording, stopKaraokeRecording, cancelKaraokeRecording } from '@/features/audio-editor/karaokeEngine';
import { findActiveLyric } from '@/features/audio-editor/karaokeLyrics';
import type { KaraokeLyricsLine, KaraokeTrack } from '@/features/audio-editor/karaokeTypes';

export default function KaraokeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [track, setTrack] = useState<KaraokeTrack | null>(null);
  const [lyrics, setLyrics] = useState<KaraokeLyricsLine[]>([]);
  const [position, setPosition] = useState(0);
  const [mode, setMode] = useState<'listen-only' | 'record-vocal'>('listen-only');
  const [headphones, setHeadphones] = useState(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [singing, setSinging] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('Choose a karaoke track to begin.');
  const [output, setOutput] = useState<{ path: string; uri: string } | null>(null);
  const startedRef = useRef(false);
  const recordingRef = useRef(false);
  const pausedRef = useRef(false);
  const player = useAudioPlayer(track?.uri ?? null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => setPosition(status.currentTime * 1000), [status.currentTime]);
  useEffect(() => { if (track) setLyrics(track.lyrics ?? []); }, [track]);
  useEffect(() => {
    const durationMs = track?.durationMs ?? 0;
    if (!track || !startedRef.current || pausedRef.current || !status.playing || durationMs <= 0) return;
    if (status.currentTime * 1000 < Math.max(0, durationMs - 250)) return;
    startedRef.current = false;
    player.pause();
    if (!recordingRef.current) {
      setSinging(false);
      setMessage('Karaoke finished.');
      return;
    }
    recordingRef.current = false;
    setRecording(false);
    setPaused(false);
    pausedRef.current = false;
    setWorking(true);
    void stopKaraokeRecording().then((result) => {
      setOutput({ path: result.outputPath, uri: `file://${result.outputPath}` });
      setMessage('Song finished. Vocal recording stopped and saved.');
    }).catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to finish the vocal recording.')).finally(() => setWorking(false));
  }, [player, status.currentTime, status.playing, track]);
  useEffect(() => () => { startedRef.current = false; recordingRef.current = false; pausedRef.current = false; void cancelKaraokeRecording(); }, []);

  const activeLyric = useMemo(() => findActiveLyric(lyrics, position), [lyrics, position]);
  const resetSession = useCallback(async () => {
    startedRef.current = false; recordingRef.current = false; pausedRef.current = false; player.pause(); await cancelKaraokeRecording();
    setTrack(null); setLyrics([]); setOutput(null); setRecording(false); setPaused(false); setSinging(false); setPosition(0); setMessage('Choose a karaoke track to begin.');
  }, [player]);

  const chooseTrack = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setWorking(true);
    try {
      await cancelKaraokeRecording(); player.pause();
      const inspected = await inspectKaraokeTrack({ uri: picked.uri, name: picked.name, durationMs: picked.durationMs ?? 0 });
      startedRef.current = false; recordingRef.current = false; pausedRef.current = false;
      setRecording(false); setPaused(false); setSinging(false); setTrack(inspected); setPosition(0); setLyrics(inspected.lyrics ?? []); setOutput(null);
      setMessage(`${inspected.name} loaded. Choose Sing or Sing + Record.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load this karaoke track.');
    } finally { setWorking(false); }
  }, [player]);

  const startSinging = useCallback(async (record = false) => {
    if (!track || working || startedRef.current) return;
    try {
      setOutput(null); player.seekTo(0);
      if (record) {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) { setMessage('Microphone permission is required for vocal recording.'); return; }
        setWorking(true);
        const path = await createKaraokeOutputPath(track.name);
        await startKaraokeRecording(track.uri, path, true, headphones, 48_000, 1);
        recordingRef.current = true; setRecording(true); setWorking(false);
      }
      player.play(); startedRef.current = true; pausedRef.current = false; setPaused(false); setSinging(true); setPosition(0);
      setMessage(record ? 'Karaoke started. Vocal recording is synchronized.' : 'Karaoke playback started.');
    } catch (error) {
      setWorking(false); startedRef.current = false; recordingRef.current = false; setRecording(false); setSinging(false); await cancelKaraokeRecording();
      setMessage(error instanceof Error ? error.message : 'Unable to start karaoke.');
    }
  }, [headphones, player, track, working]);

  const togglePause = useCallback(async () => {
    if (!startedRef.current || working) return;
    setWorking(true);
    try {
      if (pausedRef.current) {
        if (recordingRef.current) await resumeKaraokeRecording();
        player.play(); pausedRef.current = false; setPaused(false); setMessage(recordingRef.current ? 'Recording and karaoke resumed.' : 'Karaoke resumed.');
      } else {
        if (recordingRef.current) await pauseKaraokeRecording();
        player.pause(); pausedRef.current = true; setPaused(true); setMessage(recordingRef.current ? 'Recording and karaoke paused.' : 'Karaoke paused.');
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to change karaoke pause state.'); }
    finally { setWorking(false); }
  }, [player, working]);

  const finishSinging = useCallback(async () => {
    if (!startedRef.current && !recordingRef.current) return;
    startedRef.current = false; pausedRef.current = false; player.pause(); setPaused(false); setSinging(false);
    if (!recordingRef.current) { setMessage('Karaoke ended.'); return; }
    recordingRef.current = false; setWorking(true);
    try {
      const result = await stopKaraokeRecording(); setRecording(false); setOutput({ path: result.outputPath, uri: `file://${result.outputPath}` }); setMessage('Recording finished and saved.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to finish the vocal recording.'); }
    finally { setWorking(false); }
  }, [player]);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}>
      <Stack.Screen options={{ title: 'Karaoke' }} />
      <View style={styles.headerRow}><View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="mic" size={24} color={colors.primary} /></View><View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Karaoke</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sing with a karaoke track or record a high-quality vocal take.</Text></View></View>
      <Pressable onPress={chooseTrack} disabled={working || recording} accessibilityRole="button" accessibilityState={{ disabled: working || recording }} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Feather name="folder" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Upload Karaoke</Text></Pressable>
      {track && !output && <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text accessibilityRole="header" style={[styles.trackTitle, { color: colors.foreground }]}>{track.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>Duration {Math.round(track.durationMs / 1000)} seconds</Text>
        {!singing && <><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Mode</Text><View style={styles.modeRow}>
          <Pressable onPress={() => setMode('listen-only')} accessibilityRole="button" accessibilityState={{ selected: mode === 'listen-only' }} style={[styles.modeButton, { borderColor: mode === 'listen-only' ? colors.primary : colors.border, backgroundColor: mode === 'listen-only' ? colors.secondary : colors.background }]}><Feather name="headphones" size={17} color={colors.primary} /><Text style={[styles.modeText, { color: colors.foreground }]}>Sing only</Text></Pressable>
          <Pressable onPress={() => setMode('record-vocal')} accessibilityRole="button" accessibilityState={{ selected: mode === 'record-vocal' }} style={[styles.modeButton, { borderColor: mode === 'record-vocal' ? colors.primary : colors.border, backgroundColor: mode === 'record-vocal' ? colors.secondary : colors.background }]}><Feather name="mic" size={17} color={colors.primary} /><Text style={[styles.modeText, { color: colors.foreground }]}>Sing + Record</Text></Pressable>
        </View>{mode === 'record-vocal' && <Pressable onPress={() => setHeadphones((v) => !v)} accessibilityRole="button" accessibilityState={{ checked: headphones }} style={[styles.headphoneRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}><Feather name={headphones ? 'check-circle' : 'circle'} size={18} color={colors.primary} /><View style={styles.copy}><Text style={[styles.modeText, { color: colors.foreground }]}>Headphones connected</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>Uses headphone-aware vocal capture and stronger cleanup.</Text></View></Pressable>}</>}
        <View style={[styles.lyricBox, { borderColor: colors.border, backgroundColor: colors.background }]}><View style={styles.lyricHeader}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Lyrics</Text><Text style={[styles.linkText, { color: colors.mutedForeground }]}>LRC-ready</Text></View>{lyrics.length === 0 ? <Text style={[styles.meta, { color: colors.mutedForeground }]}>No timestamped lyrics loaded. Playback and recording are still available.</Text> : <><Text style={[styles.activeLyric, { color: colors.primary }]}>{lyrics[activeLyric]?.text ?? ''}</Text><Text style={[styles.nextLyric, { color: colors.mutedForeground }]}>{lyrics[activeLyric + 1]?.text ?? ''}</Text></>}</View>
        <Text style={[styles.progressText, { color: colors.mutedForeground }]}>{Math.floor(position / 1000)} / {Math.floor(track.durationMs / 1000)} sec</Text>
        {!singing && <AudioEditorTransport active={false} paused={false} recording={mode === 'record-vocal'} working={working} onStart={() => void startSinging(mode === 'record-vocal')} onTogglePause={togglePause} onFinish={finishSinging} startLabel={mode === 'record-vocal' ? 'Start Recording' : 'Start Singing'} />}
        {singing && <AudioEditorTransport active paused={paused} recording={recording} working={working} onStart={() => void startSinging(recording)} onTogglePause={togglePause} onFinish={finishSinging} />}
        {recording && <Text accessibilityLiveRegion="polite" style={[styles.recording, { color: colors.primary }]}>{paused ? 'Recording paused • karaoke paused' : 'Recording vocal • karaoke track playing'}</Text>}
        {singing && !recording && <Text accessibilityLiveRegion="polite" style={[styles.recording, { color: colors.primary }]}>{paused ? 'Singing paused • karaoke paused' : 'Singing • karaoke track playing'}</Text>}
      </View>}
      {output && <AudioEditorResultPanel outputPath={output.path} resultUri={output.uri} message="Karaoke vocal recording saved locally." onClose={() => void resetSession()} />}
      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
      {working && <ActivityIndicator accessibilityLabel="Karaoke processing" style={{ marginTop: 12 }} color={colors.primary} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 14 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 11.5, lineHeight: 17 }, primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 15 }, buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 }, trackTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, meta: { fontSize: 10.5, lineHeight: 15 }, sectionTitle: { fontSize: 13.5, fontFamily: 'Inter_700Bold' }, modeRow: { flexDirection: 'row', gap: 8 }, modeButton: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, modeText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, headphoneRow: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, copy: { flex: 1 }, lyricBox: { borderWidth: 1, borderRadius: 14, padding: 12, minHeight: 86 }, lyricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, linkText: { fontSize: 10 }, activeLyric: { fontSize: 18, lineHeight: 25, fontFamily: 'Inter_700Bold', marginTop: 9 }, nextLyric: { fontSize: 12, lineHeight: 18, marginTop: 4 }, progressText: { fontSize: 11, textAlign: 'center' }, recording: { fontSize: 11.5, lineHeight: 17, textAlign: 'center' }, message: { fontSize: 11.5, lineHeight: 17, marginTop: 12 } });

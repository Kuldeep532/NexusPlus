import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus, AudioModule } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { createKaraokeOutputPath, inspectKaraokeTrack, startKaraokeRecording, stopKaraokeRecording, cancelKaraokeRecording } from '@/features/audio-editor/karaokeEngine';
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
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('Choose a karaoke track to begin.');
  const [output, setOutput] = useState<{ path: string; uri: string } | null>(null);
  const startedRef = useRef(false);
  const recordingRef = useRef(false);
  const player = useAudioPlayer(track?.uri ?? null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setPosition(status.currentTime * 1000);
  }, [status.currentTime]);

  useEffect(() => {
    if (track) setLyrics(track.lyrics ?? []);
  }, [track]);

  useEffect(() => {
    const durationMs = track?.durationMs ?? 0;
    if (!track || !startedRef.current || !status.playing || durationMs <= 0) return;
    if (status.currentTime * 1000 < Math.max(0, durationMs - 250)) return;
    startedRef.current = false;
    player.pause();
    if (!recordingRef.current) return;
    recordingRef.current = false;
    setRecording(false);
    setWorking(true);
    void stopKaraokeRecording()
      .then((result) => {
        setOutput({ path: result.outputPath, uri: `file://${result.outputPath}` });
        setMessage('Song finished. Vocal recording stopped and saved.');
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to finish the vocal recording.'))
      .finally(() => setWorking(false));
  }, [player, status.currentTime, status.playing, track]);

  useEffect(() => {
    return () => {
      startedRef.current = false;
      recordingRef.current = false;
      void cancelKaraokeRecording();
    };
  }, []);

  const activeLyric = useMemo(() => findActiveLyric(lyrics, position), [lyrics, position]);

  const chooseTrack = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (!picked) return;
    setWorking(true);
    try {
      const inspected = await inspectKaraokeTrack({ uri: picked.uri, name: picked.name, durationMs: picked.durationMs ?? 0 });
      player.pause();
      await cancelKaraokeRecording();
      startedRef.current = false;
      recordingRef.current = false;
      setRecording(false);
      setTrack(inspected);
      setPosition(0);
      setLyrics(inspected.lyrics ?? []);
      setOutput(null);
      setMessage(`${inspected.name} loaded. Choose Sing or Sing + Record.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load this karaoke track.');
    } finally {
      setWorking(false);
    }
  }, [player]);

  const startPlayback = useCallback(async () => {
    if (!track || working || startedRef.current) return;
    try {
      setOutput(null);
      player.seekTo(0);
      if (mode === 'record-vocal') {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) {
          setMessage('Microphone permission is required for vocal recording.');
          return;
        }
        setWorking(true);
        const path = await createKaraokeOutputPath(track.name);
        await startKaraokeRecording(track.uri, path, true, headphones, 48_000, 1);
        recordingRef.current = true;
        setRecording(true);
        setWorking(false);
      }
      // Karaoke playback is the master transport: start immediately after recorder setup.
      player.play();
      startedRef.current = true;
      setPosition(0);
      setMessage(mode === 'record-vocal' ? 'Karaoke started. Recording is synchronized to the track.' : 'Karaoke playback started.');
    } catch (error) {
      setWorking(false);
      startedRef.current = false;
      recordingRef.current = false;
      setRecording(false);
      await cancelKaraokeRecording();
      setMessage(error instanceof Error ? error.message : 'Unable to start karaoke.');
    }
  }, [headphones, mode, player, track, working]);

  const stopPlayback = useCallback(async () => {
    const wasStarted = startedRef.current || recordingRef.current || status.playing;
    startedRef.current = false;
    player.pause();
    if (!wasStarted || !recordingRef.current) return;
    recordingRef.current = false;
    setWorking(true);
    try {
      const result = await stopKaraokeRecording();
      setRecording(false);
      setOutput({ path: result.outputPath, uri: `file://${result.outputPath}` });
      setMessage('Karaoke stopped. Vocal recording is ready.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to finish the vocal recording.');
    } finally {
      setWorking(false);
    }
  }, [player, status.playing]);

  const reset = useCallback(async () => {
    startedRef.current = false;
    recordingRef.current = false;
    player.pause();
    await cancelKaraokeRecording();
    setTrack(null);
    setLyrics([]);
    setOutput(null);
    setRecording(false);
    setPosition(0);
    setMessage('Choose a karaoke track to begin.');
  }, [player]);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}>
      <Stack.Screen options={{ title: 'Karaoke' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="mic" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Karaoke</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sing with a karaoke track or record a high-quality vocal take.</Text></View>
      </View>

      {!output && <>
        <Pressable onPress={chooseTrack} disabled={working || recording} accessibilityRole="button" accessibilityState={{ disabled: working || recording }} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Feather name="folder" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Upload Karaoke</Text></Pressable>

        {track && <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.trackTitle, { color: colors.foreground }]}>{track.name}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Duration {Math.round(track.durationMs / 1000)} seconds</Text>

          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Mode</Text>
          <View style={styles.modeRow}>
            <Pressable onPress={() => setMode('listen-only')} accessibilityRole="button" accessibilityState={{ selected: mode === 'listen-only' }} style={[styles.modeButton, { borderColor: mode === 'listen-only' ? colors.primary : colors.border, backgroundColor: mode === 'listen-only' ? colors.secondary : colors.background }]}><Feather name="headphones" size={17} color={colors.primary} /><Text style={[styles.modeText, { color: colors.foreground }]}>Sing only</Text></Pressable>
            <Pressable onPress={() => setMode('record-vocal')} accessibilityRole="button" accessibilityState={{ selected: mode === 'record-vocal' }} style={[styles.modeButton, { borderColor: mode === 'record-vocal' ? colors.primary : colors.border, backgroundColor: mode === 'record-vocal' ? colors.secondary : colors.background }]}><Feather name="mic" size={17} color={colors.primary} /><Text style={[styles.modeText, { color: colors.foreground }]}>Sing + Record</Text></Pressable>
          </View>

          {mode === 'record-vocal' && <Pressable onPress={() => setHeadphones((v) => !v)} accessibilityRole="button" accessibilityState={{ checked: headphones }} style={[styles.headphoneRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}><Feather name={headphones ? 'check-circle' : 'circle'} size={18} color={colors.primary} /><View style={styles.copy}><Text style={[styles.modeText, { color: colors.foreground }]}>Headphones connected</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>Uses headphone-aware vocal capture and stronger cleanup.</Text></View></Pressable>}

          <View style={[styles.lyricBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <View style={styles.lyricHeader}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Lyrics</Text><Text style={[styles.linkText, { color: colors.mutedForeground }]}>LRC-ready</Text></View>
            {lyrics.length === 0 ? <Text style={[styles.meta, { color: colors.mutedForeground }]}>No timestamped lyrics loaded. Playback and recording are still available.</Text> : <><Text style={[styles.activeLyric, { color: colors.primary }]}>{lyrics[activeLyric]?.text ?? ''}</Text><Text style={[styles.nextLyric, { color: colors.mutedForeground }]}>{lyrics[activeLyric + 1]?.text ?? ''}</Text></>}
          </View>

          <Text style={[styles.progressText, { color: colors.mutedForeground }]}>{Math.floor(position / 1000)} / {Math.floor(track.durationMs / 1000)} sec</Text>
          <View style={styles.transportRow}>
            <Pressable onPress={startPlayback} disabled={working || startedRef.current} accessibilityRole="button" accessibilityLabel={mode === 'record-vocal' ? 'Start karaoke and vocal recording' : 'Start karaoke playback'} accessibilityState={{ disabled: working || startedRef.current }} style={[styles.transportButton, { backgroundColor: colors.primary }]}><Feather name="play" size={19} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{mode === 'record-vocal' ? 'Start Recording' : 'Start Singing'}</Text></Pressable>
            <Pressable onPress={stopPlayback} disabled={working || (!status.playing && !recording)} accessibilityRole="button" accessibilityState={{ disabled: working || (!status.playing && !recording) }} style={[styles.transportButton, { borderColor: colors.primary, borderWidth: 1 }]}><Feather name="square" size={18} color={colors.primary} /><Text style={[styles.modeText, { color: colors.primary }]}>Stop</Text></Pressable>
          </View>
          {recording && <Text accessibilityLiveRegion="polite" style={[styles.recording, { color: colors.primary }]}>Recording vocal • karaoke track playing</Text>}
        </View>}
      </>}

      {output && <AudioEditorResultPanel outputPath={output.path} resultUri={output.uri} message="Karaoke vocal recording saved locally." onClose={() => void reset()} />}
      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
      {working && <ActivityIndicator accessibilityLabel="Karaoke processing" style={{ marginTop: 12 }} color={colors.primary} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 }, heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 14 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 11.5, lineHeight: 17 }, primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 15 }, buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 }, trackTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, meta: { fontSize: 10.5, lineHeight: 15 }, sectionTitle: { fontSize: 13.5, fontFamily: 'Inter_700Bold' }, modeRow: { flexDirection: 'row', gap: 8 }, modeButton: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, modeText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, headphoneRow: { borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', gap: 9, alignItems: 'center' }, copy: { flex: 1 }, lyricBox: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 }, lyricHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, linkText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' }, activeLyric: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center', marginTop: 8 }, nextLyric: { fontSize: 12, textAlign: 'center' }, progressText: { fontSize: 11, textAlign: 'center' }, transportRow: { flexDirection: 'row', gap: 8 }, transportButton: { minHeight: 50, borderRadius: 14, flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, recording: { fontSize: 12, fontFamily: 'Inter_700Bold', textAlign: 'center' }, message: { marginTop: 14, fontSize: 11, lineHeight: 16 },
});
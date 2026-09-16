import { Feather } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';
import { createFunRecordingVoiceSelection } from '@/features/audio-editor/FunRecordingsVoiceProfile';
import { VoicePitchSoundSelector } from '@/features/audio-editor/VoicePitchSoundSelector';
import type { VoicePitchProfile } from '@/features/audio-editor/voicePitchingEngine';
import { processVoicePitch } from '@/features/audio-editor/voicePitchingProcessor';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { formatRecordingDuration, isUsableRecordingUri } from '@/features/audio-editor/FunRecordingRecorder';

export default function FunRecordingsScreen() {
  const colors = useColors();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [selected, setSelected] = useState<VoicePitchProfile | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordedDurationMs, setRecordedDurationMs] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ outputUri: string; outputPath: string; profileName: string } | null>(null);

  const player = useAudioPlayer(recordingUri);

  useEffect(() => {
    let active = true;
    void AudioModule.requestRecordingPermissionsAsync().then(({ granted }) => {
      if (active) setPermissionStatus(granted ? 'granted' : 'denied');
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      void setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    };
  }, []);

  useEffect(() => {
    if (isPreviewPlaying && player) {
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) setIsPreviewPlaying(false);
      });
    }
  }, [isPreviewPlaying, player]);

  const isRecording = recorderState.isRecording;
  const durationMs = isRecording ? recorderState.durationMillis : recordedDurationMs;

  const reset = () => {
    if (player) player.pause();
    setIsPreviewPlaying(false);
    setResult(null);
    setRecordingUri(null);
    setRecordedDurationMs(0);
    setProcessing(false);
  };

  const startRecording = async () => {
    if (permissionStatus !== 'granted') {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      setPermissionStatus(granted ? 'granted' : 'denied');
      if (!granted) {
        Alert.alert('Microphone permission needed', 'Allow microphone access to start a recording.');
        return;
      }
    }

    try {
      if (player) player.pause();
      setIsPreviewPlaying(false);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      setRecordingUri(null);
      setRecordedDurationMs(0);
      setResult(null);
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      Alert.alert('Recording unavailable', 'Nexus Plus could not start the microphone recorder.');
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      const duration = recorderState.durationMillis;
      if (isUsableRecordingUri(uri)) {
        setRecordingUri(uri);
        setRecordedDurationMs(duration);
      }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    } catch {
      Alert.alert('Recording error', 'The recording could not be finalized.');
    }
  };

  const togglePreview = async () => {
    if (!recordingUri || !player) return;
    try {
      if (isPreviewPlaying) {
        player.pause();
        setIsPreviewPlaying(false);
        return;
      }
      player.play();
      setIsPreviewPlaying(true);
    } catch {
      Alert.alert('Preview unavailable', 'The recording could not be played back.');
    }
  };

  const resetRecording = () => {
    if (player) player.pause();
    setIsPreviewPlaying(false);
    setRecordingUri(null);
    setRecordedDurationMs(0);
  };

  const selection = useMemo(() => (selected ? createFunRecordingVoiceSelection(selected.id) : null), [selected]);

  const applyVoicePitch = async () => {
    if (!recordingUri || !selected) {
      Alert.alert('Choose a voice profile', 'Record audio and select a voice profile before applying the effect.');
      return;
    }

    setProcessing(true);
    try {
      if (player) player.pause();
      setIsPreviewPlaying(false);
      const selectedVoice = createFunRecordingVoiceSelection(selected.id);
      const outputPath = await createAudioEditorOutputPath('Fun Recordings', selectedVoice.profile.name, 'voice-pitch', 'm4a');
      const processed = await processVoicePitch({
        inputPath: recordingUri,
        outputPath,
        profile: selectedVoice.profile,
      });
      setResult({ outputUri: processed.outputPath, outputPath, profileName: selectedVoice.profile.name });
    } catch (error) {
      Alert.alert('Voice pitch failed', error instanceof Error ? error.message : 'Nexus Plus could not process this recording.');
    } finally {
      setProcessing(false);
    }
  };

  if (result) {
    return (
      <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} accessibilityLabel="Fun Recordings result">
        <Stack.Screen options={{ title: 'Fun Recordings' }} />
        <AudioEditorResultPanel
          message={`Voice pitch applied successfully with ${result.profileName}.`}
          outputPath={result.outputPath}
          resultUri={result.outputUri}
          onClose={reset}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} accessibilityLabel="Fun Recordings">
      <Stack.Screen options={{ title: 'Fun Recordings' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="mic" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Fun Recordings</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Record audio, preview it before saving, then apply a dynamic voice profile.</Text>
        </View>
      </View>

      <View style={[styles.recorderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Record audio</Text>
        <View accessibilityLiveRegion="polite" style={styles.timerWrap}>
          <Text style={[styles.timer, { color: colors.foreground }]}>{formatRecordingDuration(durationMs)}</Text>
          <Text style={[styles.status, { color: colors.mutedForeground }]}>
            {isRecording ? 'Recording in progress' : recordingUri ? 'Recording ready — preview it before processing' : permissionStatus === 'denied' ? 'Microphone permission required' : 'Ready to record'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : recordingUri ? 'Record again' : 'Start recording'}
          disabled={processing}
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.recordButton, { backgroundColor: isRecording ? colors.destructive : colors.primary, opacity: processing ? 0.55 : 1 }]}
        >
          <Feather name={isRecording ? 'square' : 'mic'} size={22} color={colors.primaryForeground} />
          <Text style={[styles.recordButtonText, { color: colors.primaryForeground }]}>{isRecording ? 'Stop' : recordingUri ? 'Record Again' : 'Record'}</Text>
        </Pressable>

        {recordingUri ? (
          <View style={styles.previewRow}>
            <Pressable accessibilityRole="button" accessibilityLabel={isPreviewPlaying ? 'Pause recorded audio preview' : 'Play recorded audio preview'} disabled={processing} onPress={togglePreview} style={[styles.previewButton, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: processing ? 0.55 : 1 }]}>
              <Feather name={isPreviewPlaying ? 'pause' : 'play'} size={18} color={colors.foreground} />
              <Text style={[styles.previewText, { color: colors.foreground }]}>{isPreviewPlaying ? 'Pause Preview' : 'Play Preview'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Discard recorded clip" disabled={processing} onPress={resetRecording} style={[styles.discardButton, { borderColor: colors.border, opacity: processing ? 0.55 : 1 }]}>
              <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Discard</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={[styles.selectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Voice profile</Text>
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>Profiles are generated in code, so the selector scales without shipping thousands of audio assets.</Text>
        <VoicePitchSoundSelector value={selected?.id} onChange={setSelected} />
      </View>

      {selection ? (
        <View style={[styles.selected, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.selectedTitle, { color: colors.foreground }]}>{selection.profile.name}</Text>
          <Text style={[styles.selectedMeta, { color: colors.mutedForeground }]}>
            {selection.profile.gender} • {selection.profile.style} • pitch {selection.profile.pitchSemitones >= 0 ? '+' : ''}{selection.profile.pitchSemitones} semitones
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Apply voice pitch to recording and save automatically"
        disabled={!recordingUri || !selected || processing}
        onPress={applyVoicePitch}
        style={[styles.processButton, { backgroundColor: colors.primary, opacity: !recordingUri || !selected || processing ? 0.45 : 1 }]}
      >
        <Feather name="sliders" size={19} color={colors.primaryForeground} />
        <Text style={[styles.processButtonText, { color: colors.primaryForeground }]}>{processing ? 'Applying voice pitch…' : 'Apply Voice Pitch & Save'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 18, paddingBottom: 32, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 14 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 11.5, lineHeight: 17 },
  recorderCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  selectorCard: { borderWidth: 1, borderRadius: 18, padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  timerWrap: { alignItems: 'center', paddingVertical: 22 },
  timer: { fontSize: 42, fontFamily: 'Inter_700Bold', fontVariant: ['tabular-nums'] },
  status: { fontSize: 11.5, marginTop: 5, textAlign: 'center' },
  recordButton: { minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  recordButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  previewRow: { flexDirection: 'row', gap: 9, marginTop: 10 },
  previewButton: { minHeight: 48, borderRadius: 14, borderWidth: 1, flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  previewText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  discardButton: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  helper: { fontSize: 11, lineHeight: 16, marginTop: 6, marginBottom: 10 },
  selected: { borderWidth: 1, borderRadius: 14, padding: 12 },
  selectedTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  selectedMeta: { fontSize: 10.5, marginTop: 4 },
  processButton: { minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 14 },
  processButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
import { Feather } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { VoicePitchSoundSelector } from '@/features/audio-editor/VoicePitchSoundSelector';
import type { VoicePitchProfile } from '@/features/audio-editor/voicePitchingEngine';
import { createFunRecordingVoiceSelection } from '@/features/audio-editor/FunRecordingsVoiceProfile';
import { formatRecordingDuration, isUsableRecordingUri } from '@/features/audio-editor/FunRecordingRecorder';

export default function FunRecordingsScreen() {
  const colors = useColors();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [selected, setSelected] = useState<VoicePitchProfile | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordedDurationMs, setRecordedDurationMs] = useState(0);

  useEffect(() => {
    let active = true;
    void AudioModule.requestRecordingPermissionsAsync().then(({ granted }) => {
      if (active) setPermissionStatus(granted ? 'granted' : 'denied');
    });
    return () => {
      active = false;
    };
  }, []);

  const isRecording = recorderState.isRecording;
  const durationMs = isRecording ? recorderState.durationMillis : recordedDurationMs;

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
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      setRecordingUri(null);
      setRecordedDurationMs(0);
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

  const resetRecording = () => {
    setRecordingUri(null);
    setRecordedDurationMs(0);
  };

  const selection = selected ? createFunRecordingVoiceSelection(selected.id) : null;

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} accessibilityLabel="Fun Recordings">
      <Stack.Screen options={{ title: 'Fun Recordings' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="mic" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Fun Recordings</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Record a clip, choose a dynamic voice profile, and keep this flow reusable for future voice-changing stages.</Text>
        </View>
      </View>

      <View style={[styles.recorderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recording</Text>
        <View accessibilityLiveRegion="polite" style={styles.timerWrap}>
          <Text style={[styles.timer, { color: colors.foreground }]}>{formatRecordingDuration(durationMs)}</Text>
          <Text style={[styles.status, { color: colors.mutedForeground }]}>
            {isRecording ? 'Recording in progress' : recordingUri ? 'Recording ready' : permissionStatus === 'denied' ? 'Microphone permission required' : 'Ready to record'}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : recordingUri ? 'Record again' : 'Start recording'}
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.recordButton, { backgroundColor: isRecording ? colors.destructive : colors.primary }]}
        >
          <Feather name={isRecording ? 'square' : 'mic'} size={22} color={colors.primaryForeground} />
          <Text style={[styles.recordButtonText, { color: colors.primaryForeground }]}>{isRecording ? 'Stop' : recordingUri ? 'Record Again' : 'Record'}</Text>
        </Pressable>

        {recordingUri ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Discard recorded clip" onPress={resetRecording} style={[styles.secondaryButton, { borderColor: colors.border }]}>
            <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Discard recording</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.selectorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Voice profile</Text>
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>Profiles are generated in code, so the selector can scale without shipping thousands of audio assets.</Text>
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

      {recordingUri ? (
        <Text style={[styles.readyNote, { color: colors.mutedForeground }]}>A recording is ready for the next voice-pitch processing stage.</Text>
      ) : null}
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
  secondaryButton: { marginTop: 10, minHeight: 46, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  helper: { fontSize: 11, lineHeight: 16, marginTop: 6, marginBottom: 10 },
  selected: { borderWidth: 1, borderRadius: 14, padding: 12 },
  selectedTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  selectedMeta: { fontSize: 10.5, marginTop: 4 },
  readyNote: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
});

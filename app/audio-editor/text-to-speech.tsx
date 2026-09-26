import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { generateWithPiper, listTtsVoices, playGeneratedAudio, type TtsSettings, type TtsVoiceOption } from '@/features/audio-editor/ttsEngine';
import { generateWithElevenLabs, listElevenLabsVoices, type ElevenLabsVoice } from '@/features/audio-editor/elevenLabsTts';
import { readTtsVoicePreferences, type TtsVoicePreferences } from '@/features/audio-editor/ttsPreferences';

const FALLBACK_VOICE_NAMES = ['Voice 1', 'Voice 2', 'Voice 3'];

function voiceLabel(voice: TtsVoiceOption, index: number): string {
  return voice.name?.trim() || FALLBACK_VOICE_NAMES[index] || `Voice ${index + 1}`;
}

function isLocalVoice(voice: TtsVoiceOption): voice is Extract<TtsVoiceOption, { provider: 'piper' | 'clone' }> {
  return voice.provider === 'piper' || voice.provider === 'clone';
}

async function shareGeneratedAudio(uri: string): Promise<void> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Sharing unavailable', 'The generated audio is already saved in Nexus Plus storage, but sharing is unavailable on this device.');
      return;
    }
    await Sharing.shareAsync(uri, { mimeType: 'audio/wav', dialogTitle: 'Share generated speech' });
  } catch {
    Alert.alert('Share unavailable', 'The generated speech file could not be shared.');
  }
}

export default function TextToSpeechScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<TtsVoiceOption[]>([]);
  const [elevenVoices, setElevenVoices] = useState<ElevenLabsVoice[]>([]);
  const [preferences, setPreferences] = useState<TtsVoicePreferences>({ provider: 'system', voiceId: '', voiceName: 'System voice', language: '' });
  const [selectedId, setSelectedId] = useState('');
  const [speed, setSpeed] = useState('1');
  const [pitch, setPitch] = useState('1');
  const [autoTune, setAutoTune] = useState(true);
  const [generatedUri, setGeneratedUri] = useState('');
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const refreshVoices = useCallback(async () => {
    try {
      const prefs = await readTtsVoicePreferences();
      setPreferences(prefs);
      setSelectedId(prefs.voiceId);
      if (prefs.provider === 'elevenlabs') {
        setVoices([]);
        setElevenVoices(await listElevenLabsVoices());
        if (!prefs.voiceId) setStatus('Open Model Settings to select an ElevenLabs voice.');
      } else {
        const items = await listTtsVoices();
        const local = items.filter((voice) => isLocalVoice(voice) && voice.installed);
        setVoices(local);
        if (!local.some((voice) => voice.id === prefs.voiceId)) setSelectedId(local[0]?.id ?? '');
        if (!local.length) setStatus('No downloaded Nexus voices are available. Download a voice from the Voice Library first.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load available voices.');
    }
  }, []);

  useEffect(() => {
    void refreshVoices();
  }, [refreshVoices]);

  const selectedVoice = useMemo(() => voices.find((voice) => voice.id === selectedId), [selectedId, voices]);
  const selectedElevenVoice = useMemo(() => elevenVoices.find((voice) => voice.id === selectedId), [selectedId, elevenVoices]);
  const numericSpeed = Number(speed);
  const numericPitch = Number(pitch);
  const validSettings =
    Number.isFinite(numericSpeed) && numericSpeed >= 0.65 && numericSpeed <= 1.35 &&
    Number.isFinite(numericPitch) && numericPitch >= 0.75 && numericPitch <= 1.35;

  const generate = useCallback(async () => {
    const normalized = text.trim();
    if (!normalized) { setStatus('Enter text before generating speech.'); return; }
    if (preferences.provider === 'elevenlabs') {
      if (!selectedElevenVoice) { setStatus('Open Model Settings and select an ElevenLabs voice first.'); return; }
    } else if (!selectedVoice) { setStatus('Select a downloaded Nexus voice first.'); return; }
    if (!validSettings) { setStatus('Speed must be 0.65–1.35 and pitch must be 0.75–1.35.'); return; }

    setBusy(true);
    setPlaying(false);
    setStatus('Generating speech…');
    try {
      if (preferences.provider === 'elevenlabs') {
        const result = await generateWithElevenLabs({ text: normalized, voiceId: selectedElevenVoice!.id, languageCode: selectedElevenVoice!.language || undefined });
        setGeneratedUri(result.outputUri);
        setStatus(`Speech generated with ${selectedElevenVoice!.name}. ${result.characters} characters • ${result.creditsCharged} credits used. Remaining balance: ${result.balance}.`);
      } else {
        const settings: TtsSettings = { speed: numericSpeed, pitch: numericPitch, autoTune };
        const result = await generateWithPiper(normalized, selectedVoice!, settings);
        setGeneratedUri(result.outputUri);
        setStatus(`Speech generated with ${voiceLabel(selectedVoice!, 0)} (${result.analysis.emotion}).`);
      }
    } catch (error) {
      setGeneratedUri('');
      setStatus(error instanceof Error ? error.message : 'Speech generation failed.');
    } finally {
      setBusy(false);
    }
  }, [autoTune, numericPitch, numericSpeed, selectedVoice, selectedElevenVoice, text, validSettings, preferences.provider]);

  const play = useCallback(async () => {
    if (!generatedUri || playing) return;
    try {
      setPlaying(true);
      const stop = await playGeneratedAudio(generatedUri);
      setStatus('Playing generated speech.');
      setTimeout(() => { try { stop(); } finally { setPlaying(false); } }, 60000);
    } catch (error) {
      setPlaying(false);
      setStatus(error instanceof Error ? error.message : 'Unable to play generated speech.');
    }
  }, [generatedUri, playing]);

  const clear = () => { setGeneratedUri(''); setPlaying(false); setStatus('Generated speech cleared.'); };

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Text to Speech' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="volume-2" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Text to Speech</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Generate offline speech from downloaded Nexus voices with speed, pitch, and emotion-aware tuning.</Text>
        </View>
      </View>

      <TextInput value={text} onChangeText={setText} multiline placeholder="Enter text to convert to speech" placeholderTextColor={colors.mutedForeground} style={[styles.textArea, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLabel="Text to convert to speech" />

      <View style={[styles.modelSettingsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.voiceCopy}>
          <Text style={[styles.voiceName, { color: colors.foreground }]}>Voice Provider</Text>
          <Text style={[styles.voiceMeta, { color: colors.mutedForeground }]}>{preferences.provider === 'elevenlabs' ? `ElevenLabs • ${preferences.voiceName || 'No voice selected'}` : preferences.provider === 'piper' ? `Nexus Piper • ${preferences.voiceName || 'No voice selected'}` : preferences.provider === 'clone' ? `Nexus Clone • ${preferences.voiceName || 'No voice selected'}` : `System TTS • ${preferences.voiceName || 'Device voice'}`}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Model Settings" onPress={()=>router.push('/tts-preferences')} style={[styles.secondaryButton,{borderColor:colors.primary}]}><Feather name="settings" size={17} color={colors.primary}/><Text style={[styles.secondaryText,{color:colors.primary}]}>Open Model Settings</Text></Pressable>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Voice</Text>
      <View style={styles.voiceList}>
        {preferences.provider === 'elevenlabs' ? elevenVoices.map((voice) => (
          <Pressable key={voice.id} onPress={() => setSelectedId(voice.id)} accessibilityRole="radio" accessibilityState={{ selected: selectedId === voice.id }} style={[styles.voiceCard, { backgroundColor: selectedId === voice.id ? colors.secondary : colors.card, borderColor: selectedId === voice.id ? colors.primary : colors.border }]}>
            <Feather name="cloud" size={17} color={colors.primary} />
            <View style={styles.voiceCopy}>
              <Text style={[styles.voiceName, { color: colors.foreground }]}>{voice.name || voice.id}</Text>
              <Text style={[styles.voiceMeta, { color: colors.mutedForeground }]}>{voice.language || 'Language not specified'}{voice.gender ? ` • ${voice.gender}` : ''}{voice.category ? ` • ${voice.category}` : ''}</Text>
            </View>
          </Pressable>
        )) : voices.map((voice, index) => (
          <Pressable key={voice.id} onPress={() => setSelectedId(voice.id)} accessibilityRole="radio" accessibilityState={{ selected: selectedId === voice.id }} style={[styles.voiceCard, { backgroundColor: selectedId === voice.id ? colors.secondary : colors.card, borderColor: selectedId === voice.id ? colors.primary : colors.border }]}>
            <Feather name={voice.provider === 'clone' ? 'copy' : 'mic'} size={17} color={colors.primary} />
            <View style={styles.voiceCopy}><Text style={[styles.voiceName, { color: colors.foreground }]}>{voiceLabel(voice, index)}</Text><Text style={[styles.voiceMeta, { color: colors.mutedForeground }]}>{voice.language || 'Unknown language'} • {voice.provider === 'clone' ? 'Clone' : 'Piper'} • Downloaded</Text></View>
          </Pressable>
        ))}
      </View>

      {!voices.length && !elevenVoices.length && <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No voices are available. Open Model Settings to choose a provider and voice.</Text>}

      <View style={styles.controlsRow}>
        <View style={styles.control}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Speed</Text>
          <TextInput value={speed} onChangeText={setSpeed} keyboardType="decimal-pad" style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Speech speed from 0.65 to 1.35" />
        </View>
        <View style={styles.control}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Pitch</Text>
          <TextInput value={pitch} onChangeText={setPitch} keyboardType="decimal-pad" style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel="Speech pitch from 0.75 to 1.35" />
        </View>
      </View>

      <Pressable onPress={() => setAutoTune((value) => !value)} accessibilityRole="switch" accessibilityState={{ checked: autoTune }} style={[styles.toggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name={autoTune ? 'check-circle' : 'circle'} size={18} color={colors.primary} />
        <Text style={[styles.toggleText, { color: colors.foreground }]}>Automatic emotion tuning {autoTune ? 'On' : 'Off'}</Text>
      </Pressable>

      <Pressable disabled={busy || (preferences.provider === 'elevenlabs' ? !selectedElevenVoice : !selectedVoice)} onPress={() => void generate()} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: busy || (preferences.provider === 'elevenlabs' ? !selectedElevenVoice : !selectedVoice) ? colors.muted : colors.primary }]}>
        {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="volume-2" size={19} color={colors.primaryForeground} />}
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? 'Generating…' : 'Generate Speech'}</Text>
      </Pressable>

      {generatedUri && (
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.resultTitle, { color: colors.foreground }]}>Generated Speech</Text>
          <Text selectable style={[styles.pathText, { color: colors.mutedForeground }]}>{generatedUri}</Text>
          <View style={styles.actionRow}>
            <Pressable disabled={playing} onPress={() => void play()} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.primary }]}><Feather name={playing ? 'pause' : 'play'} size={17} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.primary }]}>{playing ? 'Playing' : 'Play'}</Text></Pressable>
            <Pressable onPress={() => void shareGeneratedAudio(generatedUri)} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.primary }]}><Feather name="share-2" size={17} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.primary }]}>Share</Text></Pressable>
            <Pressable onPress={clear} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="x" size={17} color={colors.foreground} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Close</Text></Pressable>
          </View>
        </View>
      )}

      {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text>}
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
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 14, marginBottom: 8 },
  textArea: { minHeight: 150, borderWidth: 1, borderRadius: 16, padding: 14, textAlignVertical: 'top', fontSize: 14, lineHeight: 21 },
  voiceList: { gap: 8 },
  voiceCard: { minHeight: 62, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  voiceCopy: { flex: 1, marginLeft: 10 },
  voiceName: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  voiceMeta: { fontSize: 10.5, marginTop: 3 },
  emptyText: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  controlsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  control: { flex: 1 },
  label: { fontSize: 10.5, marginBottom: 5 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 13 },
  toggle: { minHeight: 48, borderWidth: 1, borderRadius: 14, marginTop: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  modelSettingsRow: { minHeight: 66, borderWidth: 1, borderRadius: 15, marginTop: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryButton: { minHeight: 52, borderRadius: 16, marginTop: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  resultCard: { marginTop: 14, borderWidth: 1, borderRadius: 16, padding: 13 },
  resultTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  pathText: { fontSize: 10, lineHeight: 15 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  secondaryButton: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  status: { fontSize: 11, lineHeight: 16, marginTop: 13 },
});
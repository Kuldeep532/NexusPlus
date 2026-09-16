import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { listAvailableTtsVoices, stopTextToSpeech, type TtsVoice } from '@/features/audio-editor/textToSpeech';

const ALL_LANGUAGES = 'all';

export default function TextToSpeechScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [voices, setVoices] = useState<TtsVoice[]>([]);
  const [language, setLanguage] = useState(ALL_LANGUAGES);
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadVoices = useCallback(async () => {
    setLoading(true);
    setMessage('Loading voices available on this device…');
    try {
      const available = await listAvailableTtsVoices();
      setVoices(available);
      setSelectedVoiceId((current) => current && available.some((v) => v.identifier === current) ? current : available[0]?.identifier || '');
      setMessage(available.length ? `${available.length} device voice${available.length === 1 ? '' : 's'} available.` : 'No device TTS voices are available. Install or enable a system speech engine.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load device voices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVoices();
    return () => { void stopTextToSpeech(); };
  }, [loadVoices]);

  const languages = useMemo(() => Array.from(new Set(voices.map((voice) => voice.language).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [voices]);
  const filteredVoices = useMemo(() => language === ALL_LANGUAGES ? voices : voices.filter((voice) => voice.language === language), [language, voices]);
  const selectedVoice = voices.find((voice) => voice.identifier === selectedVoiceId) || filteredVoices[0] || null;

  useEffect(() => {
    if (!filteredVoices.some((voice) => voice.identifier === selectedVoiceId)) setSelectedVoiceId(filteredVoices[0]?.identifier || '');
  }, [filteredVoices, selectedVoiceId]);

  const clearAndRegenerate = async () => {
    await stopTextToSpeech();
    setText('');
    setMessage('Current speech cleared. Enter new text and generate again.');
  };

  const generate = () => {
    if (!text.trim()) {
      setMessage('Enter text before generating speech.');
      return;
    }
    if (!selectedVoice) {
      setMessage('Select a device voice first.');
      return;
    }
    router.push({
      pathname: '/audio-editor/text-to-speech-result',
      params: {
        text,
        voiceId: selectedVoice.identifier,
        voiceName: selectedVoice.name,
        language: selectedVoice.language,
      },
    } as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Text to Speech' }} />
      <FlatList
        data={filteredVoices}
        keyExtractor={(item) => item.identifier}
        contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="volume-2" size={24} color={colors.primary} /></View>
              <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Text to Speech</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Select a language and any voice exposed by the device's installed speech engines.</Text></View>
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>Select language</Text>
            <View style={styles.chips}>
              <Pressable onPress={() => setLanguage(ALL_LANGUAGES)} accessibilityRole="button" accessibilityState={{ selected: language === ALL_LANGUAGES }} style={[styles.chip, { borderColor: language === ALL_LANGUAGES ? colors.primary : colors.border, backgroundColor: language === ALL_LANGUAGES ? colors.secondary : colors.card }]}><Text style={[styles.chipText, { color: colors.foreground }]}>All languages</Text></Pressable>
              {languages.map((item) => <Pressable key={item} onPress={() => setLanguage(item)} accessibilityRole="button" accessibilityState={{ selected: language === item }} style={[styles.chip, { borderColor: language === item ? colors.primary : colors.border, backgroundColor: language === item ? colors.secondary : colors.card }]}><Text style={[styles.chipText, { color: colors.foreground }]}>{item}</Text></Pressable>)}
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>Select voice</Text>
            <View style={[styles.voicePanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : filteredVoices.length ? filteredVoices.map((voice) => (
                <Pressable key={voice.identifier} onPress={() => setSelectedVoiceId(voice.identifier)} accessibilityRole="radio" accessibilityState={{ checked: voice.identifier === selectedVoiceId }} style={[styles.voiceRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.radio, { borderColor: voice.identifier === selectedVoiceId ? colors.primary : colors.border }]}>{voice.identifier === selectedVoiceId && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}</View>
                  <View style={styles.voiceCopy}><Text style={[styles.voiceName, { color: colors.foreground }]}>{voice.name}</Text><Text style={[styles.voiceMeta, { color: colors.mutedForeground }]}>{voice.language}{voice.quality ? ` • ${voice.quality}` : ''}{voice.gender ? ` • ${voice.gender}` : ''}</Text></View>
                </Pressable>
              )) : <Text style={[styles.empty, { color: colors.mutedForeground }]}>No voices match this language.</Text>}
            </View>
            <Text style={[styles.label, { color: colors.foreground }]}>Enter text</Text>
            <TextInput value={text} onChangeText={setText} multiline textAlignVertical="top" placeholder="Type the text you want to hear…" placeholderTextColor={colors.mutedForeground} style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} accessibilityLabel="Enter text for text to speech" />
            <Pressable disabled={!selectedVoice || loading} onPress={generate} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: selectedVoice && !loading ? colors.primary : colors.muted }]}>
              <Feather name="play" size={19} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Generate</Text>
            </Pressable>
            <Pressable onPress={clearAndRegenerate} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}>
              <Feather name="refresh-cw" size={18} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Clear & Regenerate</Text>
            </Pressable>
            {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
          </View>
        }
        renderItem={null}
        ListFooterComponent={<Text style={[styles.note, { color: colors.mutedForeground }]}>Voice and language availability comes directly from the device TTS engine.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 }, heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 14 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 11.5, lineHeight: 17 }, label: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 9, marginTop: 14 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }, chipText: { fontSize: 11.5 }, voicePanel: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' }, loader: { padding: 18 }, voiceRow: { minHeight: 64, padding: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, radioDot: { width: 10, height: 10, borderRadius: 5 }, voiceCopy: { flex: 1, marginLeft: 11 }, voiceName: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, voiceMeta: { fontSize: 10.5, marginTop: 3 }, empty: { padding: 16, fontSize: 11 }, textInput: { minHeight: 170, borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 14, lineHeight: 21 }, primaryButton: { minHeight: 52, borderRadius: 16, marginTop: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, secondaryButton: { minHeight: 52, borderRadius: 16, marginTop: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, message: { marginTop: 12, fontSize: 11, lineHeight: 16 }, note: { marginTop: 16, fontSize: 10.5, lineHeight: 15 },
});

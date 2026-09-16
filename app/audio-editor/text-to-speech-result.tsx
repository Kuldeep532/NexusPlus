import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { speakText, stopTextToSpeech } from '@/features/audio-editor/textToSpeech';

type Params = { text?: string; voiceId?: string; voiceName?: string; language?: string };

export default function TextToSpeechResultScreen() {
  const colors = useColors();
  const router = useRouter();
  const { text = '', voiceId = '', voiceName = '', language = '' } = useLocalSearchParams<Params>();
  const [playing, setPlaying] = useState(false);

  const play = async () => {
    if (!text || !voiceId) return;
    await stopTextToSpeech();
    setPlaying(true);
    await speakText(text, { identifier: voiceId, name: voiceName || voiceId, language }, {
      onStart: () => setPlaying(true),
      onDone: () => setPlaying(false),
      onStopped: () => setPlaying(false),
      onError: () => setPlaying(false),
    });
  };

  const saveOrShare = async () => {
    Alert.alert('Audio file unavailable', 'The Android device TTS engine used here exposes speech playback and voice enumeration, but not a synthesized audio file. Nexus Plus will not create a fake file. A true Save/Share audio action needs a TTS engine with file-output support.');
  };

  const regenerate = async () => {
    await stopTextToSpeech();
    router.back();
  };

  useEffect(() => () => { void stopTextToSpeech(); }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Generated Speech' }} />
      <View style={styles.content}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="volume-2" size={28} color={colors.primary} /></View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Generated Speech</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{voiceName || voiceId}{language ? ` • ${language}` : ''}</Text>
        <View style={[styles.textCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.text, { color: colors.foreground }]}>{text}</Text></View>
        <View style={styles.actions}>
          <Pressable onPress={play} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Feather name={playing ? 'volume-2' : 'play'} size={19} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{playing ? 'Playing…' : 'Play'}</Text></Pressable>
          <Pressable onPress={saveOrShare} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="save" size={18} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Save</Text></Pressable>
          <Pressable onPress={saveOrShare} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="share-2" size={18} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Share</Text></Pressable>
          <Pressable onPress={regenerate} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="refresh-cw" size={18} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Regenerate</Text></Pressable>
        </View>
        <Text accessibilityLiveRegion="polite" style={[styles.note, { color: colors.mutedForeground }]}>Back and Regenerate stop and clear the current speech session.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { flex: 1, padding: 20, justifyContent: 'center' }, heroIcon: { width: 62, height: 62, borderRadius: 18, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }, title: { fontSize: 24, fontFamily: 'Inter_700Bold', textAlign: 'center', marginTop: 16 }, meta: { fontSize: 11, textAlign: 'center', marginTop: 5 }, textCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 22, maxHeight: 280 }, text: { fontSize: 15, lineHeight: 23 }, actions: { gap: 10, marginTop: 18 }, primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, secondaryButton: { minHeight: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, note: { fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 14 },
});

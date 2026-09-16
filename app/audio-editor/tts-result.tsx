import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioPlayer, createAudioPlayer } from 'expo-audio';
import * as Sharing from 'expo-sharing';
import { useColors } from '@/hooks/useColors';

export default function TtsResultScreen() {
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ text?: string; voice?: string; language?: string }>();
  const [player, setPlayer] = useState<AudioPlayer | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => { player?.remove(); }, [player]);

  const play = useCallback(async () => {
    Alert.alert('Audio file output', 'Android system TTS voices can be spoken directly, but Expo Speech does not expose the synthesized PCM/file path. This result screen is ready for a native TTS file-output module to provide the URI.');
  }, []);

  const save = async () => {
    Alert.alert('Save audio', 'The local audio save action will use the URI returned by the native synthesis engine. The current Expo Speech engine does not provide that file URI.');
  };

  const share = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Share unavailable', 'Sharing is not available on this device.');
      return;
    }
    Alert.alert('Share audio', 'A native synthesized file URI is required before this audio can be shared.');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Generated Speech' }} />
      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="check-circle" size={30} color={colors.primary} /></View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Speech generated</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{params.voice || 'Device voice'}{params.language ? ` • ${params.language}` : ''}</Text>
        <View style={[styles.textCard, { borderColor: colors.border, backgroundColor: colors.card }]}><Text style={[styles.body, { color: colors.foreground }]}>{params.text || ''}</Text></View>
        <View style={styles.actions}>
          <Pressable onPress={play} accessibilityRole="button" style={[styles.primary, { backgroundColor: colors.primary }]}><Feather name="play" size={19} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Play</Text></Pressable>
          <Pressable onPress={save} accessibilityRole="button" style={[styles.secondary, { borderColor: colors.border }]}><Feather name="save" size={19} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Save</Text></Pressable>
          <Pressable onPress={share} accessibilityRole="button" style={[styles.secondary, { borderColor: colors.border }]}><Feather name="share-2" size={19} color={colors.foreground} /><Text style={[styles.buttonText, { color: colors.foreground }]}>Share</Text></Pressable>
        </View>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={[styles.regenerate, { borderColor: colors.primary }]}><Feather name="refresh-cw" size={19} color={colors.primary} /><Text style={[styles.regenerateText, { color: colors.primary }]}>Regenerate</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 20, alignItems: 'center' }, icon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginTop: 14 }, meta: { fontSize: 11, marginTop: 5 }, textCard: { width: '100%', borderWidth: 1, borderRadius: 18, padding: 15, marginTop: 20, minHeight: 150 }, body: { fontSize: 14, lineHeight: 22 }, actions: { width: '100%', flexDirection: 'row', gap: 8, marginTop: 16 }, primary: { flex: 1, minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, secondary: { flex: 1, minHeight: 52, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, buttonText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, regenerate: { width: '100%', minHeight: 52, borderRadius: 15, borderWidth: 1, marginTop: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, regenerateText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});

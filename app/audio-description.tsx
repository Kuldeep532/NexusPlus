import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createAudioDescription, type AudioDescriptionMode } from '@/features/audio-description/audioDescription';
import { SUPABASE_URL } from '@/features/auth/authConfig';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';

async function recordAttestation(verdict: 'TRUSTED'|'MODIFIED'|'UNTRUSTED'|'UNKNOWN') {
  const token = await getSupabaseAccessToken();
  const key = (process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim() ?? '';
  if (!token || !SUPABASE_URL || !key) return;
  await fetch(`${SUPABASE_URL}/functions/v1/nexus-app-attestation`, {method:'POST',headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({appId:'nexus-plus-android',verdict,packageName:'com.nexuswavetech.nexusplus',provider:'play_integrity',metadata:{platform:Platform.OS}})}).catch(()=>{});
}

const LANGUAGES = ['English', 'Hindi'];

export default function AudioDescriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [videoUri, setVideoUri] = useState('');
  const [videoName, setVideoName] = useState('');
  const [language, setLanguage] = useState('English');
  const [mode, setMode] = useState<AudioDescriptionMode>('basic');
  const [instruction, setInstruction] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  void recordAttestation('UNKNOWN');
  const [advancedNotice, setAdvancedNotice] = useState('');

  const credits = mode === 'advanced' ? 12 : 4;
  const modeText = useMemo(
    () => mode === 'basic'
      ? 'Basic description: key scenes and actions.'
      : 'Advanced description: richer scene changes and timestamps.',
    [mode],
  );

  async function pickVideo() {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'video/*',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setVideoUri(asset.uri);
    setVideoName(asset.name ?? 'Selected video');
    setDescription('');
  }

  async function generate() {
    if (!videoUri) {
      Alert.alert('Select a video', 'Choose a video before creating its audio description.');
      return;
    }
    setBusy(true);
    try {
      const result = await createAudioDescription({
        uri: videoUri,
        mimeType: 'video/mp4',
        language,
        mode,
        customInstruction: instruction,
      });
      setDescription(result.description);
      setAdvancedNotice(mode === 'advanced' ? 'Advanced description uses Premium AI processing.' : 'Basic description uses the free audio description mode.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the audio description right now.';
      Alert.alert('Audio description', message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}
    >
      <Stack.Screen options={{ title: 'Audio Description' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="volume-2" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio Description</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Turn video visuals into spoken descriptions for accessible listening.
          </Text>
        </View>
      </View>

      <Pressable onPress={pickVideo} accessibilityRole="button" style={[styles.pickCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="upload" size={21} color={colors.primary} />
        <View style={styles.copy}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{videoName || 'Choose a video'}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            MP4, MOV, WebM and other supported video formats
          </Text>
        </View>
        <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
      </Pressable>

      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Description style</Text>
      <View style={styles.segmentRow}>
        {(['basic', 'advanced'] as AudioDescriptionMode[]).map((value) => (
          <Pressable
            key={value}
            onPress={() => setMode(value)}
            accessibilityRole="button"
            accessibilityState={{ selected: mode === value }}
            style={[styles.segment, { backgroundColor: mode === value ? colors.primary : colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.segmentText, { color: mode === value ? '#fff' : colors.foreground }]}>
              {value === 'basic' ? 'Basic' : 'Advanced'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>{modeText}</Text>

      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Language</Text>
      <View style={styles.segmentRow}>
        {LANGUAGES.map((value) => (
          <Pressable
            key={value}
            onPress={() => setLanguage(value)}
            accessibilityRole="button"
            accessibilityState={{ selected: language === value }}
            style={[styles.segment, { backgroundColor: language === value ? colors.primary : colors.card, borderColor: colors.border }]}
          >
            <Text style={[styles.segmentText, { color: language === value ? '#fff' : colors.foreground }]}>{value}</Text>
          </Pressable>
        ))}
      </View>

      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.foreground }]}>Optional instructions</Text>
      <TextInput
        value={instruction}
        onChangeText={setInstruction}
        placeholder="For example: focus on people, signs, and scene changes"
        placeholderTextColor={colors.mutedForeground}
        multiline
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
      />

      <View style={[styles.creditCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Text style={[styles.creditTitle, { color: colors.foreground }]}>{credits} credits per description</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Premium plans and credit top-ups can be used for larger or more advanced jobs.
        </Text>
      </View>
      {advancedNotice ? <Text style={[styles.notice, { color: colors.mutedForeground }]}>{advancedNotice}</Text> : null}

      <Pressable
        onPress={() => void generate()}
        disabled={busy}
        accessibilityRole="button"
        style={[styles.generate, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}
      >
        {busy ? <ActivityIndicator color="#fff" /> : <Feather name="play" size={19} color="#fff" />}
        <Text style={styles.generateText}>{busy ? 'Creating description…' : 'Create Audio Description'}</Text>
      </Pressable>

      {description ? (
        <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.resultTitle, { color: colors.foreground }]}>Generated description</Text>
          <Text selectable style={[styles.resultText, { color: colors.foreground }]}>{description}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 14 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 11.5, lineHeight: 17 },
  pickCard: { minHeight: 78, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  copy: { flex: 1, marginLeft: 12, marginRight: 8 },
  cardTitle: { fontSize: 13.5, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  body: { fontSize: 11, lineHeight: 16 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 9, marginTop: 6 },
  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 7 },
  segment: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  segmentText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  hint: { fontSize: 11, lineHeight: 16, marginBottom: 14 },
  input: { minHeight: 92, borderWidth: 1, borderRadius: 15, padding: 13, fontSize: 12, textAlignVertical: 'top', marginBottom: 14 },
  creditCard: { borderWidth: 1, borderRadius: 15, padding: 13, marginBottom: 14 },
  creditTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  generate: { minHeight: 50, borderRadius: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  generateText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  resultCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginTop: 16 },
  resultTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  resultText: { fontSize: 12.5, lineHeight: 20 },
  notice: { fontSize: 11, lineHeight: 16, marginBottom: 12 },
});

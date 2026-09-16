import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { loadLanguagePreferences, saveLanguagePreferences, type FeatureTtsLanguage, type LanguagePreferences } from '@/features/language-preferences/languagePreferences';
import { importVoiceStudioOnnx, loadVoiceStudioModels, syncVoiceStudioFolder, type VoiceStudioModel } from '@/features/audio-editor/voiceStudio';

const options: Array<{ value: FeatureTtsLanguage; label: string }> = [
  { value: 'en-IN', label: 'English' },
  { value: 'hi-IN', label: 'Hindi' },
];

function Selector({ title, detail, value, onChange }: { title: string; detail: string; value: FeatureTtsLanguage; onChange: (value: FeatureTtsLanguage) => void }) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
    <Text style={[styles.detail, { color: colors.mutedForeground }]}>{detail}</Text>
    <View style={styles.options}>{options.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)} style={[styles.option, { borderColor: value === option.value ? colors.primary : colors.border, backgroundColor: value === option.value ? colors.secondary : colors.background }]}><Text style={{ color: colors.foreground, fontFamily: value === option.value ? 'Inter_700Bold' : 'Inter_500Medium' }}>{option.label}</Text>{value === option.value && <Feather name="check" size={17} color={colors.primary} />}</Pressable>)}</View>
  </View>;
}

export default function LanguageAndPreferenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [prefs, setPrefs] = useState<LanguagePreferences>({ featureTtsLanguage: 'en-IN', bookReaderLanguage: 'en-IN' });
  const [models, setModels] = useState<VoiceStudioModel[]>([]);

  useEffect(() => { void loadLanguagePreferences().then(setPrefs); void syncVoiceStudioFolder().then(setModels); }, []);
  const update = (next: LanguagePreferences) => { setPrefs(next); void saveLanguagePreferences(next); };

  const importVoiceModel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/octet-stream', 'model/*', '*/*'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.name.toLowerCase().endsWith('.onnx')) {
        Alert.alert('Unsupported voice model', 'Voice Studio currently accepts ONNX voice model files only.');
        return;
      }
      const model = await importVoiceStudioOnnx(asset.uri, asset.name.replace(/\.onnx$/i, ''));
      setModels((current) => [model, ...current.filter((item) => item.uri !== model.uri)]);
    } catch {
      Alert.alert('Voice Studio', 'The ONNX voice model could not be imported.');
    }
  };

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <Stack.Screen options={{ title: 'Language and Preference' }} />
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="globe" size={26} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Language and Preference</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose feature announcements, Book Reader language, and Voice Studio preferences independently.</Text></View></View>
    <View style={styles.list}>
      <Selector title="Select language for feature X" detail="Used by Time, Battery Announcer and other feature TTS announcements." value={prefs.featureTtsLanguage} onChange={(featureTtsLanguage) => update({ ...prefs, featureTtsLanguage })} />
      <Selector title="Select language for Book Reader" detail="Controls the preferred voice language for Book Reader without changing feature announcements." value={prefs.bookReaderLanguage} onChange={(bookReaderLanguage) => update({ ...prefs, bookReaderLanguage })} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>Voice Studio</Text>
        <Text style={[styles.detail, { color: colors.mutedForeground }]}>Manage your local ONNX voice models here. Voice Changer and Fun Recordings use this shared inventory.</Text>
        <Pressable onPress={importVoiceModel} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Feather name="upload" size={18} color={colors.primaryForeground} /><Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Upload ONNX Voice Model</Text></Pressable>
        <Pressable onPress={() => router.push('/voice-studio' as never)} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="mic" size={18} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Open Voice Studio</Text></Pressable>
        {models.length > 0 ? <Text style={[styles.modelCount, { color: colors.mutedForeground }]}>{models.length} local voice model{models.length === 1 ? '' : 's'} detected.</Text> : <Text style={[styles.modelCount, { color: colors.mutedForeground }]}>No local ONNX voice models detected yet.</Text>}
      </View>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }, icon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 4, fontSize: 12, lineHeight: 18 }, list: { paddingHorizontal: 20, gap: 12 }, card: { borderWidth: 1, borderRadius: 18, padding: 15 }, cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, detail: { marginTop: 4, fontSize: 11, lineHeight: 17 }, options: { marginTop: 13, gap: 8 }, option: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryButton: { minHeight: 50, borderRadius: 14, marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, primaryButtonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, secondaryButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryButtonText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, modelCount: { marginTop: 9, fontSize: 10.5, textAlign: 'center' } });

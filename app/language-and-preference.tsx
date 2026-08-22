import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { loadLanguagePreferences, saveLanguagePreferences, type FeatureTtsLanguage, type LanguagePreferences, type VoiceEnginePreference } from '@/features/language-preferences/languagePreferences';

const options: Array<{ value: FeatureTtsLanguage; label: string }> = [{ value: 'en-IN', label: 'English' }, { value: 'hi-IN', label: 'Hindi' }];
const voiceOptions: Array<{ value: VoiceEnginePreference; label: string; detail: string }> = [
  { value: 'auto', label: 'App voice when available', detail: 'Use Nexus Plus voice services when available; otherwise use the device system voice.' },
  { value: 'system', label: 'System voice', detail: 'Always use the Android/iOS installed speech recognition and Text-to-Speech services.' },
];

function Selector({ title, detail, value, onChange }: { title: string; detail: string; value: FeatureTtsLanguage; onChange: (value: FeatureTtsLanguage) => void }) {
  const colors = useColors();
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.detail, { color: colors.mutedForeground }]}>{detail}</Text><View style={styles.options}>{options.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: value === option.value }} accessibilityLabel={option.label} onPress={() => onChange(option.value)} style={[styles.option, { borderColor: value === option.value ? colors.primary : colors.border, backgroundColor: value === option.value ? colors.secondary : colors.background }]}><Text style={{ color: colors.foreground, fontFamily: value === option.value ? 'Inter_700Bold' : 'Inter_500Medium' }}>{option.label}</Text>{value === option.value && <Feather name="check" size={17} color={colors.primary} />}</Pressable>)}</View></View>;
}

export default function LanguageAndPreferenceScreen() {
  const colors = useColors(); const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<LanguagePreferences>({ featureTtsLanguage: 'en-IN', bookReaderLanguage: 'en-IN', voiceEngine: 'auto' });
  useEffect(() => { void loadLanguagePreferences().then(setPrefs); }, []);
  const update = (next: LanguagePreferences) => { setPrefs(next); void saveLanguagePreferences(next); };
  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="globe" size={26} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Language and Preference</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>One global place for language and voice preferences used across Nexus Plus.</Text></View></View>
    <View style={styles.list}>
      <Selector title="Feature language" detail="Used by feature announcements, Nexus AI Workflow and other spoken app responses." value={prefs.featureTtsLanguage} onChange={(featureTtsLanguage) => update({ ...prefs, featureTtsLanguage })} />
      <Selector title="Book Reader language" detail="Controls the preferred voice language for Book Reader independently." value={prefs.bookReaderLanguage} onChange={(bookReaderLanguage) => update({ ...prefs, bookReaderLanguage })} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Voice engine</Text><Text style={[styles.detail, { color: colors.mutedForeground }]}>This is a global app preference, not an AI-specific setting.</Text><View style={styles.options}>{voiceOptions.map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: prefs.voiceEngine === option.value }} accessibilityLabel={`${option.label}. ${option.detail}`} onPress={() => update({ ...prefs, voiceEngine: option.value })} style={[styles.voiceOption, { borderColor: prefs.voiceEngine === option.value ? colors.primary : colors.border, backgroundColor: prefs.voiceEngine === option.value ? colors.secondary : colors.background }]}><View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{option.label}</Text><Text style={[styles.detail, { color: colors.mutedForeground }]}>{option.detail}</Text></View>{prefs.voiceEngine === option.value && <Feather name="check" size={18} color={colors.primary} />}</Pressable>)}</View></View>
    </View>
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }, icon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 4, fontSize: 12, lineHeight: 18 }, list: { paddingHorizontal: 20, gap: 12 }, card: { borderWidth: 1, borderRadius: 18, padding: 15 }, cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, detail: { marginTop: 4, fontSize: 11, lineHeight: 17 }, options: { marginTop: 13, gap: 8 }, option: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, voiceOption: { minHeight: 70, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' } });

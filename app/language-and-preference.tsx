import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { loadLanguagePreferences, saveLanguagePreferences, type FeatureTtsLanguage, type LanguagePreferences } from '@/features/language-preferences/languagePreferences';

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
  const [prefs, setPrefs] = useState<LanguagePreferences>({ featureTtsLanguage: 'en-IN', bookReaderLanguage: 'en-IN' });

  useEffect(() => { void loadLanguagePreferences().then(setPrefs); }, []);
  const update = (next: LanguagePreferences) => { setPrefs(next); void saveLanguagePreferences(next); };

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="globe" size={26} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Language and Preference</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose feature announcements and Book Reader languages independently.</Text></View></View>
    <View style={styles.list}>
      <Selector title="Select language for feature X" detail="Used by Time, Battery Announcer and other feature TTS announcements." value={prefs.featureTtsLanguage} onChange={(featureTtsLanguage) => update({ ...prefs, featureTtsLanguage })} />
      <Selector title="Select language for Book Reader" detail="Controls the preferred voice language for Book Reader without changing feature announcements." value={prefs.bookReaderLanguage} onChange={(bookReaderLanguage) => update({ ...prefs, bookReaderLanguage })} />
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }, icon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 4, fontSize: 12, lineHeight: 18 }, list: { paddingHorizontal: 20, gap: 12 }, card: { borderWidth: 1, borderRadius: 18, padding: 15 }, cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, detail: { marginTop: 4, fontSize: 11, lineHeight: 17 }, options: { marginTop: 13, gap: 8 }, option: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } });

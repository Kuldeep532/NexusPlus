import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { DEFAULT_LANGUAGE_PREFERENCES, loadLanguagePreferences, saveLanguagePreferences, type FeatureTtsLanguage, type LanguagePreferences } from '@/features/language-preferences/languagePreferences';

type LanguageOption = { value: FeatureTtsLanguage; title: string; detail: string };
const options: LanguageOption[] = [
  { value: 'en-IN', title: 'English', detail: 'English (India)' },
  { value: 'hi-IN', title: 'Hindi', detail: 'हिन्दी (भारत)' },
];

function LanguageChoice({ label, description, value, onChange }: { label: string; description: string; value: FeatureTtsLanguage; onChange: (value: FeatureTtsLanguage) => void }) {
  const colors = useColors();
  return (
    <View style={[styles.groupBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.headingRow}><Feather name="volume-2" size={20} color={colors.primary} /><View style={styles.copy}><Text style={[styles.choiceTitle, { color: colors.foreground }]}>{label}</Text><Text style={[styles.choiceDescription, { color: colors.mutedForeground }]}>{description}</Text></View></View>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = value === option.value;
          return <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${option.title}. ${option.detail}`} onPress={() => onChange(option.value)} style={[styles.option, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}><View style={[styles.radio, { borderColor: selected ? colors.primary : colors.mutedForeground }]}>{selected ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}</View><View style={styles.copy}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{option.title}</Text><Text style={[styles.optionDetail, { color: colors.mutedForeground }]}>{option.detail}</Text></View></Pressable>;
        })}
      </View>
    </View>
  );
}

export default function LanguageAndPreferenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [preferences, setPreferences] = useState<LanguagePreferences>(DEFAULT_LANGUAGE_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void loadLanguagePreferences().then((value) => {
      if (active) setPreferences(value);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const update = async (next: LanguagePreferences) => {
    setPreferences(next);
    setSaving(true);
    try { await saveLanguagePreferences(next); } finally { setSaving(false); }
  };

  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /><Text style={{ color: colors.mutedForeground }}>Loading language preferences…</Text></View>;

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
      <View style={styles.header}><View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}><Feather name="globe" size={27} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Language and Preference</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Choose speech languages independently for app features and Book Reader.</Text></View></View>
      <View style={[styles.info, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="info" size={18} color={colors.primary} /><Text style={[styles.infoText, { color: colors.mutedForeground }]}>Changing one option does not change the other.</Text></View>
      <LanguageChoice label="Select language for feature X" description="Used by Time Assisted, Battery Announcer, and other feature announcements." value={preferences.featureTtsLanguage} onChange={(value) => void update({ ...preferences, featureTtsLanguage: value })} />
      <LanguageChoice label="Select language for Book Reader" description="Controls the preferred TTS language used by Book Reader when a matching voice is available." value={preferences.bookReaderLanguage} onChange={(value) => void update({ ...preferences, bookReaderLanguage: value })} />
      <View style={styles.saved}><Text accessibilityLiveRegion="polite" style={{ color: colors.mutedForeground }}>{saving ? 'Saving…' : 'Preferences saved automatically.'}</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }, screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }, headerIcon: { width: 56, height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 4, fontSize: 12, lineHeight: 18 }, info: { marginHorizontal: 20, borderRadius: 15, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 22 }, infoText: { flex: 1, fontSize: 12, lineHeight: 17 }, groupBox: { marginHorizontal: 20, borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 16 }, headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, choiceTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, choiceDescription: { marginTop: 3, fontSize: 11, lineHeight: 16 }, options: { marginTop: 13, gap: 9 }, option: { minHeight: 66, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, dot: { width: 10, height: 10, borderRadius: 5 }, optionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' }, optionDetail: { marginTop: 2, fontSize: 10 }, saved: { alignItems: 'center', paddingHorizontal: 20, marginTop: 3 },
});

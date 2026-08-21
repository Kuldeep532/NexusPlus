import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { DEFAULT_ANNOUNCEMENT_SETTINGS } from '@/features/time-assisted/timeAssistedTypes';
import { speakTimeAssisted } from '@/features/time-assisted/speech';

export default function TimeAnnouncementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState(DEFAULT_ANNOUNCEMENT_SETTINGS);
  const [busy, setBusy] = useState(false);
  const now = useMemo(() => new Date(), []);
  const current = new Intl.DateTimeFormat(settings.language, { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(now);

  const announce = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await speakTimeAssisted(settings, new Date());
      AccessibilityInfo.announceForAccessibility('Current time announced with beep.');
    } finally {
      setBusy(false);
    }
  };

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}><Feather name="volume-2" size={26} color={colors.primary} /><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Time Announcement</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>A beep plays first, then your configured voice announces time and date.</Text></View></View>
    <View accessible accessibilityRole="text" accessibilityLabel={`Current time ${current}`} style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.label, { color: colors.mutedForeground }]}>Current time</Text><Text style={[styles.time, { color: colors.foreground }]}>{current}</Text><Pressable accessibilityRole="button" accessibilityLabel="Announce current time with beep" onPress={() => void announce()} style={[styles.button, { backgroundColor: colors.primary }]}><Feather name="play" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? 'Announcing…' : 'Announce now'}</Text></Pressable></View>
    <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Announcement details</Text>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: settings.includeDay }} onPress={() => setSettings((s) => ({ ...s, includeDay: !s.includeDay }))} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.rowText, { color: colors.foreground }]}>Include day of week</Text><Text style={[styles.value, { color: colors.primary }]}>{settings.includeDay ? 'On' : 'Off'}</Text></Pressable>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: settings.includeDate }} onPress={() => setSettings((s) => ({ ...s, includeDate: !s.includeDate }))} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.rowText, { color: colors.foreground }]}>Include date</Text><Text style={[styles.value, { color: colors.primary }]}>{settings.includeDate ? 'On' : 'Off'}</Text></Pressable>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }, copy: { flex: 1 }, title: { fontSize: 26, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 3, fontSize: 12, lineHeight: 17 }, hero: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 22, alignItems: 'center' }, label: { fontSize: 12 }, time: { marginTop: 5, fontSize: 34, fontFamily: 'Inter_700Bold' }, button: { marginTop: 20, minHeight: 48, borderRadius: 15, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8 }, buttonText: { fontFamily: 'Inter_700Bold' }, section: { paddingHorizontal: 20, marginTop: 26, gap: 10 }, sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' }, row: { minHeight: 58, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, rowText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' }, value: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});

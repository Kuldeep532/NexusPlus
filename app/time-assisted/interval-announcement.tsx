import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { DEFAULT_ANNOUNCEMENT_SETTINGS } from '@/features/time-assisted/timeAssistedTypes';
import { speakTimeAssisted } from '@/features/time-assisted/speech';

export default function IntervalAnnouncementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(false);
  const [minutes, setMinutes] = useState<15 | 30 | 60>(30);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      void speakTimeAssisted({ ...DEFAULT_ANNOUNCEMENT_SETTINGS, enabled: true, intervalMinutes: minutes }).then(() => setCount((value) => value + 1));
    }, minutes * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, minutes]);

  const announceNow = async () => {
    await speakTimeAssisted({ ...DEFAULT_ANNOUNCEMENT_SETTINGS, enabled: true, intervalMinutes: minutes });
    AccessibilityInfo.announceForAccessibility('Time announced.');
  };

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}><Feather name="repeat" size={26} color={colors.primary} /><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Interval Time Announcement</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Hands-free recurring announcements with the same Voice Library and beep cue.</Text></View></View>
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: enabled }} onPress={() => setEnabled((value) => !value)} style={[styles.toggle, { backgroundColor: enabled ? colors.primary : colors.secondary }]}><Text style={{ color: enabled ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_700Bold' }}>{enabled ? 'Enabled' : 'Disabled'}</Text></Pressable>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>Announce every</Text>
      <View style={styles.chips}>{[15, 30, 60].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: minutes === value }} onPress={() => setMinutes(value as 15 | 30 | 60)} style={[styles.chip, { borderColor: colors.border }, minutes === value && { backgroundColor: colors.primary, borderColor: colors.primary }]}><Text style={{ color: minutes === value ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_600SemiBold' }}>{value} min</Text></Pressable>)}</View>
      <Pressable accessibilityRole="button" accessibilityLabel="Announce time now" onPress={() => void announceNow()} style={[styles.button, { backgroundColor: colors.primary }]}><Feather name="volume-2" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Announce now</Text></Pressable>
      <Text style={[styles.status, { color: colors.mutedForeground }]}>{enabled ? `Automatic announcements active. ${count} announcement${count === 1 ? '' : 's'} made in this session.` : 'Automatic announcements are off.'}</Text>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }, copy: { flex: 1 }, title: { fontSize: 26, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 3, fontSize: 12, lineHeight: 17 }, card: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 20 }, toggle: { alignSelf: 'flex-start', minHeight: 42, borderRadius: 21, paddingHorizontal: 16, justifyContent: 'center' }, label: { marginTop: 22, fontSize: 12 }, chips: { flexDirection: 'row', gap: 8, marginTop: 8 }, chip: { minHeight: 42, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' }, button: { marginTop: 20, minHeight: 48, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonText: { fontFamily: 'Inter_700Bold' }, status: { marginTop: 14, lineHeight: 18, fontSize: 11 },
});

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function formatDuration(totalMinutes: number) {
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days ? `${days} day${days === 1 ? '' : 's'}, ` : ''}${hours} hour${hours === 1 ? '' : 's'} and ${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export default function TimeDifferenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('17:30');
  const result = useMemo(() => {
    const a = parseTime(start);
    const b = parseTime(end);
    if (a === null || b === null) return null;
    return ((b - a) + 1440) % 1440;
  }, [start, end]);

  const input = (label: string, value: string, setter: (v: string) => void) => <View style={styles.field}><Text style={[styles.label, { color: colors.foreground }]}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={setter} keyboardType="numbers-and-punctuation" maxLength={5} placeholder="HH:MM" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]} /></View>;

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Time Difference</Text>
    <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Compare two times without doing the math yourself. Enter 24-hour HH:MM values.</Text>
    {input('Start time', start, setStart)}
    {input('End time', end, setEnd)}
    <View style={[styles.result, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>Duration</Text><Text accessibilityLiveRegion="polite" style={[styles.resultValue, { color: colors.foreground }]}>{result === null ? 'Enter valid times' : formatDuration(result)}</Text></View>
    <Pressable accessibilityRole="button" onPress={() => { setStart('09:00'); setEnd('17:30'); }} style={[styles.secondary, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Reset example</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, paddingHorizontal: 20 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 5, fontSize: 12, lineHeight: 18, marginBottom: 22 }, field: { gap: 7, marginBottom: 15 }, label: { fontSize: 13, fontFamily: 'Inter_600SemiBold' }, input: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 15, fontSize: 18, fontFamily: 'Inter_600SemiBold' }, result: { borderRadius: 19, borderWidth: 1, padding: 20, marginTop: 5 }, resultLabel: { fontSize: 12 }, resultValue: { marginTop: 5, fontSize: 22, fontFamily: 'Inter_700Bold', lineHeight: 30 }, secondary: { minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
});

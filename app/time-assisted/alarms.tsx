import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Alarm = { id: string; hour: number; minute: number; enabled: boolean };

function formatAlarm(hour: number, minute: number) {
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export default function AlarmsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const addAlarm = () => {
    const next = new Date(Date.now() + 10 * 60 * 1000);
    const alarm = { id: `alarm-${Date.now()}`, hour: next.getHours(), minute: next.getMinutes(), enabled: true };
    setAlarms((items) => [alarm, ...items]);
    AccessibilityInfo.announceForAccessibility(`Alarm set for ${formatAlarm(alarm.hour, alarm.minute)}.`);
  };

  const toggle = (id: string) => setAlarms((items) => items.map((alarm) => alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm));
  const remove = (id: string) => setAlarms((items) => items.filter((alarm) => alarm.id !== id));

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Alarms</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create and manage quick reminders.</Text></View><Pressable accessibilityRole="button" onPress={addAlarm} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="plus" size={17} color={colors.primaryForeground} /><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>Add</Text></Pressable></View>
    <View style={styles.list}>{alarms.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No alarms yet. Add a quick alarm to test the timing flow.</Text> : alarms.map((alarm) => <View key={alarm.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.copy}><Text style={[styles.time, { color: colors.foreground }]}>{formatAlarm(alarm.hour, alarm.minute)}</Text><Text style={[styles.state, { color: colors.mutedForeground }]}>{alarm.enabled ? 'Enabled' : 'Disabled'}</Text></View><Pressable accessibilityRole="switch" accessibilityState={{ checked: alarm.enabled }} onPress={() => toggle(alarm.id)} style={[styles.toggle, { backgroundColor: alarm.enabled ? colors.primary : colors.secondary }]}><Text style={{ color: alarm.enabled ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_700Bold' }}>{alarm.enabled ? 'On' : 'Off'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete alarm ${formatAlarm(alarm.hour, alarm.minute)}`} onPress={() => remove(alarm.id)} style={styles.delete}><Feather name="trash-2" size={18} color={colors.mutedForeground} /></Pressable></View>)}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }, copy: { flex: 1 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 3, fontSize: 12 }, add: { minHeight: 44, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }, list: { paddingHorizontal: 20, gap: 10 }, empty: { fontSize: 13, lineHeight: 19 }, card: { minHeight: 76, borderRadius: 17, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }, time: { fontSize: 20, fontFamily: 'Inter_700Bold' }, state: { marginTop: 2, fontSize: 11 }, toggle: { minWidth: 58, minHeight: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, delete: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
});

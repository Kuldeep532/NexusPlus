import { Feather } from '@expo/vector-icons';
import { NativeModules } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ALARM_SOUNDS, type AlarmSound } from '@/features/time-announcer/timeAnnouncerTypes';
import { loadPersistedAlarms, savePersistedAlarms, type PersistedAlarm } from '@/features/time-assisted/alarmStorage';

type Alarm = PersistedAlarm;

type NativeAlarmBridge = {
  canScheduleExactAlarms: () => Promise<boolean>;
  persistDefinitions: (json: string) => Promise<boolean>;
  schedule: (id: string, hour: number, minute: number) => Promise<{ scheduled: boolean; reason?: string }>;
  cancel: (id: string) => Promise<boolean>;
};

function formatAlarm(hour: number, minute: number) {
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

function findSound(soundId: string): AlarmSound {
  return ALARM_SOUNDS.find((item) => item.id === soundId) ?? ALARM_SOUNDS[0];
}

const nativeAlarm = NativeModules.NexusAlarm as NativeAlarmBridge | undefined;

export default function AlarmsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  const persist = useCallback(async (next: Alarm[]) => {
    try {
      await savePersistedAlarms(next);
      if (nativeAlarm) {
        await nativeAlarm.persistDefinitions(JSON.stringify(next));
      }
      setAlarms(next);
    } catch {
      AccessibilityInfo.announceForAccessibility('Alarm settings could not be saved.');
    }
  }, []);

  const schedule = useCallback(async (alarm: Alarm): Promise<boolean> => {
    if (!nativeAlarm) {
      Alert.alert('Alarm unavailable', 'The native alarm scheduler is not available in this build.');
      return false;
    }
    try {
      const result = await nativeAlarm.schedule(alarm.id, alarm.hour, alarm.minute);
      if (result.scheduled) return true;
      if (result.reason === 'exact_alarm_permission') {
        Alert.alert('Exact alarm permission required', 'Enable exact alarms for Nexus Plus in Android settings before enabling this alarm.');
      } else {
        Alert.alert('Alarm unavailable', 'Nexus Plus could not schedule this alarm.');
      }
      return false;
    } catch {
      Alert.alert('Alarm unavailable', 'Nexus Plus could not schedule this alarm.');
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadPersistedAlarms().then(async (saved) => {
      if (!mounted) return;
      setAlarms(saved);
      setLoading(false);
      const enabled = saved.filter((alarm) => alarm.enabled);
      for (const alarm of enabled) await schedule(alarm);
      if (nativeAlarm) await nativeAlarm.persistDefinitions(JSON.stringify(saved));
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [schedule]);

  const addAlarm = async () => {
    const next = new Date(Date.now() + 10 * 60 * 1000);
    const alarm: Alarm = {
      id: `alarm-${Date.now()}`,
      hour: next.getHours(),
      minute: next.getMinutes(),
      enabled: false,
      soundId: ALARM_SOUNDS[0].id,
    };
    if (!(await schedule(alarm))) return;
    const enabledAlarm = { ...alarm, enabled: true };
    await persist([enabledAlarm, ...alarms]);
    AccessibilityInfo.announceForAccessibility(`Alarm set for ${formatAlarm(alarm.hour, alarm.minute)}. Sound ${findSound(alarm.soundId).displayName}.`);
  };

  const toggle = async (id: string) => {
    const current = alarms.find((alarm) => alarm.id === id);
    if (!current) return;
    if (current.enabled) {
      try { await nativeAlarm?.cancel(id); } catch { /* best-effort cancellation */ }
      await persist(alarms.map((alarm) => alarm.id === id ? { ...alarm, enabled: false } : alarm));
      return;
    }
    if (!(await schedule(current))) return;
    await persist(alarms.map((alarm) => alarm.id === id ? { ...alarm, enabled: true } : alarm));
  };

  const remove = async (id: string) => {
    try { await nativeAlarm?.cancel(id); } catch { /* best-effort cancellation */ }
    await persist(alarms.filter((alarm) => alarm.id !== id));
  };

  const cycleSound = async (id: string) => {
    const current = alarms.find((alarm) => alarm.id === id);
    if (!current) return;
    const index = ALARM_SOUNDS.findIndex((item) => item.id === current.soundId);
    const nextSound = ALARM_SOUNDS[(index + 1) % ALARM_SOUNDS.length];
    const next = alarms.map((alarm) => alarm.id === id ? { ...alarm, soundId: nextSound.id } : alarm);
    if (current.enabled && nativeAlarm) {
      try { await nativeAlarm.cancel(id); } catch { /* best-effort cancellation */ }
      if (!(await schedule({ ...current, soundId: nextSound.id }))) return;
    }
    await persist(next);
    void AccessibilityInfo.announceForAccessibility(`Alarm sound changed to ${nextSound.displayName}.`);
  };

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Alarms</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create and manage reminders that survive app restarts.</Text></View><Pressable disabled={loading} accessibilityRole="button" onPress={() => void addAlarm()} style={[styles.add, { backgroundColor: colors.primary }, loading && styles.disabled]}><Feather name="plus" size={17} color={colors.primaryForeground} /><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>Add</Text></Pressable></View>
    <View style={styles.list}>{alarms.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No alarms yet. Add a quick alarm to test the timing flow.</Text> : alarms.map((alarm) => <View key={alarm.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.copy}><Text style={[styles.time, { color: colors.foreground }]}>{formatAlarm(alarm.hour, alarm.minute)}</Text><Text style={[styles.state, { color: colors.mutedForeground }]}>{alarm.enabled ? 'Enabled' : 'Disabled'}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Change alarm sound. Current sound ${findSound(alarm.soundId).displayName}`} onPress={() => void cycleSound(alarm.id)} style={[styles.soundButton, { borderColor: colors.border }]}><Feather name="volume-2" size={15} color={colors.primary} /><Text numberOfLines={1} style={[styles.soundName, { color: colors.foreground }]}>{findSound(alarm.soundId).displayName}</Text></Pressable></View><Pressable accessibilityRole="switch" accessibilityState={{ checked: alarm.enabled }} onPress={() => void toggle(alarm.id)} style={[styles.toggle, { backgroundColor: alarm.enabled ? colors.primary : colors.secondary }]}><Text style={{ color: alarm.enabled ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_700Bold' }}>{alarm.enabled ? 'On' : 'Off'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete alarm ${formatAlarm(alarm.hour, alarm.minute)}`} onPress={() => void remove(alarm.id)} style={styles.delete}><Feather name="trash-2" size={18} color={colors.mutedForeground} /></Pressable></View>)}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }, copy: { flex: 1 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 3, fontSize: 12 }, add: { minHeight: 44, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 }, list: { paddingHorizontal: 20, gap: 10 }, empty: { fontSize: 13, lineHeight: 19 }, card: { minHeight: 92, borderRadius: 17, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }, time: { fontSize: 20, fontFamily: 'Inter_700Bold' }, state: { marginTop: 2, fontSize: 11 }, soundButton: { marginTop: 7, minHeight: 36, borderRadius: 10, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 240 }, soundName: { fontSize: 11, fontFamily: 'Inter_600SemiBold', flexShrink: 1 }, toggle: { minWidth: 58, minHeight: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, delete: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.55 } });

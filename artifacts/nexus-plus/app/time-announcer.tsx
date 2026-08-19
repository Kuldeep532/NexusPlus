import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { configureAlarmNotifications, scheduleAlarm, cancelAlarm } from '@/features/time-announcer/alarmScheduler';
import { formatClockTime, formatCurrentTime, formatStopwatch, speakTime, chooseBestVoice } from '@/features/time-announcer/timeAnnouncerUtils';
import { DEFAULT_WORLD_CLOCKS } from '@/features/time-announcer/timeAnnouncerTypes';
import type { Alarm, TimeAnnouncementSettings } from '@/features/time-announcer/timeAnnouncerTypes';

function TimeCard({ city, country, zone }: { city: string; country: string; zone: string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={`${city}, ${country}. ${formatClockTime(now, zone)}.`} style={styles.clockCard}>
      <View style={styles.clockCopy}><Text style={styles.clockCity}>{city}</Text><Text style={styles.clockCountry}>{country}</Text></View>
      <Text style={styles.clockTime}>{formatClockTime(now, zone)}</Text>
    </View>
  );
}

export default function TimeAnnouncerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(new Date());
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const startedAt = useRef(0);
  const baseElapsed = useRef(0);
  const [announcementOn, setAnnouncementOn] = useState(true);
  const [announcementSettings, setAnnouncementSettings] = useState<TimeAnnouncementSettings>({
    enabled: true,
    intervalMinutes: 30,
    language: 'en-IN',
    rate: 0.92,
    pitch: 1.0,
  });
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [busyAlarm, setBusyAlarm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    void configureAlarmNotifications().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const timer = setInterval(() => setElapsed(baseElapsed.current + (Date.now() - startedAt.current)), 25);
    return () => clearInterval(timer);
  }, [isRunning]);

  useEffect(() => {
    if (!announcementOn || !announcementSettings.enabled) return;
    const id = setInterval(() => {
      void speakTime(announcementSettings);
    }, announcementSettings.intervalMinutes * 60 * 1000);
    return () => clearInterval(id);
  }, [announcementOn, announcementSettings]);

  const announceNow = useCallback(async () => {
    const voice = await chooseBestVoice(announcementSettings.language);
    const next = { ...announcementSettings, voiceIdentifier: voice };
    setAnnouncementSettings(next);
    await speakTime(next);
    AccessibilityInfo.announceForAccessibility('Current time announced.');
  }, [announcementSettings]);

  const toggleTimer = () => {
    if (isRunning) {
      const next = baseElapsed.current + (Date.now() - startedAt.current);
      baseElapsed.current = next;
      setElapsed(next);
      setIsRunning(false);
      AccessibilityInfo.announceForAccessibility('Stopwatch paused.');
    } else {
      startedAt.current = Date.now();
      baseElapsed.current = elapsed;
      setIsRunning(true);
      AccessibilityInfo.announceForAccessibility('Stopwatch started.');
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsed(0);
    baseElapsed.current = 0;
    setLaps([]);
    AccessibilityInfo.announceForAccessibility('Stopwatch reset.');
  };

  const addLap = () => {
    if (!isRunning) return;
    const value = baseElapsed.current + (Date.now() - startedAt.current);
    setLaps((current) => [value, ...current].slice(0, 10));
    AccessibilityInfo.announceForAccessibility(`Lap recorded at ${formatStopwatch(value)}.`);
  };

  const addAlarm = async () => {
    if (busyAlarm) return;
    setBusyAlarm(true);
    try {
      const date = new Date(Date.now() + 10 * 60 * 1000);
      const alarm: Alarm = {
        id: `alarm-${Date.now()}`,
        hour: date.getHours(),
        minute: date.getMinutes(),
        label: `Alarm at ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`,
        enabled: true,
        weekdays: [],
      };
      alarm.notificationId = await scheduleAlarm(alarm);
      setAlarms((current) => [alarm, ...current]);
      AccessibilityInfo.announceForAccessibility(`${alarm.label} set.`);
    } finally {
      setBusyAlarm(false);
    }
  };

  const removeAlarm = async (alarm: Alarm) => {
    await cancelAlarm(alarm.notificationId);
    setAlarms((current) => current.filter((item) => item.id !== alarm.id));
    AccessibilityInfo.announceForAccessibility(`${alarm.label} cancelled.`);
  };

  const currentTimeLabel = useMemo(() => formatCurrentTime(now), [now]);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, { borderColor: colors.border }, pressed && styles.pressed]}><Feather name="arrow-left" size={20} color={colors.foreground} /></Pressable>
        <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Time Announcer</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Time, clocks, stopwatch and alarms</Text></View>
      </View>

      <View accessible accessibilityRole="text" accessibilityLabel={`Current time. ${currentTimeLabel}.`} style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="clock-time-eight-outline" size={32} color={colors.primary} />
        <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>Current time</Text>
        <Text style={[styles.heroTime, { color: colors.foreground }]}>{currentTimeLabel}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Announce current time with high quality voice" onPress={() => void announceNow()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Announce time</Text></Pressable>
      </View>

      <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Time announcement</Text>
        <View style={[styles.settingRow, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.settingTitle, { color: colors.foreground }]}>Automatic announcement</Text><Pressable accessibilityRole="switch" accessibilityState={{ checked: announcementOn }} accessibilityLabel="Automatic time announcement" onPress={() => setAnnouncementOn((value) => !value)} style={[styles.switchButton, { backgroundColor: announcementOn ? colors.primary : colors.secondary }]}><Text style={styles.switchText}>{announcementOn ? 'On' : 'Off'}</Text></Pressable></View>
        <View style={[styles.chipsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {[15, 30, 60].map((minutes) => <Pressable key={minutes} accessibilityRole="radio" accessibilityState={{ selected: announcementSettings.intervalMinutes === minutes }} accessibilityLabel={`Announce every ${minutes} minutes`} onPress={() => setAnnouncementSettings((current) => ({ ...current, intervalMinutes: minutes as 15 | 30 | 60 }))} style={[styles.chip, announcementSettings.intervalMinutes === minutes && { backgroundColor: colors.primary }]}><Text style={[styles.chipText, { color: announcementSettings.intervalMinutes === minutes ? colors.primaryForeground : colors.foreground }]}>{minutes} min</Text></Pressable>)}
        </View>
      </View>

      <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>World clock</Text>{DEFAULT_WORLD_CLOCKS.map((clock) => <TimeCard key={clock.id} city={clock.city} country={clock.country} zone={clock.timeZone} />)}</View>

      <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Stopwatch</Text>
        <View accessible accessibilityRole="timer" accessibilityLabel={`Stopwatch ${formatStopwatch(elapsed)}.`} style={[styles.stopwatchCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.stopwatch, { color: colors.foreground }]}>{formatStopwatch(elapsed)}</Text><View style={styles.actionRow}><Pressable accessibilityRole="button" accessibilityLabel={isRunning ? 'Pause stopwatch' : 'Start stopwatch'} onPress={toggleTimer} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{isRunning ? 'Pause' : 'Start'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Reset stopwatch" onPress={resetTimer} style={[styles.secondaryAction, { borderColor: colors.border }]}><Text style={{ color: colors.foreground }}>Reset</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Record stopwatch lap" onPress={addLap} disabled={!isRunning} style={[styles.secondaryAction, { borderColor: colors.border, opacity: isRunning ? 1 : 0.4 }]}><Text style={{ color: colors.foreground }}>Lap</Text></Pressable></View>{laps.map((lap, index) => <Text key={`${lap}-${index}`} style={[styles.lap, { color: colors.mutedForeground }]}>Lap {laps.length - index}: {formatStopwatch(lap)}</Text>)}</View>
      </View>

      <View style={styles.section}><View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Alarms</Text><Pressable accessibilityRole="button" accessibilityLabel="Set a new alarm" onPress={() => void addAlarm()} style={[styles.addButton, { backgroundColor: colors.primary }]}><Feather name="plus" size={17} color={colors.primaryForeground} /><Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>{busyAlarm ? 'Setting…' : 'Set alarm'}</Text></Pressable></View>
        {alarms.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No alarms set. A test alarm can be added for 10 minutes from now.</Text> : alarms.map((alarm) => <View key={alarm.id} accessible accessibilityRole="text" accessibilityLabel={`${alarm.label}. Alarm enabled.`} style={[styles.alarmRow, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.alarmCopy}><Text style={[styles.alarmTime, { color: colors.foreground }]}>{new Date(0, 0, 0, alarm.hour, alarm.minute).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</Text><Text style={[styles.alarmLabel, { color: colors.mutedForeground }]}>{alarm.label}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Cancel ${alarm.label}`} onPress={() => void removeAlarm(alarm)}><Feather name="trash-2" size={19} color={colors.mutedForeground} /></Pressable></View>)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 20, gap: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, backButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 3, fontSize: 12, fontFamily: 'Inter_400Regular' }, heroCard: { marginHorizontal: 20, borderRadius: 22, borderWidth: 1, alignItems: 'center', padding: 24 }, heroLabel: { marginTop: 8, fontSize: 12 }, heroTime: { marginTop: 4, fontSize: 38, fontFamily: 'Inter_700Bold' }, section: { marginTop: 26, paddingHorizontal: 20, gap: 10 }, sectionTitle: { fontSize: 19, fontFamily: 'Inter_700Bold' }, settingRow: { minHeight: 58, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, settingTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' }, switchButton: { minWidth: 68, minHeight: 38, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, switchText: { color: '#fff', fontFamily: 'Inter_700Bold' }, chipsRow: { borderRadius: 15, borderWidth: 1, padding: 8, flexDirection: 'row', gap: 8 }, chip: { minHeight: 38, borderRadius: 19, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' }, chipText: { fontFamily: 'Inter_600SemiBold' }, clockCard: { minHeight: 68, borderRadius: 15, backgroundColor: 'rgba(127,127,127,0.08)', paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' }, clockCopy: { flex: 1 }, clockCity: { fontSize: 15, fontFamily: 'Inter_700Bold' }, clockCountry: { marginTop: 2, fontSize: 11, opacity: 0.72 }, clockTime: { fontSize: 18, fontFamily: 'Inter_700Bold' }, stopwatchCard: { borderRadius: 20, borderWidth: 1, padding: 20, alignItems: 'center' }, stopwatch: { fontSize: 36, fontFamily: 'Inter_700Bold', letterSpacing: 1 }, actionRow: { marginTop: 18, flexDirection: 'row', gap: 8, alignItems: 'center' }, primaryButton: { minHeight: 46, borderRadius: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }, primaryButtonText: { fontFamily: 'Inter_700Bold' }, secondaryAction: { minHeight: 46, borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }, lap: { alignSelf: 'stretch', marginTop: 8, fontSize: 12, fontFamily: 'Inter_500Medium' }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, addButton: { minHeight: 42, borderRadius: 14, paddingHorizontal: 13, gap: 6, flexDirection: 'row', alignItems: 'center' }, addButtonText: { fontFamily: 'Inter_700Bold', fontSize: 12 }, empty: { fontSize: 13, lineHeight: 19 }, alarmRow: { minHeight: 72, borderRadius: 16, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' }, alarmCopy: { flex: 1 }, alarmTime: { fontSize: 19, fontFamily: 'Inter_700Bold' }, alarmLabel: { marginTop: 3, fontSize: 11 }, pressed: { opacity: 0.76 },});

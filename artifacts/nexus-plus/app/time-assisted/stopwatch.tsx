import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

function formatStopwatch(milliseconds: number) {
  const centiseconds = Math.floor(milliseconds / 10) % 100;
  const seconds = Math.floor(milliseconds / 1000) % 60;
  const minutes = Math.floor(milliseconds / 60000) % 60;
  const hours = Math.floor(milliseconds / 3600000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

export default function StopwatchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [laps, setLaps] = useState<number[]>([]);
  const startedAt = useRef(0);
  const baseElapsed = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(baseElapsed.current + Date.now() - startedAt.current), 20);
    return () => clearInterval(id);
  }, [running]);

  const toggle = () => {
    if (running) {
      const next = baseElapsed.current + Date.now() - startedAt.current;
      baseElapsed.current = next;
      setElapsed(next);
      setRunning(false);
      AccessibilityInfo.announceForAccessibility('Stopwatch paused.');
      return;
    }
    startedAt.current = Date.now();
    baseElapsed.current = elapsed;
    setRunning(true);
    AccessibilityInfo.announceForAccessibility('Stopwatch started.');
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    baseElapsed.current = 0;
    setLaps([]);
    AccessibilityInfo.announceForAccessibility('Stopwatch reset.');
  };

  const lap = () => {
    if (!running) return;
    const value = baseElapsed.current + Date.now() - startedAt.current;
    setLaps((items) => [value, ...items].slice(0, 50));
    AccessibilityInfo.announceForAccessibility(`Lap ${laps.length + 1}: ${formatStopwatch(value)}.`);
  };

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Stopwatch</Text>
    <View accessible accessibilityRole="timer" accessibilityLabel={`Stopwatch ${formatStopwatch(elapsed)}.`} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.time, { color: colors.foreground }]}>{formatStopwatch(elapsed)}</Text>
      <View style={styles.actions}><Pressable accessibilityRole="button" onPress={toggle} style={[styles.primary, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>{running ? 'Pause' : 'Start'}</Text></Pressable><Pressable accessibilityRole="button" onPress={reset} style={[styles.secondary, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Reset</Text></Pressable><Pressable accessibilityRole="button" disabled={!running} onPress={lap} style={[styles.secondary, { borderColor: colors.border, opacity: running ? 1 : 0.45 }]}><Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Lap</Text></Pressable></View>
      {laps.map((value, index) => <View key={`${value}-${index}`} style={[styles.lap, { borderBottomColor: colors.border }]}><Text style={{ color: colors.mutedForeground }}>Lap {laps.length - index}</Text><Text style={[styles.lapTime, { color: colors.foreground }]}>{formatStopwatch(value)}</Text></View>)}
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 18 }, card: { borderRadius: 20, borderWidth: 1, padding: 20 }, time: { fontSize: 40, fontFamily: 'Inter_700Bold', textAlign: 'center', letterSpacing: 1 }, actions: { marginTop: 20, flexDirection: 'row', gap: 8, justifyContent: 'center' }, primary: { minHeight: 48, borderRadius: 14, minWidth: 100, alignItems: 'center', justifyContent: 'center' }, secondary: { minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }, lap: { minHeight: 46, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, lapTime: { fontFamily: 'Inter_600SemiBold' },
});

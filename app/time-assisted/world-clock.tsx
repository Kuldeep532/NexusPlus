import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { DEFAULT_WORLD_CLOCKS } from '@/features/time-assisted/timeAssistedTypes';

function formatClock(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-IN', { timeZone, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(date);
}

function formatDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-IN', { timeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(date);
}

export default function WorldClockScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
      <View style={styles.header}><MaterialCommunityIcons name="earth" size={28} color={colors.primary} /><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>World Clock</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Live local time across selected cities.</Text></View></View>
      <View style={styles.list}>
        {DEFAULT_WORLD_CLOCKS.map((clock) => <View key={clock.id} accessible accessibilityRole="text" accessibilityLabel={`${clock.city}, ${clock.country}. ${formatClock(now, clock.timeZone)}. ${formatDate(now, clock.timeZone)}.`} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.copy}><Text style={[styles.city, { color: colors.foreground }]}>{clock.city}</Text><Text style={[styles.country, { color: colors.mutedForeground }]}>{clock.country}</Text><Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate(now, clock.timeZone)}</Text></View><Text style={[styles.time, { color: colors.foreground }]}>{formatClock(now, clock.timeZone)}</Text>
        </View>)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }, copy: { flex: 1 }, title: { fontSize: 26, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 3, fontSize: 12 }, list: { paddingHorizontal: 20, gap: 10 }, card: { minHeight: 88, borderRadius: 17, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 13, flexDirection: 'row', alignItems: 'center' }, city: { fontSize: 16, fontFamily: 'Inter_700Bold' }, country: { marginTop: 2, fontSize: 11 }, date: { marginTop: 7, fontSize: 11 }, time: { fontSize: 20, fontFamily: 'Inter_700Bold' },
});

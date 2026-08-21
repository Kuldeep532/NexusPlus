import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Tool = {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  route: string;
};

const tools: Tool[] = [
  { key: 'clock', title: 'World Clock', subtitle: 'Track time across cities and time zones', icon: 'earth', route: '/time-assisted/world-clock' },
  { key: 'announce', title: 'Time Announcement', subtitle: 'Announce the current time with your selected voice', icon: 'bullhorn-outline', route: '/time-assisted/time-announcement' },
  { key: 'interval', title: 'Interval Time Announcement', subtitle: 'Announce time automatically at your chosen interval', icon: 'timer-outline', route: '/time-assisted/interval-announcement' },
  { key: 'stopwatch', title: 'Stopwatch', subtitle: 'Precise stopwatch with laps and spoken state feedback', icon: 'stopwatch-outline', route: '/time-assisted/stopwatch' },
  { key: 'alarm', title: 'Alarms', subtitle: 'Quick time-based reminders with accessible controls', icon: 'alarm', route: '/time-assisted/alarms' },
  { key: 'difference', title: 'Time Difference', subtitle: 'Compare two times and get the exact duration', icon: 'swap-horizontal-bold', route: '/time-assisted/time-difference' },
];

export default function TimeAssistedScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: insets.bottom + 40 }}>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="clock-time-eight-outline" size={32} color={colors.primary} /></View>
        <View style={styles.heroCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Time Assisted</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Accessible time tools, organized into dedicated screens.</Text>
        </View>
      </View>

      <View style={styles.list}>
        {tools.map((tool) => (
          <Pressable key={tool.key} accessibilityRole="button" accessibilityLabel={`Open ${tool.title}. ${tool.subtitle}`} onPress={() => router.push(tool.route as never)} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={tool.icon} size={23} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{tool.title}</Text><Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>{tool.subtitle}</Text></View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      <View style={[styles.note, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="access-point" size={21} color={colors.primary} />
        <View style={styles.copy}><Text style={[styles.noteTitle, { color: colors.foreground }]}>More than a clock</Text><Text style={[styles.noteText, { color: colors.mutedForeground }]}>Time Assisted is designed for quick voice-first access, precise timing, time-zone comparison, and spoken feedback.</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { marginTop: 4, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  list: { paddingHorizontal: 20, gap: 10 },
  card: { minHeight: 80, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginHorizontal: 13 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  cardSubtitle: { marginTop: 3, fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  note: { margin: 20, borderRadius: 18, borderWidth: 1, padding: 15, flexDirection: 'row', alignItems: 'flex-start' },
  noteTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  noteText: { marginTop: 4, fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});

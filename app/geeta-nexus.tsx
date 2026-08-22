import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { GITA_CHAPTERS } from '@/features/geeta-nexus/geetaTypes';
import { getDailySpiritualMessage } from '@/features/spiritual/spiritualMessageLibrary';

export default function GeetaNexusHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const daily = getDailySpiritualMessage();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 90 }}>
        <Text style={[styles.kicker, { color: colors.primary }]}>GEETA NEXUS</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Bhagavad Gita</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Study, listen and explore the Gita.</Text>

        <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="flower" size={24} color={colors.primary} />
          <View style={styles.messageCopy}>
            <Text style={[styles.cardKicker, { color: colors.primary }]}>TODAY'S REFLECTION</Text>
            <Text style={[styles.message, { color: colors.foreground }]}>{daily.text}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Audio Chapters</Text>
        <View style={styles.list}>
          {GITA_CHAPTERS.slice(0, 5).map((chapter) => (
            <Pressable key={chapter.number} accessibilityRole="button" accessibilityLabel={`Play Chapter ${chapter.number}, ${chapter.nameEnglish}`} onPress={() => router.push('/media-player' as never)} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="play" size={18} color={colors.primary} /></View>
              <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Chapter {chapter.number}</Text><Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>{chapter.nameEnglish} · {chapter.verseCount} verses</Text></View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View><Text style={[styles.statNumber, { color: colors.foreground }]}>18</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Chapters</Text></View>
          <View><Text style={[styles.statNumber, { color: colors.foreground }]}>700+</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Verses</Text></View>
          <View><Text style={[styles.statNumber, { color: colors.foreground }]}>Offline</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Library ready</Text></View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geeta Nexus Home" style={styles.tab} onPress={() => router.replace('/geeta-nexus' as never)}><Feather name="home" size={20} color={colors.primary} /><Text style={[styles.tabLabel, { color: colors.primary }]}>Home</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Bhagavad Gita Chapters" style={styles.tab} onPress={() => router.push('/geeta-nexus/chapters' as never)}><Feather name="book" size={20} color={colors.foreground} /><Text style={[styles.tabLabel, { color: colors.foreground }]}>Chapters</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kicker: { fontSize: 10, letterSpacing: 1.7, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginBottom: 18 },
  messageCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 22 },
  messageCopy: { flex: 1, marginLeft: 11 },
  cardKicker: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  message: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  list: { gap: 10 },
  row: { minHeight: 72, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 11, marginRight: 8 },
  rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  rowMeta: { fontSize: 10, lineHeight: 15 },
  statCard: { marginTop: 18, borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', justifyContent: 'space-between' },
  statNumber: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  statLabel: { fontSize: 9.5 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 64, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 },
  tab: { alignItems: 'center', justifyContent: 'center', minWidth: 110, gap: 3 },
  tabLabel: { fontSize: 10, fontFamily: 'Inter_700Bold' },
});

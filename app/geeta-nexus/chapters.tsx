import { Feather } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { GITA_CHAPTERS } from '@/features/geeta-nexus/geetaTypes';

export default function GeetaNexusChapters() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 90 }}>
        <Text style={[styles.kicker, { color: colors.primary }]}>GEETA NEXUS</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>All Chapters</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Explore all 18 chapters and their verse counts.</Text>

        <View style={styles.list}>
          {GITA_CHAPTERS.map((chapter) => (
            <Pressable key={chapter.number} accessibilityRole="button" accessibilityLabel={`Chapter ${chapter.number}. ${chapter.nameEnglish}. ${chapter.verseCount} verses.`} onPress={() => router.push('/geeta-nexus' as never)} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.number, { backgroundColor: colors.secondary }]}><Text style={[styles.numberText, { color: colors.primary }]}>{chapter.number}</Text></View>
              <View style={styles.copy}>
                <Text style={[styles.hindi, { color: colors.foreground }]}>{chapter.nameHindi}</Text>
                <Text style={[styles.english, { color: colors.mutedForeground }]}>{chapter.nameEnglish}</Text>
                <Text style={[styles.summary, { color: colors.mutedForeground }]}>{chapter.summary}</Text>
              </View>
              <View style={styles.meta}><Text style={[styles.verseCount, { color: colors.foreground }]}>{chapter.verseCount}</Text><Text style={[styles.verseLabel, { color: colors.mutedForeground }]}>verses</Text></View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geeta Nexus Home" style={styles.tab} onPress={() => router.replace('/geeta-nexus' as never)}><Feather name="home" size={20} color={colors.foreground} /><Text style={[styles.tabLabel, { color: colors.foreground }]}>Home</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Bhagavad Gita Chapters" style={styles.tab} onPress={() => router.replace('/geeta-nexus/chapters' as never)}><Feather name="book" size={20} color={colors.primary} /><Text style={[styles.tabLabel, { color: colors.primary }]}>Chapters</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  kicker: { fontSize: 10, letterSpacing: 1.7, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginBottom: 18 },
  list: { gap: 10 },
  row: { minHeight: 92, borderWidth: 1, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center' },
  number: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  copy: { flex: 1, marginHorizontal: 11 },
  hindi: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  english: { fontSize: 10.5, marginBottom: 4 },
  summary: { fontSize: 9.5, lineHeight: 14 },
  meta: { minWidth: 43, alignItems: 'center' },
  verseCount: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  verseLabel: { fontSize: 8.5, marginTop: 2 },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 64, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 },
  tab: { alignItems: 'center', justifyContent: 'center', minWidth: 110, gap: 3 },
  tabLabel: { fontSize: 10, fontFamily: 'Inter_700Bold' },
});

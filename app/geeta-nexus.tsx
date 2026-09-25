import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { ScrollView, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { GITA_CHAPTERS } from '@/features/geeta-nexus/geetaTypes';
import { loadCachedVerseBundle } from '@/features/geeta-nexus/geetaStage5Repository';
import { getDailySpiritualMessage } from '@/features/spiritual/spiritualMessageLibrary';
import { getAllReadingProgress, type ReadingProgress } from '@/features/geeta-nexus/geetaReadingProgress';
import { useEffect, useState } from 'react';

export default function GeetaNexusHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const daily = getDailySpiritualMessage();
  const [cachedVerses, setCachedVerses] = useState(0);
  const [cacheVersion, setCacheVersion] = useState<string | null>(null);
  const [progress, setProgress] = useState<ReadingProgress[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([loadCachedVerseBundle(), getAllReadingProgress()]).then(([bundle, saved]) => {
      if (!active) return;
      if (bundle) {
        setCachedVerses(bundle.verses.length);
        setCacheVersion(bundle.version);
      }
      setProgress(saved);
    });
    return () => { active = false; };
  }, []);

  const currentProgress = progress.find((item) => item.textId === 'bhagavad-gita') ?? null;
  const continueLabel = currentProgress
    ? `Continue Chapter ${currentProgress.chapter}, Verse ${currentProgress.verse}`
    : 'Start Bhagavad Gita';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 18, paddingBottom: insets.bottom + 90 }}>
        <View style={styles.topRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: colors.primary }]}>GEETA NEXUS</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Bhagavad Gita</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Read, resume and listen to the Bhagavad Gita inside Nexus Plus.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back to Nexus Plus Home" onPress={() => router.replace('/(tabs)' as never)} style={[styles.settingsButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={[styles.quickCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open Open Assets" onPress={() => router.push('/open-assets' as never)} style={styles.quickButton}>
            <View style={[styles.quickIcon, { backgroundColor: colors.secondary }]}><Feather name="archive" size={19} color={colors.primary} /></View>
            <View style={styles.quickCopy}>
              <Text style={[styles.quickTitle, { color: colors.foreground }]}>Open Assets</Text>
              <Text style={[styles.quickMeta, { color: colors.mutedForeground }]}>All supplied Gita and Upanishad datasets</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={[styles.gitaFocusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.gitaFocusCopy}>
            <Text style={[styles.gitaFocusLabel, { color: colors.primary }]}>PRIMARY LIBRARY</Text>
            <Text style={[styles.gitaFocusTitle, { color: colors.foreground }]}>Bhagavad Gita</Text>
            <Text style={[styles.gitaFocusText, { color: colors.mutedForeground }]}>The main Geeta Nexus reading experience contains only the Bhagavad Gita.</Text>
          </View>
          <Feather name="book-open" size={22} color={colors.primary} />
        </View>

        <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="flower" size={24} color={colors.primary} />
          <View style={styles.messageCopy}>
            <Text style={[styles.cardKicker, { color: colors.primary }]}>TODAY'S REFLECTION</Text>
            <Text style={[styles.message, { color: colors.foreground }]}>{daily.text}</Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel={continueLabel} onPress={() => router.push(currentProgress ? `/geeta-nexus/read?chapter=${currentProgress.chapter}&verse=${currentProgress.verse}` as never : '/geeta-nexus/read?chapter=1&verse=1' as never)} style={[styles.continueCard, { backgroundColor: colors.primary }]}>
            <View style={styles.continueCopy}>
              <Text style={[styles.cardKicker, { color: colors.primaryForeground }]}>CONTINUE READING</Text>
              <Text style={[styles.continueTitle, { color: colors.primaryForeground }]}>{continueLabel}</Text>
            </View>
            <Feather name="play" size={20} color={colors.primaryForeground} />
        </Pressable>

        {!!progress.length && (
          <View style={[styles.previousCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Previously Read</Text>
              <Feather name="clock" size={18} color={colors.primary} />
            </View>
            {progress.map((item) => (
              <Pressable key={item.textId} accessibilityRole="button" accessibilityLabel={`Resume ${item.textId}. Chapter ${item.chapter}, verse ${item.verse}`} onPress={() => { setSelectedText(item.textId); if (item.textId === 'bhagavad-gita') router.push(`/geeta-nexus/read?chapter=${item.chapter}&verse=${item.verse}` as never); }} style={[styles.progressRow, { borderTopColor: colors.border }]}>
                <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.textId === 'bhagavad-gita' ? 'Bhagavad Gita' : 'Ramcharitmanas'}</Text><Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>Chapter {item.chapter}, Verse {item.verse}</Text></View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}

        {gitaAvailable && (
          <>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View><Text style={[styles.statNumber, { color: colors.foreground }]}>18</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Chapters</Text></View>
              <View><Text style={[styles.statNumber, { color: colors.foreground }]}>{cachedVerses || '—'}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Cached verses</Text></View>
              <View><Text style={[styles.statNumber, { color: colors.foreground }]}>{cacheVersion ? 'Offline' : 'Library'}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{cacheVersion ? `v${cacheVersion}` : 'Local data'}</Text></View>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 22 }]}>All Chapters</Text>
            <View style={styles.list}>
              {GITA_CHAPTERS.map((chapter) => (
                <Pressable key={chapter.number} accessibilityRole="button" accessibilityLabel={`Open Chapter ${chapter.number}, ${chapter.nameEnglish}`} onPress={() => router.push(`/geeta-nexus/chapters?chapter=${chapter.number}` as never)} style={[styles.chapterRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="book-open" size={18} color={colors.primary} /></View>
                  <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Chapter {chapter.number}</Text><Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>{chapter.nameEnglish} · {chapter.verseCount} verses</Text></View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
          </>
        )}

      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Return to Nexus Plus Home" style={styles.tab} onPress={() => router.replace('/(tabs)' as never)}><Feather name="home" size={20} color={colors.primary} /><Text style={[styles.tabLabel, { color: colors.primary }]}>Nexus Plus</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Bhagavad Gita Chapters" style={styles.tab} onPress={() => router.push('/geeta-nexus/read?chapter=1&verse=1' as never)}><Feather name="book" size={20} color={colors.foreground} /><Text style={[styles.tabLabel, { color: colors.foreground }]}>Chapters</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 12 },
  kicker: { fontSize: 10, letterSpacing: 1.7, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 12, lineHeight: 18, marginBottom: 18 },
  settingsButton: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quickCard: { borderWidth: 1, borderRadius: 18, marginBottom: 12 },
  quickButton: { minHeight: 62, padding: 12, flexDirection: 'row', alignItems: 'center' },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1, marginLeft: 10 },
  quickTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  quickMeta: { fontSize: 9.5, lineHeight: 14 },
  gitaFocusCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  gitaFocusCopy: { flex: 1, paddingRight: 12 },
  gitaFocusLabel: { fontSize: 9, letterSpacing: 1.3, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  gitaFocusTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  gitaFocusText: { fontSize: 10.5, lineHeight: 15 },
  messageCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  messageCopy: { flex: 1, marginLeft: 11 },
  cardKicker: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  message: { fontSize: 13, lineHeight: 19, fontFamily: 'Inter_600SemiBold' },
  continueCard: { borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  continueCopy: { flex: 1, paddingRight: 12 },
  continueTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', lineHeight: 20 },
  previousCard: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, paddingBottom: 8 },
  progressRow: { minHeight: 58, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  statCard: { borderWidth: 1, borderRadius: 18, padding: 15, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statNumber: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  statLabel: { fontSize: 9.5 },
  list: { gap: 8 },
  chapterRow: { minHeight: 68, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginRight: 10 },
  rowTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  rowMeta: { fontSize: 10, lineHeight: 15 },
  unavailableCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 64, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 },
  tab: { alignItems: 'center', justifyContent: 'center', minWidth: 110, gap: 3 },
  tabLabel: { fontSize: 10, fontFamily: 'Inter_700Bold' },
});

import { Feather } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { GITA_CHAPTERS, type GitaVerse } from '@/features/geeta-nexus/geetaTypes';
import { saveReadingProgress } from '@/features/geeta-nexus/geetaReadingProgress';
import { KRISHNA_MANTRAS } from '@/features/spiritual/krishnaMantraCatalog';
import { ensureGitaChapterCached, getCachedChapterVerses } from '@/features/geeta-nexus/gitaChapterDownloadQueue';
import { loadChapterVersesFromRemote } from '@/features/geeta-nexus/gitaRemoteSource';

function toNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : NaN;
}

export default function GeetaNexusReader() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ chapter?: string | string[]; verse?: string | string[] }>();
  const requestedChapter = toNumber(params.chapter);
  const requestedVerse = toNumber(params.verse);
  const safeChapter = Number.isInteger(requestedChapter) && requestedChapter >= 1 && requestedChapter <= 18 ? requestedChapter : 1;
  const safeVerse = Number.isInteger(requestedVerse) && requestedVerse >= 1 ? requestedVerse : 1;

  const [verses, setVerses] = useState<GitaVerse[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [mantraPlaying, setMantraPlaying] = useState(false);
  const [mantraIndex, setMantraIndex] = useState(0);

  const chapterMeta = GITA_CHAPTERS[safeChapter - 1];
  const chapterVerses = useMemo(
    () => verses.filter((item) => item.chapter === safeChapter).sort((a, b) => a.verse - b.verse),
    [verses, safeChapter],
  );
  const current = chapterVerses[index] ?? null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMissing(false);
    setIndex(0);
    void (async () => {
      try {
        let cached = await getCachedChapterVerses(safeChapter);
        if (cached.length === 0) {
          await ensureGitaChapterCached(safeChapter, loadChapterVersesFromRemote);
          cached = await getCachedChapterVerses(safeChapter);
        }
        if (!active) return;
        const nextChapterVerses = cached.sort((a, b) => a.verse - b.verse);
        setVerses(nextChapterVerses);
        const startIndex = nextChapterVerses.findIndex((item) => item.verse >= safeVerse);
        if (startIndex >= 0) setIndex(startIndex);
        setMissing(nextChapterVerses.length === 0);
      } catch {
        if (!active) return;
        setVerses([]);
        setMissing(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [safeChapter, safeVerse]);

  useEffect(() => {
    if (current) void saveReadingProgress({ textId: 'bhagavad-gita', chapter: current.chapter, verse: current.verse });
  }, [current?.id]);

  const goToVerse = (nextIndex: number) => {
    if (nextIndex < 0) return;
    if (nextIndex >= chapterVerses.length) {
      if (safeChapter < 18) router.replace('/geeta-nexus/read?chapter=' + (safeChapter + 1) + '&verse=1' as never);
      return;
    }
    setIndex(nextIndex);
  };

  const goToChapter = (chapter: number) => router.replace('/geeta-nexus/read?chapter=' + chapter + '&verse=1' as never);
  const currentMantra = KRISHNA_MANTRAS[mantraIndex];
  const toggleMantra = () => {
    if (mantraPlaying) { Speech.stop(); setMantraPlaying(false); return; }
    Speech.speak(currentMantra.sanskrit, { language: 'hi-IN', rate: 0.72, onDone: () => setMantraPlaying(false), onStopped: () => setMantraPlaying(false), onError: () => setMantraPlaying(false) });
    setMantraPlaying(true);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to chapters" onPress={() => router.replace('/geeta-nexus/chapters?chapter=' + safeChapter + '&verse=' + (current?.verse ?? safeVerse) as never)} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.kicker, { color: colors.primary }]}>GEETA NEXUS</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>{chapterMeta.nameEnglish}</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Chapter {safeChapter} · {chapterMeta.verseCount} verses</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.stateText, { color: colors.mutedForeground }]}>Loading saved Gita verses…</Text></View>
        ) : missing ? (
          <View style={[styles.stateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="download" size={24} color={colors.primary} />
            <Text style={[styles.stateTitle, { color: colors.foreground }]}>Verse library is not available offline yet</Text>
            <Text style={[styles.stateText, { color: colors.mutedForeground }]}>Open the verified source hydration flow before reading. No placeholder verse text is shown.</Text>
          </View>
        ) : current ? (
          <>
            <View style={[styles.positionCard, { backgroundColor: colors.primary }]}>
              <Text style={[styles.positionKicker, { color: colors.primaryForeground }]}>READING</Text>
              <Text style={[styles.positionTitle, { color: colors.primaryForeground }]}>Verse {current.verse}</Text>
              <Text style={[styles.positionText, { color: colors.primaryForeground }]}>{index + 1} of {chapterVerses.length} cached verses</Text>
            </View>
            <View style={[styles.verseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.verseNumber, { color: colors.primary }]}>अध्याय {current.chapter} · श्लोक {current.verse}</Text>
              <Text accessibilityRole="text" style={[styles.sanskrit, { color: colors.foreground }]}>{current.sanskrit}</Text>
              {!!current.transliteration && <Text style={[styles.transliteration, { color: colors.mutedForeground }]}>{current.transliteration}</Text>}
              {!!current.translationHindi && <View style={[styles.translationBlock, { borderTopColor: colors.border }]}><Text style={[styles.blockLabel, { color: colors.primary }]}>हिंदी अर्थ</Text><Text style={[styles.translation, { color: colors.foreground }]}>{current.translationHindi}</Text></View>}
              {!!current.meaningHindi && <View style={[styles.translationBlock, { borderTopColor: colors.border }]}><Text style={[styles.blockLabel, { color: colors.primary }]}>हिंदी भावार्थ</Text><Text style={[styles.translation, { color: colors.foreground }]}>{current.meaningHindi}</Text></View>}
              {!!current.translationEnglish && <View style={[styles.translationBlock, { borderTopColor: colors.border }]}><Text style={[styles.blockLabel, { color: colors.primary }]}>English</Text><Text style={[styles.translation, { color: colors.foreground }]}>{current.translationEnglish}</Text></View>}
            </View>
            <View style={[styles.mantraCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.mantraCopy}>
                <Text style={[styles.blockLabel, { color: colors.primary }]}>KRISHNA MANTRA • CHANT WHILE READING</Text>
                <Text style={[styles.mantraText, { color: colors.foreground }]}>{currentMantra.sanskrit}</Text>
              </View>
              <View style={styles.mantraActions}>
                <Pressable accessibilityRole="button" accessibilityLabel={mantraPlaying ? 'Stop Krishna mantra' : 'Play Krishna mantra'} onPress={toggleMantra} style={[styles.mantraButton, { backgroundColor: colors.primary }]}><Feather name={mantraPlaying ? 'square' : 'play'} size={17} color={colors.primaryForeground} /></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Next Krishna mantra" onPress={() => { Speech.stop(); setMantraPlaying(false); setMantraIndex((i) => (i + 1) % KRISHNA_MANTRAS.length); }} style={[styles.mantraButton, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="skip-forward" size={17} color={colors.foreground} /></Pressable>
              </View>
            </View>
            <View style={styles.controls}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous verse" accessibilityState={{ disabled: index === 0 }} disabled={index === 0} onPress={() => goToVerse(index - 1)} style={[styles.control, { backgroundColor: colors.card, borderColor: colors.border, opacity: index === 0 ? 0.45 : 1 }]}><Feather name="chevron-left" size={19} color={colors.foreground} /><Text style={[styles.controlText, { color: colors.foreground }]}>Previous</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={index + 1 < chapterVerses.length ? 'Next verse' : safeChapter < 18 ? 'Next chapter' : 'Finish reading'} onPress={() => goToVerse(index + 1)} style={[styles.control, { backgroundColor: colors.primary, borderColor: colors.primary }]}><Text style={[styles.controlText, { color: colors.primaryForeground }]}>{index + 1 < chapterVerses.length ? 'Next' : safeChapter < 18 ? 'Next chapter' : 'Done'}</Text><Feather name="chevron-right" size={19} color={colors.primaryForeground} /></Pressable>
            </View>
          </>
        ) : null}

        <View style={styles.chapterNav}>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: safeChapter === 1 }} disabled={safeChapter === 1} onPress={() => goToChapter(safeChapter - 1)} style={[styles.chapterButton, { borderColor: colors.border, backgroundColor: colors.card, opacity: safeChapter === 1 ? 0.45 : 1 }]}><Feather name="chevron-left" size={18} color={colors.foreground} /><Text style={[styles.chapterButtonText, { color: colors.foreground }]}>Previous chapter</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: safeChapter === 18 }} disabled={safeChapter === 18} onPress={() => goToChapter(safeChapter + 1)} style={[styles.chapterButton, { borderColor: colors.border, backgroundColor: colors.card, opacity: safeChapter === 18 ? 0.45 : 1 }]}><Text style={[styles.chapterButtonText, { color: colors.foreground }]}>Next chapter</Text><Feather name="chevron-right" size={18} color={colors.foreground} /></Pressable>
        </View>

        <View style={[styles.note, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="shield" size={18} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>Your reading position is saved locally on this device. The reader only displays verified cached verse data.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  headerCopy: { flex: 1, paddingLeft: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 9.5, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  subtitle: { fontSize: 10.5 },
  centerState: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 10 },
  stateCard: { borderWidth: 1, borderRadius: 18, padding: 18, alignItems: 'center', marginTop: 18 },
  stateTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', textAlign: 'center', marginTop: 10, marginBottom: 6 },
  stateText: { fontSize: 11, lineHeight: 17, textAlign: 'center' },
  positionCard: { borderRadius: 18, padding: 15, marginBottom: 12 },
  positionKicker: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  positionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  positionText: { fontSize: 10.5, marginTop: 4 },
  verseCard: { borderWidth: 1, borderRadius: 19, padding: 17 },
  verseNumber: { fontSize: 10.5, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  sanskrit: { fontSize: 22, lineHeight: 38, textAlign: 'center', fontFamily: 'Inter_700Bold' },
  transliteration: { fontSize: 11, lineHeight: 18, fontStyle: 'italic', textAlign: 'center', marginTop: 12 },
  translationBlock: { borderTopWidth: 1, paddingTop: 12, marginTop: 14 },
  blockLabel: { fontSize: 9, letterSpacing: 1.1, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  translation: { fontSize: 12.5, lineHeight: 20 },
  controls: { flexDirection: 'row', gap: 8, marginTop: 12 },
  control: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  controlText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  chapterNav: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chapterButton: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  chapterButtonText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  note: { marginTop: 12, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  noteText: { flex: 1, fontSize: 10, lineHeight: 15 },
  mantraCard: { borderWidth: 1, borderRadius: 18, padding: 13, marginTop: 12, flexDirection: 'row', alignItems: 'center' },
  mantraCopy: { flex: 1, paddingRight: 10 },
  mantraText: { fontSize: 13, lineHeight: 21, fontFamily: 'Inter_600SemiBold' },
  mantraActions: { flexDirection: 'row', gap: 8 },
  mantraButton: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});

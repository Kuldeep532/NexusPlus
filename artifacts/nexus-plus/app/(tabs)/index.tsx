import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type IconName = React.ComponentProps<typeof Feather>['name'];

function FeatureTile({ icon, label, detail, onPress, tone }: { icon: IconName; label: string; detail: string; onPress: () => void; tone: 'teal' | 'violet' | 'blue' }) {
  const colors = useColors();
  const accent = tone === 'teal' ? colors.primary : tone === 'violet' ? colors.accent : '#4AA7F5';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}. ${detail}`} onPress={onPress} style={({ pressed }) => [styles.featureTile, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={[styles.tileIcon, { backgroundColor: `${accent}20` }]}><Feather name={icon} size={21} color={accent} /></View>
      <Text style={[styles.tileLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.tileDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      <Feather name="arrow-up-right" size={16} color={colors.mutedForeground} style={styles.tileArrow} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showAll, setShowAll] = useState(false);
  const books = useMemo(() => [
    { title: 'The Art of Stillness', meta: 'PDF · 42 min left', progress: 0.68, color: '#55E6C1' },
    { title: 'Hindi Vyakaran Guide', meta: 'EPUB · 18 min left', progress: 0.31, color: '#5B5DE6' },
  ], []);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>NEXUS PLUS</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Good evening,{"\n"}let’s keep going.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open settings" testID="home-settings" onPress={() => router.push('/settings')} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="sliders" size={20} color={colors.foreground} /></Pressable>
      </View>

      <LinearGradient colors={['#163C40', '#17244B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroOrb} />
        <View style={styles.heroCopy}>
          <View style={styles.statusPill}><View style={styles.statusDot} /><Text style={styles.statusText}>OFFLINE READY</Text></View>
          <Text style={styles.heroTitle}>Your library,{"\n"}in your voice.</Text>
          <Text style={styles.heroBody}>Everything you need to read, listen, and understand—without an internet connection.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open voice library" onPress={() => router.push('/voices')} style={styles.heroAction}><Text style={styles.heroActionText}>Explore voices</Text><Feather name="arrow-up-right" size={17} color="#08131B" /></Pressable>
      </LinearGradient>

      <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Continue listening</Text><Pressable accessibilityRole="button" accessibilityLabel="Open full library" onPress={() => setShowAll(!showAll)}><Text style={[styles.seeAll, { color: colors.primary }]}>{showAll ? 'Show less' : 'See all'}</Text></Pressable></View>
      {(showAll ? books : books.slice(0, 1)).map((book) => (
        <Pressable key={book.title} accessibilityRole="button" accessibilityLabel={`Resume ${book.title}`} onPress={() => router.push('/reader')} style={({ pressed }) => [styles.bookRow, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
          <View style={[styles.bookCover, { backgroundColor: `${book.color}20`, borderColor: `${book.color}55` }]}><MaterialCommunityIcons name="book-open-page-variant" size={26} color={book.color} /></View>
          <View style={styles.bookInfo}><Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={1}>{book.title}</Text><Text style={[styles.bookMeta, { color: colors.mutedForeground }]}>{book.meta}</Text><View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}><View style={[styles.progressFill, { backgroundColor: book.color, width: `${book.progress * 100}%` }]} /></View></View>
          <View style={[styles.playButton, { backgroundColor: book.color }]}><Feather name="play" size={16} color="#08131B" /></View>
        </Pressable>
      ))}

      <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Smart utilities</Text></View>
      <View style={styles.grid}>
        <FeatureTile icon="file-text" label="Reader" detail="PDF & eBooks" tone="teal" onPress={() => router.push('/reader')} />
        <FeatureTile icon="mic" label="Auto-TTS" detail="System voice" tone="violet" onPress={() => router.push('/voices')} />
        <FeatureTile icon="camera" label="OCR Extract" detail="Image to text" tone="blue" onPress={() => router.push('/utilities')} />
        <FeatureTile icon="sliders" label="PDF tools" detail="Convert & clean" tone="teal" onPress={() => router.push('/utilities')} />
      </View>
      <View style={[styles.privacyNote, { borderColor: colors.border }]}><Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} /><Text style={[styles.privacyText, { color: colors.mutedForeground }]}>Private by design. Your files never leave this device.</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 22 },
  eyebrow: { fontSize: 12, letterSpacing: 2.2, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold' },
  iconButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { marginHorizontal: 20, minHeight: 224, borderRadius: 26, padding: 22, overflow: 'hidden', justifyContent: 'space-between' },
  heroOrb: { position: 'absolute', right: -28, top: -40, width: 170, height: 170, borderRadius: 90, backgroundColor: '#55E6C120', borderWidth: 1, borderColor: '#55E6C130' },
  heroCopy: { maxWidth: 290 },
  statusPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 7, backgroundColor: '#08131B66', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, marginBottom: 18 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#55E6C1' },
  statusText: { color: '#A8F8E3', fontSize: 10, letterSpacing: 1.1, fontFamily: 'Inter_700Bold' },
  heroTitle: { color: '#F4F7FA', fontSize: 29, lineHeight: 33, fontFamily: 'Inter_700Bold', marginBottom: 9 },
  heroBody: { color: '#B2C8CD', fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  heroAction: { alignSelf: 'flex-start', flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#55E6C1', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 13, marginTop: 17 },
  heroActionText: { color: '#08131B', fontSize: 13, fontFamily: 'Inter_700Bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 29, marginBottom: 13 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  seeAll: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  bookRow: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bookCover: { width: 56, height: 68, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bookInfo: { flex: 1, marginLeft: 13, marginRight: 10 },
  bookTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  bookMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 11 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },
  playButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  featureTile: { width: '48%', minHeight: 132, borderRadius: 18, borderWidth: 1, padding: 15 },
  tileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  tileLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  tileDetail: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  tileArrow: { position: 'absolute', top: 15, right: 15 },
  privacyNote: { marginHorizontal: 20, marginTop: 22, borderTopWidth: 1, paddingTop: 15, flexDirection: 'row', alignItems: 'center', gap: 8 },
  privacyText: { fontSize: 11, fontFamily: 'Inter_400Regular', flex: 1 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
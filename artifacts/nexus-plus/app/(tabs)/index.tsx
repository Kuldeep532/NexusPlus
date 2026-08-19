import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Book = {
  title: string;
  meta: string;
  progress: string;
  accent: string;
};

const books: Book[] = [
  { title: 'The Art of Stillness', meta: 'PDF  ·  42 min remaining', progress: '68%', accent: 'primary' },
  { title: 'Hindi Vyakaran Guide', meta: 'PDF  ·  18 min remaining', progress: '31%', accent: 'accent' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
            <Text style={[styles.brandMarkText, { color: colors.primaryForeground }]}>N</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>Nexus Plus</Text>
        </View>
        <Text style={[styles.libraryLabel, { color: colors.mutedForeground }]}>LIBRARY</Text>
      </View>

      <View style={styles.titleBlock}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Book Reader</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Your books, ready to listen.</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Book Reader and choose a book"
        testID="home-open-book-reader"
        onPress={() => router.push('/reader')}
        style={({ pressed }) => [
          styles.openReader,
          { backgroundColor: colors.primary },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.openReaderIcon}>
          <Feather name="book-open" size={23} color={colors.primaryForeground} />
        </View>
        <View style={styles.openReaderCopy}>
          <Text style={[styles.openReaderTitle, { color: colors.primaryForeground }]}>Open Book Reader</Text>
          <Text style={[styles.openReaderDetail, { color: colors.primaryForeground }]}>PDF reading with automatic OCR and speech</Text>
        </View>
        <Feather name="arrow-right" size={20} color={colors.primaryForeground} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open Nexus Biometric Vault"
        accessibilityHint="Open your encrypted passwords, secure notes, debit cards, credit cards and private documents"
        testID="home-open-biometric-vault"
        onPress={() => router.push('/biometric-vault')}
        style={({ pressed }) => [
          styles.vaultCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.vaultIcon, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="shield-lock" size={25} color={colors.primary} />
        </View>
        <View style={styles.vaultCopy}>
          <Text style={[styles.vaultTitle, { color: colors.foreground }]}>Biometric Vault</Text>
          <Text style={[styles.vaultDetail, { color: colors.mutedForeground }]}>Passwords, cards, notes and documents protected by device authentication</Text>
        </View>
        <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent books</Text>
        <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{books.length} files</Text>
      </View>

      {books.map((book, index) => (
        <Pressable
          key={book.title}
          accessibilityRole="button"
          accessibilityLabel={`Resume ${book.title}`}
          testID={`home-book-${index}`}
          onPress={() => router.push('/reader')}
          style={({ pressed }) => [
            styles.bookRow,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.bookIcon, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons
              name="book-open-page-variant"
              size={24}
              color={book.accent === 'primary' ? colors.primary : colors.accent}
            />
          </View>
          <View style={styles.bookCopy}>
            <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={1}>{book.title}</Text>
            <Text style={[styles.bookMeta, { color: colors.mutedForeground }]}>{book.meta}</Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { backgroundColor: book.accent === 'primary' ? colors.primary : colors.accent, width: book.progress }]} />
            </View>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 38 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  brandName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  libraryLabel: { fontSize: 10, letterSpacing: 1.6, fontFamily: 'Inter_700Bold' },
  titleBlock: { paddingHorizontal: 20, marginBottom: 22 },
  title: { fontSize: 31, fontFamily: 'Inter_700Bold', letterSpacing: -0.6, marginBottom: 7 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  openReader: { marginHorizontal: 20, minHeight: 78, borderRadius: 16, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  openReaderIcon: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#08131B25', alignItems: 'center', justifyContent: 'center' },
  openReaderCopy: { flex: 1, marginLeft: 12, marginRight: 8 },
  openReaderTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  openReaderDetail: { fontSize: 11, fontFamily: 'Inter_500Medium', opacity: 0.8 },
  vaultCard: { marginHorizontal: 20, minHeight: 86, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  vaultIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  vaultCopy: { flex: 1, marginHorizontal: 12 },
  vaultTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  vaultDetail: { fontSize: 10.5, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  sectionHeader: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  sectionCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  bookRow: { marginHorizontal: 20, minHeight: 78, borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  bookIcon: { width: 50, height: 54, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  bookCopy: { flex: 1, marginHorizontal: 12 },
  bookTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 5 },
  bookMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 9 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});

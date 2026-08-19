import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getDownloadedVoices, type DownloadedVoice } from './voices';

const BOOKS_KEY = 'nexus-plus.reader.books';
type Book = { id: string; title: string; uri?: string; type: string; progress: number };
const starterBooks: Book[] = [
  { id: 'demo-stillness', title: 'The Art of Stillness', type: 'PDF', progress: 68 },
  { id: 'demo-hindi', title: 'Hindi Vyakaran Guide', type: 'PDF', progress: 31 },
];

async function loadBooks(): Promise<Book[]> {
  const value = await AsyncStorage.getItem(BOOKS_KEY);
  if (!value) return starterBooks;
  try {
    const parsed = JSON.parse(value) as Book[];
    return Array.isArray(parsed) && parsed.length ? parsed : starterBooks;
  } catch { return starterBooks; }
}
async function saveBooks(books: Book[]) { await AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books)); }

export default function ReaderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedId, setSelectedId] = useState('demo-stillness');
  const [voices, setVoices] = useState<DownloadedVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [ocrComplete, setOcrComplete] = useState(false);

  const selectedBook = useMemo(() => books.find((book) => book.id === selectedId) ?? books[0], [books, selectedId]);
  const selectedVoiceName = voices.find((voice) => voice.id === selectedVoice)?.name ?? 'Select downloaded voice';

  useEffect(() => {
    let active = true;
    Promise.all([loadBooks(), getDownloadedVoices()]).then(([loadedBooks, loadedVoices]) => {
      if (!active) return;
      setBooks(loadedBooks);
      setVoices(loadedVoices);
      setSelectedId(loadedBooks[0]?.id ?? '');
      setSelectedVoice(loadedVoices[0]?.id ?? '');
    });
    return () => { active = false; };
  }, []);

  const importBook = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'text/plain'], copyToCacheDirectory: true, multiple: false });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const nextBook: Book = {
      id: `${Date.now()}`,
      title: asset.name.replace(/\.[^.]+$/, ''),
      uri: asset.uri,
      type: asset.mimeType?.includes('pdf') ? 'PDF' : 'TXT',
      progress: 0,
    };
    const nextBooks = [nextBook, ...books];
    setBooks(nextBooks);
    setSelectedId(nextBook.id);
    await saveBooks(nextBooks);
  };

  const removeSelectedBook = async () => {
    if (!selectedBook) return;
    if (selectedBook.id.startsWith('demo-')) {
      Alert.alert('Demo book', 'Starter books are part of the Reader demo and cannot be removed.');
      return;
    }
    const nextBooks = books.filter((book) => book.id !== selectedBook.id);
    setBooks(nextBooks);
    setSelectedId(nextBooks[0]?.id ?? '');
    await saveBooks(nextBooks);
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.heroCopy}>
          <Text style={[styles.kicker, { color: colors.primary }]}>BOOK READER</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>{selectedBook?.title ?? 'Library'}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{selectedBook ? `${selectedBook.type} · ${selectedBook.progress}% complete` : 'No book selected'}</Text>
        </View>
        <View style={[styles.cover, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="book-open-page-variant" size={36} color={colors.primary} />
          <Text style={[styles.coverLabel, { color: colors.primary }]}>{selectedBook?.type ?? 'BOOK'}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Library</Text>
          <Text style={[styles.sectionDetail, { color: colors.mutedForeground }]}>{books.length} books available</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Import new book" onPress={importBook} style={({ pressed }) => [styles.importButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
          <Feather name="plus" size={17} color={colors.primaryForeground} />
          <Text style={[styles.importText, { color: colors.primaryForeground }]}>Import New Book</Text>
        </Pressable>
      </View>

      <View style={styles.bookList}>
        {books.map((book) => (
          <Pressable key={book.id} accessibilityRole="button" accessibilityState={{ selected: selectedId === book.id }} accessibilityLabel={`${book.title}, ${book.type}, ${book.progress} percent complete`} onPress={() => setSelectedId(book.id)} style={({ pressed }) => [styles.bookRow, { backgroundColor: colors.card, borderColor: selectedId === book.id ? colors.primary : colors.border }, pressed && styles.pressed]}>
            <View style={[styles.bookIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="book-open-variant" size={22} color={colors.primary} /></View>
            <View style={styles.bookCopy}>
              <Text style={[styles.bookTitle, { color: colors.foreground }]} numberOfLines={1}>{book.title}</Text>
              <Text style={[styles.bookMeta, { color: colors.mutedForeground }]}>{book.type} · {book.progress}% complete</Text>
              <View style={[styles.track, { backgroundColor: colors.muted }]}><View style={[styles.fill, { backgroundColor: colors.primary, width: `${book.progress}%` }]} /></View>
            </View>
            <Feather name={selectedId === book.id ? 'check-circle' : 'chevron-right'} size={19} color={selectedId === book.id ? colors.primary : colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      <View style={[styles.readerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardTop}>
          <View>
            <Text style={[styles.cardKicker, { color: colors.mutedForeground }]}>AUDIO READING</Text>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Ready to listen</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Change voice. Only downloaded voices are shown" onPress={() => setVoiceOpen((value) => !value)} style={styles.iconButton}>
            <MaterialCommunityIcons name="account-voice" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {voiceOpen && (
          <View style={[styles.voicePanel, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.voiceHeading, { color: colors.foreground }]}>Change Voice</Text>
            <Text style={[styles.voiceHint, { color: colors.mutedForeground }]}>Only downloaded Settings voices are available.</Text>
            {voices.map((voice) => (
              <Pressable key={voice.id} accessibilityRole="radio" accessibilityState={{ selected: selectedVoice === voice.id }} onPress={() => { setSelectedVoice(voice.id); setVoiceOpen(false); }} style={styles.voiceRow}>
                <Feather name="volume-2" size={17} color={colors.primary} />
                <View style={styles.voiceCopy}><Text style={[styles.voiceName, { color: colors.foreground }]}>{voice.name}</Text><Text style={[styles.voiceLanguage, { color: colors.mutedForeground }]}>{voice.language} · Downloaded</Text></View>
                <Feather name={selectedVoice === voice.id ? 'check-circle' : 'circle'} size={19} color={selectedVoice === voice.id ? colors.primary : colors.mutedForeground} />
              </Pressable>
            ))}
            {voices.length === 0 && <Text style={[styles.voiceHint, { color: colors.mutedForeground }]}>No downloaded voices. Download one in Settings.</Text>}
            <Pressable accessibilityRole="button" accessibilityLabel="Open downloaded voice library" onPress={() => router.push('/voices')} style={styles.manageVoiceButton}>
              <Text style={[styles.manageVoiceText, { color: colors.primary }]}>Manage downloaded voices</Text>
              <Feather name="arrow-right" size={16} color={colors.primary} />
            </Pressable>
          </View>
        )}

        <View style={styles.playerLine}>
          <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause reading' : 'Play reading'} onPress={() => setPlaying((value) => !value)} style={[styles.playButton, { backgroundColor: colors.primary }]}>
            <Feather name={playing ? 'pause' : 'play'} size={22} color={colors.primaryForeground} />
          </Pressable>
          <View style={styles.playerCopy}>
            <Text style={[styles.currentVoice, { color: colors.foreground }]}>{selectedVoiceName}</Text>
            <Text style={[styles.currentText, { color: colors.mutedForeground }]}>{playing ? 'Reading now' : 'Press play to read aloud'}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Change reading speed. Current ${speed} times`} onPress={() => setSpeed((value) => value >= 2 ? 0.75 : Number((value + 0.25).toFixed(2)))} style={[styles.speedButton, { borderColor: colors.border }]}>
            <Text style={[styles.speedText, { color: colors.primary }]}>{speed}×</Text>
          </Pressable>
        </View>

        <View style={styles.optionList}>
          <Pressable accessibilityRole="button" accessibilityLabel="Other Books Control" onPress={() => Alert.alert('Other Books Control', `${books.length} books are currently in your Reader library.`)} style={[styles.optionRow, { borderColor: colors.border }]}>
            <Feather name="list" size={18} color={colors.primary} /><Text style={[styles.optionLabel, { color: colors.foreground }]}>Other Books Control</Text><Feather name="chevron-right" size={17} color={colors.mutedForeground} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={ocrComplete ? 'OCR is ready' : 'Run OCR on the selected book'} onPress={() => setOcrComplete(true)} style={[styles.optionRow, { borderColor: colors.border }]}>
            <Feather name="search" size={18} color={colors.accent} /><Text style={[styles.optionLabel, { color: colors.foreground }]}>OCR</Text><Text style={[styles.optionValue, { color: ocrComplete ? colors.primary : colors.mutedForeground }]}>{ocrComplete ? 'Ready' : 'Run now'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open downloaded voice library" onPress={() => router.push('/voices')} style={[styles.optionRow, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="account-voice" size={18} color={colors.primary} /><Text style={[styles.optionLabel, { color: colors.foreground }]}>Change Voice</Text><Text style={[styles.optionValue, { color: colors.mutedForeground }]}>{selectedVoiceName}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Delete selected imported book" onPress={removeSelectedBook} style={[styles.optionRow, { borderColor: colors.border }]}>
            <Feather name="trash-2" size={18} color={colors.destructive} /><Text style={[styles.optionLabel, { color: colors.foreground }]}>Remove Selected Book</Text><Feather name="chevron-right" size={17} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 14 },
  hero: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  heroCopy: { flex: 1, marginRight: 14 },
  kicker: { fontSize: 10, letterSpacing: 1.7, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  title: { fontSize: 25, lineHeight: 30, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  meta: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  cover: { width: 84, height: 104, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 7 },
  coverLabel: { fontSize: 9, letterSpacing: 1.2, fontFamily: 'Inter_700Bold' },
  sectionHeader: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  sectionDetail: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  importButton: { minHeight: 42, paddingHorizontal: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  importText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  bookList: { paddingHorizontal: 20, gap: 8 },
  bookRow: { minHeight: 72, borderRadius: 15, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' },
  bookIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bookCopy: { flex: 1, marginHorizontal: 10 },
  bookTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  bookMeta: { fontSize: 10, fontFamily: 'Inter_400Regular', marginBottom: 7 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  readerCard: { marginHorizontal: 20, marginTop: 18, borderRadius: 18, borderWidth: 1, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardKicker: { fontSize: 9, letterSpacing: 1.5, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  iconButton: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  voicePanel: { marginTop: 12, borderRadius: 14, borderWidth: 1, padding: 11 },
  voiceHeading: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  voiceHint: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  voiceRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 },
  voiceCopy: { flex: 1 },
  voiceName: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  voiceLanguage: { fontSize: 9.5, fontFamily: 'Inter_400Regular' },
  manageVoiceButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, marginTop: 6, paddingTop: 8 },
  manageVoiceText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  playerLine: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  playButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', paddingLeft: 2 },
  playerCopy: { flex: 1, marginHorizontal: 11 },
  currentVoice: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  currentText: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  speedButton: { minWidth: 48, minHeight: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  speedText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  optionList: { marginTop: 14, gap: 7 },
  optionRow: { minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  optionLabel: { flex: 1, fontSize: 11.5, fontFamily: 'Inter_600SemiBold' },
  optionValue: { maxWidth: 145, fontSize: 10, fontFamily: 'Inter_500Medium' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});

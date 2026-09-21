import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { localNotesRepository, NOTES_STORAGE_LOCATION } from '@/features/notepad/notepadRepository';
import { DEFAULT_NOTE_CATEGORIES, Note, NoteCategory } from '@/features/notepad/notepadTypes';
import { NoteList } from '@/features/notepad/components/NoteList';
import { NoteForm, NoteDraft } from '@/features/notepad/components/NoteForm';
import { saveNoteToSecureVault } from '@/features/notepad/notepadVaultBridge';

type Screen = 'home' | 'all' | 'categories' | 'add' | 'edit';

export default function NotepadRoute() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('home');
  const [notes, setNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [editing, setEditing] = useState<Note | undefined>();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const load = useCallback(async () => {
    const [loadedNotes, loadedCategories] = await Promise.all([localNotesRepository.listNotes(), localNotesRepository.listCategories()]);
    if (loadedCategories.length === 0) {
      const now = Date.now();
      const defaults = DEFAULT_NOTE_CATEGORIES.map((item) => ({ ...item, createdAt: now, updatedAt: now }));
      for (const category of defaults) await localNotesRepository.saveCategory(category);
      setCategories(defaults);
    } else setCategories(loadedCategories);
    setNotes(loadedNotes);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visibleNotes = notes.filter((note) => {
    const q = search.trim().toLowerCase();
    return !note.archived && (!q || (note.title + ' ' + note.content + ' ' + note.kind).toLowerCase().includes(q)) && (!selectedCategory || note.categoryId === selectedCategory);
  });

  const saveDraft = async (draft: NoteDraft) => {
    setSaving(true);
    try {
      const now = Date.now();
      const note: Note = editing
        ? { ...editing, kind: draft.kind, title: draft.title, content: draft.content, categoryId: draft.categoryId, attachments: draft.attachments, updatedAt: now }
        : { id: now.toString(36) + '-' + Math.random().toString(36).slice(2, 8), kind: draft.kind, title: draft.title, content: draft.content, categoryId: draft.categoryId, attachments: draft.attachments, createdAt: now, updatedAt: now, source: 'NOTEPAD' };
      await localNotesRepository.saveNote(note);
      setNotes((current) => [note, ...current.filter((item) => item.id !== note.id)]);
      if (draft.saveToSecureVault) await saveNoteToSecureVault({ title: note.title, content: note.content, attachments: note.attachments });
      setEditing(undefined);
      setScreen('all');
      Alert.alert('Note saved', draft.saveToSecureVault ? 'Saved to Nexus Plus / Notes and Secure Vault.' : 'Saved to Nexus Plus / Notes.');
    } catch {
      Alert.alert('Could not save note', draft.saveToSecureVault ? 'Save to Secure Vault failed. Unlock the Vault and try again.' : 'The local Notes store could not be updated.');
    } finally { setSaving(false); }
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    const now = Date.now();
    const category: NoteCategory = { id: now.toString(36) + '-' + Math.random().toString(36).slice(2, 8), name, createdAt: now, updatedAt: now };
    await localNotesRepository.saveCategory(category);
    setCategories((current) => [category, ...current]);
    setNewCategory('');
  };

  if (screen === 'add' || screen === 'edit') {
    return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}><Stack.Screen options={{ headerShown: false }} /><Header title={editing ? 'Edit Note' : 'Add New Note'} onBack={() => setScreen('all')} colors={colors} /><ScrollView contentContainerStyle={styles.form}><NoteForm categories={categories} initial={editing} saving={saving} onSave={saveDraft} /></ScrollView></View>;
  }

  if (screen === 'categories') {
    return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}><Stack.Screen options={{ headerShown: false }} /><Header title="Categories" onBack={() => setScreen('home')} colors={colors} /><View style={styles.categoryCreate}><TextInput accessibilityLabel="New category" value={newCategory} onChangeText={setNewCategory} placeholder="New category" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /><Pressable accessibilityRole="button" accessibilityLabel="Add category" onPress={() => void addCategory()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>Add</Text></Pressable></View><ScrollView contentContainerStyle={styles.categoryList}>{categories.map((category) => <Pressable key={category.id} accessibilityRole="button" accessibilityLabel={category.name} onPress={() => { setSelectedCategory(category.id); setScreen('all'); }} style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.categoryName, { color: colors.foreground }]}>{category.name}</Text><Text style={[styles.categoryCount, { color: colors.mutedForeground }]}>{notes.filter((note) => note.categoryId === category.id).length} notes</Text></Pressable>)}</ScrollView></View>;
  }

  if (screen === 'all') {
    return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}><Stack.Screen options={{ headerShown: false }} /><Header title="All Notes" onBack={() => setScreen('home')} colors={colors} /><View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="search" size={17} color={colors.mutedForeground} /><TextInput accessibilityLabel="Search notes" value={search} onChangeText={setSearch} placeholder="Search notes" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} /></View><NoteList notes={visibleNotes} categories={categories} onOpen={(note) => { setEditing(note); setScreen('edit'); }} /></View>;
  }

  return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}><Stack.Screen options={{ headerShown: false }} /><Header title="Notepad" onBack={() => router.back()} colors={colors} /><ScrollView contentContainerStyle={styles.home}><Text style={[styles.storage, { color: colors.mutedForeground }]}>Local storage: {NOTES_STORAGE_LOCATION}</Text><Pressable accessibilityRole="button" accessibilityLabel="All Notes" onPress={() => setScreen('all')} style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.menuText, { color: colors.foreground }]}>All Notes</Text><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Categories" onPress={() => setScreen('categories')} style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.menuText, { color: colors.foreground }]}>Categories</Text><Feather name="grid" size={18} color={colors.mutedForeground} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Add New Note" onPress={() => { setEditing(undefined); setScreen('add'); }} style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.menuText, { color: colors.foreground }]}>Add New Note</Text><Feather name="plus" size={18} color={colors.mutedForeground} /></Pressable><Text style={[styles.syncHint, { color: colors.mutedForeground }]}>Notes are repository-based and ready for a future S3/Firebase sync adapter.</Text></ScrollView></View>;
}

function Header({ title, onBack, colors }: { title: string; onBack: () => void; colors: any }) { return <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}><Feather name="arrow-left" size={21} color={colors.foreground} /></Pressable><Text accessibilityRole="header" style={[styles.heading, { color: colors.foreground }]}>{title}</Text></View>; }
const styles = StyleSheet.create({ root: { flex: 1 }, header: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12 }, back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, heading: { fontSize: 23, fontFamily: 'Inter_700Bold' }, home: { padding: 20, gap: 11 }, storage: { fontSize: 11, marginBottom: 6 }, syncHint: { fontSize: 11, lineHeight: 17, marginTop: 6 }, menuCard: { minHeight: 62, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, menuText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, search: { marginHorizontal: 20, minHeight: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' }, searchInput: { flex: 1, marginLeft: 9 }, form: { paddingBottom: 30 }, categoryCreate: { padding: 20, flexDirection: 'row', gap: 9 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, flex: 1 }, primaryButton: { minWidth: 72, minHeight: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, categoryList: { padding: 20, gap: 10 }, categoryCard: { minHeight: 70, borderWidth: 1, borderRadius: 15, padding: 14 }, categoryName: { fontSize: 14, fontFamily: 'Inter_700Bold' }, categoryCount: { fontSize: 11, marginTop: 4 } });

import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Note, NoteCategory } from '../notepadTypes';

const kindLabel: Record<Note['kind'], string> = { TEXT: 'Text', IMAGE: 'Image', AUDIO: 'Audio', DRAWING: 'Drawing', MIXED: 'Mixed' };
const kindIcon: Record<Note['kind'], string> = { TEXT: 'file-text', IMAGE: 'image', AUDIO: 'mic', DRAWING: 'edit-3', MIXED: 'paperclip' };

export function NoteList({ notes, categories, onOpen }: { notes: Note[]; categories: NoteCategory[]; onOpen: (note: Note) => void }) {
  const colors = useColors();
  return <FlatList data={notes} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedForeground }]}>No notes yet.</Text>} renderItem={({ item }) => {
    const category = categories.find((entry) => entry.id === item.categoryId);
    return <Pressable accessibilityRole="button" accessibilityLabel={'Open ' + kindLabel[item.kind] + ' note ' + (item.title || 'Untitled note')} onPress={() => onOpen(item)} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={kindIcon[item.kind] as never} size={20} color={colors.primary} /></View>
      <View style={styles.copy}><Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{item.title || 'Untitled note'}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{kindLabel[item.kind]} • {category?.name ?? 'Uncategorized'} • {item.attachments.length} attachment{item.attachments.length === 1 ? '' : 's'}</Text><Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={2}>{item.content || 'Media note'}</Text></View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>;
  }} />;
}
const styles = StyleSheet.create({ list: { padding: 20, gap: 10 }, card: { minHeight: 90, borderWidth: 1, borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center' }, icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 12, marginRight: 8 }, title: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 }, meta: { fontSize: 10, marginBottom: 4 }, preview: { fontSize: 11, lineHeight: 16 }, empty: { padding: 24, textAlign: 'center' }, pressed: { opacity: 0.75 } });

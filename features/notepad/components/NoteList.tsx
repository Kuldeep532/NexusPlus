import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Note, NoteCategory } from '../notepadTypes';

export function NoteList({ notes, categories, onOpen }: { notes: Note[]; categories: NoteCategory[]; onOpen: (note: Note) => void }) {
  const colors = useColors();
  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedForeground }]}>No notes yet.</Text>}
      renderItem={({ item }) => {
        const category = categories.find((entry) => entry.id === item.categoryId);
        return (
          <Pressable accessibilityRole="button" accessibilityLabel={"Open note " + (item.title || 'Untitled note')} onPress={() => onOpen(item)} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={styles.copy}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{item.title || 'Untitled note'}</Text>
              {item.description ? <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>{item.description}</Text> : null}
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{category?.name ?? 'Uncategorized'}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        );
      }}
    />
  );
}
const styles = StyleSheet.create({ list: { padding: 20, gap: 10 }, card: { minHeight: 82, borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' }, copy: { flex: 1, marginRight: 12 }, title: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 5 }, description: { fontSize: 12, lineHeight: 17, marginBottom: 5 }, meta: { fontSize: 11 }, empty: { padding: 24, textAlign: 'center' }, pressed: { opacity: 0.75 } });

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { NoteCategory } from '../notepadTypes';

export function NoteCategoryPicker({ categories, value, onChange }: { categories: NoteCategory[]; value: string; onChange: (id: string) => void }) {
  const colors = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((category) => {
        const selected = category.id === value;
        return (
          <Pressable key={category.id} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={"Category " + category.name} onPress={() => onChange(category.id)} style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.secondary }]}>
            <Text style={{ color: selected ? colors.primaryForeground : colors.foreground }}>{category.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
const styles = StyleSheet.create({ row: { gap: 8, paddingVertical: 4 }, chip: { minHeight: 38, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' } });

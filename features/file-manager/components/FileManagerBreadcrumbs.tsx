import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

export type BreadcrumbItem = { id: string; title: string; uri: string };

export function FileManagerBreadcrumbs({ items, onNavigate }: { items: BreadcrumbItem[]; onNavigate: (uri: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="list" accessibilityLabel="Current folder path" contentContainerStyle={styles.content}>
      {items.map((item, index) => (
        <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => onNavigate(item.uri)} style={styles.item}>
          {index > 0 ? <Feather name="chevron-right" size={14} /> : <Feather name="hard-drive" size={14} />}
          <Text numberOfLines={1} style={[styles.text, index === items.length - 1 && styles.current]}>{item.title}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', paddingVertical: 4, gap: 2 },
  item: { minHeight: 34, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 9 },
  text: { maxWidth: 150, fontSize: 11 },
  current: { fontWeight: '700' },
});

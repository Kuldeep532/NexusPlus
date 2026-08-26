import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { SUPPORTED_FILE_GROUPS } from '../FileManagerConfig';
import type { FileManagerEntry } from '../FileManagerTypes';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const CATEGORY_ICONS = { images: 'image', videos: 'video', audio: 'music', documents: 'file-text', archives: 'archive' } as const;

export function FileManagerCategoriesPanel({ entries, onOpen }: { entries: FileManagerEntry[]; onOpen: (entry: FileManagerEntry) => void }) {
  const colors = useColors();
  return (
    <View style={styles.root}>
      {Object.entries(SUPPORTED_FILE_GROUPS).map(([group, extensions]) => {
        const matches = entries.filter((entry) => !entry.isDirectory && extensions.includes(entry.extension as never)).slice(0, 8);
        return (
          <View key={group} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={CATEGORY_ICONS[group as keyof typeof CATEGORY_ICONS]} size={18} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.title, { color: colors.foreground }]}>{group[0].toUpperCase() + group.slice(1)}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{extensions.length} supported formats · {matches.length} visible here</Text></View></View>
            {matches.map((entry) => <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`Open ${entry.name}`} onPress={() => onOpen(entry)} style={styles.file}><Text numberOfLines={1} style={[styles.fileName, { color: colors.foreground }]}>{entry.name}</Text><Feather name="chevron-right" size={15} color={colors.mutedForeground} /></Pressable>)}
            {!matches.length && <Text style={[styles.empty, { color: colors.mutedForeground }]}>No matching files in the current storage view.</Text>}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ root: { gap: 10 }, section: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 8 }, header: { flexDirection: 'row', alignItems: 'center', gap: 10 }, icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, title: { fontSize: 12.5, fontWeight: '700' }, meta: { fontSize: 9.5, marginTop: 3 }, file: { minHeight: 38, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#d0d0d0' }, fileName: { flex: 1, fontSize: 10.5 }, empty: { fontSize: 9.5, lineHeight: 15 } });

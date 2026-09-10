import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { listEpaperLibraryItems, refreshLocalLockState, removeEpaperLibraryItem, type EpaperLibraryItem, type EpaperLibraryKind } from './ePaperLibrary';

type Props = {
  kind: EpaperLibraryKind;
  onOpen?: (item: EpaperLibraryItem) => void;
  onSaveLocal?: (item: EpaperLibraryItem) => void;
};

function remainingLabel(value?: string): string {
  if (!value) return '';
  const target = Date.parse(value);
  if (!Number.isFinite(target)) return '';
  const delta = target - Date.now();
  if (delta <= 0) return 'Available now';
  const minutes = Math.floor(delta / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return days ? `${days}d ${hours}h remaining` : hours ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
}

export function EPaperLibraryUI({ kind, onOpen, onSaveLocal }: Props) {
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<EpaperLibraryItem[]>([]);

  const load = async () => {
    const refreshed = await refreshLocalLockState();
    setItems(refreshed.filter((item) => item.kind === kind));
  };

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => clearInterval(timer);
  }, [kind]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return q ? items.filter((item) => `${item.title} ${item.status}`.toLocaleLowerCase().includes(q)) : items;
  }, [items, query]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerTitle}><MaterialCommunityIcons name="library-outline" size={18} color={colors.primary} /><Text style={[styles.title, { color: colors.foreground }]}>{kind === 'exam' ? 'Exam E-Paper Library' : 'E-Paper Library'}</Text></View>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>{filtered.length}</Text>
      </View>
      <View style={[styles.search, { backgroundColor: colors.background, borderColor: colors.border }]}><Feather name="search" size={16} color={colors.primary} /><TextInput accessibilityLabel={`${kind === 'exam' ? 'Exam' : 'E-paper'} library search`} placeholder="Search papers" placeholderTextColor={colors.mutedForeground} value={query} onChangeText={setQuery} style={[styles.searchInput, { color: colors.foreground }]} /></View>
      {!filtered.length ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No saved papers yet.</Text> : filtered.map((item) => <View key={item.id} style={[styles.row, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.rowMain}>
          <Text numberOfLines={2} style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.extension} • {item.status}</Text>
          {kind === 'exam' && item.status === 'LOCKED' && <Text style={[styles.timer, { color: colors.primary }]}>{remainingLabel(item.unlockTime)}</Text>}
          {kind === 'exam' && item.status === 'UNLOCKED' && <Text style={[styles.timer, { color: colors.primary }]}>Unlocked • print/share/download available</Text>}
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.title}`} onPress={() => onOpen?.(item)} style={[styles.action, { borderColor: colors.border }]}><Feather name="arrow-right" size={16} color={colors.primary} /></Pressable>
          {item.status === 'UNLOCKED' && <Pressable accessibilityRole="button" accessibilityLabel={`Save ${item.title} locally`} onPress={() => onSaveLocal?.(item)} style={[styles.action, { borderColor: colors.border }]}><Feather name="download" size={16} color={colors.primary} /></Pressable>}
          <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${item.title} from library`} onPress={async () => { await removeEpaperLibraryItem(item.id); await load(); }} style={[styles.action, { borderColor: colors.border }]}><Feather name="trash-2" size={16} color={colors.primary} /></Pressable>
        </View>
      </View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 12, borderWidth: 1, borderRadius: 16, padding: 13 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  count: { fontSize: 11 },
  search: { minHeight: 42, borderWidth: 1, borderRadius: 11, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8, marginBottom: 9 },
  searchInput: { flex: 1, fontSize: 12 },
  empty: { fontSize: 11, lineHeight: 16, paddingVertical: 12 },
  row: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowMain: { flex: 1 },
  itemTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 9.5, marginTop: 3 },
  timer: { fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 6 },
  action: { width: 38, height: 38, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

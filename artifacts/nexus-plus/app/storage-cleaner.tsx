import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Item = { uri: string; name: string; size: number };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function scanDirectory(directory: string): Promise<Item[]> {
  try {
    const names = await FileSystem.readDirectoryAsync(directory);
    const items: Item[] = [];
    for (const name of names) {
      const uri = `${directory}${name}`;
      const info = await FileSystem.getInfoAsync(uri, { size: true });
      if (info.exists && !info.isDirectory) items.push({ uri, name, size: info.size ?? 0 });
    }
    return items;
  } catch {
    return [];
  }
}

export default function StorageCleanerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setBusy(true);
    const cache = FileSystem.cacheDirectory ? await scanDirectory(FileSystem.cacheDirectory) : [];
    setItems(cache);
    setBusy(false);
  };

  useEffect(() => { void refresh(); }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.size, 0), [items]);

  const clearCache = () => {
    if (!items.length) return;
    Alert.alert('Clear cache?', `This will remove ${formatBytes(total)} of temporary app cache files. Your books, vault records and settings are not targeted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear cache', style: 'destructive', onPress: async () => {
          setBusy(true);
          for (const item of items) {
            try { await FileSystem.deleteAsync(item.uri, { idempotent: true }); } catch {}
          }
          await refresh();
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 32 }}>
      <View style={styles.heading}>
        <Text style={[styles.kicker, { color: colors.primary }]}>STORAGE</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Storage Cleaner</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Review temporary cache files before removing them. Personal content is not automatically selected.</Text>
      </View>

      <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.secondary }]}><Feather name="database" size={22} color={colors.primary} /></View>
        <View style={styles.summaryCopy}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>{formatBytes(total)}</Text>
          <Text style={[styles.summaryDetail, { color: colors.mutedForeground }]}>{items.length} temporary files found</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Rescan temporary storage" onPress={() => void refresh()} disabled={busy} style={[styles.refresh, { borderColor: colors.border }]}>
          <Feather name="refresh-cw" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <View style={[styles.notice, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="shield" size={18} color={colors.accent} />
        <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>Only cache-directory files are shown here. Imported books and secure vault data are deliberately excluded.</Text>
      </View>

      <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Temporary files</Text><Text style={[styles.count, { color: colors.mutedForeground }]}>{items.length}</Text></View>

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.uri} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]} accessible accessibilityLabel={`${item.name}, ${formatBytes(item.size)}`}>
            <View style={[styles.fileIcon, { backgroundColor: colors.secondary }]}><Feather name="file" size={18} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text><Text style={[styles.size, { color: colors.mutedForeground }]}>{formatBytes(item.size)}</Text></View>
          </View>
        ))}
        {!busy && items.length === 0 && <View style={[styles.empty, { borderColor: colors.border }]}><Feather name="check-circle" size={22} color={colors.primary} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No removable cache files found.</Text></View>}
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel={`Clear ${formatBytes(total)} of temporary cache`} disabled={!items.length || busy} onPress={clearCache} style={({ pressed }) => [styles.clearButton, { backgroundColor: items.length ? colors.destructive : colors.muted }, pressed && styles.pressed]}>
        <Feather name="trash-2" size={19} color={items.length ? colors.destructiveForeground : colors.mutedForeground} />
        <Text style={[styles.clearText, { color: items.length ? colors.destructiveForeground : colors.mutedForeground }]}>{busy ? 'Scanning…' : `Clear ${formatBytes(total)} cache`}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heading: { paddingHorizontal: 20, marginBottom: 20 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 29, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  sub: { fontSize: 12.5, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  summary: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  summaryIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flex: 1, marginHorizontal: 12 },
  summaryTitle: { fontSize: 21, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  summaryDetail: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  refresh: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  notice: { marginHorizontal: 20, marginTop: 12, padding: 12, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  noticeText: { flex: 1, fontSize: 10.5, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 22, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  count: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  list: { paddingHorizontal: 20, gap: 8 },
  row: { minHeight: 60, borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' },
  fileIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 10 },
  name: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  size: { fontSize: 10, marginTop: 3, fontFamily: 'Inter_400Regular' },
  empty: { minHeight: 84, borderRadius: 14, borderWidth: 1, padding: 16, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  clearButton: { marginHorizontal: 20, marginTop: 18, minHeight: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  clearText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.76 },
});

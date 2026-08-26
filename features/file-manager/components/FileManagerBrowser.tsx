import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { DEFAULT_FILE_SORT } from '../FileManagerConfig';
import type { FileManagerEntry, FileManagerSelectionAction, FileManagerViewMode, FileSortMode } from '../FileManagerTypes';
import { getStorageStats, refreshDirectory } from '../FileManagerStorage';
import { FileManagerBreadcrumbs, type BreadcrumbItem } from './FileManagerBreadcrumbs';
import { FileManagerToolbar } from './FileManagerToolbar';

function fileIcon(entry: FileManagerEntry): keyof typeof Feather.glyphMap {
  if (entry.isDirectory) return 'folder';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'].includes(entry.extension)) return 'image';
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'm4v', '3gp'].includes(entry.extension)) return 'video';
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus'].includes(entry.extension)) return 'music';
  if (entry.extension === 'pdf') return 'file-text';
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(entry.extension)) return 'archive';
  return 'file';
}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function FileManagerBrowser({
  initialUri = FileSystem.documentDirectory ?? '',
  onFileAction,
}: {
  initialUri?: string;
  onFileAction?: (action: FileManagerSelectionAction, entry: FileManagerEntry) => void;
}) {
  const colors = useColors();
  const [currentUri, setCurrentUri] = useState(initialUri);
  const [entries, setEntries] = useState<FileManagerEntry[]>([]);
  const [sortMode, setSortMode] = useState<FileSortMode>(DEFAULT_FILE_SORT);
  const [viewMode, setViewMode] = useState<FileManagerViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await refreshDirectory(currentUri, sortMode));
    } catch (err) {
      setEntries([]);
      setError(err instanceof Error ? err.message : 'Unable to browse this folder.');
    } finally {
      setLoading(false);
    }
  }, [currentUri, sortMode]);

  useEffect(() => { void load(); }, [load]);

  const visibleEntries = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => entry.name.toLocaleLowerCase().includes(query));
  }, [entries, searchQuery]);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    const parts = currentUri.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];
    let uri = currentUri.startsWith('file://') ? 'file://' : '/';
    parts.forEach((part, index) => {
      uri = uri.endsWith('/') ? `${uri}${part}` : `${uri}/${part}`;
      items.push({ id: `${index}-${uri}`, title: part, uri });
    });
    if (!items.length) items.push({ id: 'root', title: 'Files', uri: currentUri });
    return items;
  }, [currentUri]);

  const stats = useMemo(() => getStorageStats(), []);

  const toggleSelection = (entry: FileManagerEntry) => {
    setSelectedIds((current) => current.includes(entry.id) ? current.filter((id) => id !== entry.id) : [...current, entry.id]);
  };

  const openEntry = (entry: FileManagerEntry) => {
    if (selectedIds.length) {
      toggleSelection(entry);
      return;
    }
    if (entry.isDirectory) {
      setSearchQuery('');
      setCurrentUri(entry.uri);
      return;
    }
    onFileAction?.('open', entry);
  };

  const renderItem = ({ item }: { item: FileManagerEntry }) => {
    const selected = selectedIds.includes(item.id);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.isDirectory ? 'Folder' : 'File'} ${item.name}${selected ? '. Selected' : ''}`}
        accessibilityState={{ selected }}
        onPress={() => openEntry(item)}
        onLongPress={() => toggleSelection(item)}
        style={[styles.item, viewMode === 'grid' && styles.gridItem, { borderBottomColor: colors.border }]}
      >
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
          {selected ? <Feather name="check" size={20} color={colors.primary} /> : <Feather name={fileIcon(item)} size={20} color={colors.primary} />}
        </View>
        <View style={styles.itemCopy}>
          <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.isDirectory ? 'Folder' : `${formatSize(item.size)} · ${item.extension || 'file'}`}</Text>
        </View>
        {!selected && <Pressable accessibilityRole="button" accessibilityLabel={`More options for ${item.name}`} onPress={() => onFileAction?.('properties', item)} style={styles.more}><Feather name="more-vertical" size={18} color={colors.mutedForeground} /></Pressable>}
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.storageRow} accessibilityRole="summary">
        <View style={styles.storageCopy}>
          <Text style={[styles.storageTitle, { color: colors.foreground }]}>Storage</Text>
          <Text style={[styles.storageMeta, { color: colors.mutedForeground }]}>{formatSize(stats.used)} used · {formatSize(stats.free)} free</Text>
        </View>
        <View style={[styles.storageBar, { backgroundColor: colors.border }]}><View style={[styles.storageFill, { width: `${Math.round(stats.ratio * 100)}%`, backgroundColor: colors.primary }]} /></View>
      </View>

      {showSearch && (
        <TextInput
          autoFocus
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search files and folders"
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel="Search files and folders"
          style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
        />
      )}

      <FileManagerToolbar
        searchQuery={searchQuery}
        onSearch={() => setShowSearch((value) => !value)}
        sortMode={sortMode}
        onSort={() => setSortMode((mode) => mode === 'name-asc' ? 'date-new' : 'name-asc')}
        viewMode={viewMode}
        onViewMode={setViewMode}
        onMore={() => setSelectedIds([])}
      />

      <FileManagerBreadcrumbs items={breadcrumbs} onNavigate={setCurrentUri} />

      {selectedIds.length > 0 && (
        <View style={[styles.selectionBar, { backgroundColor: colors.primaryContainer ?? colors.card, borderColor: colors.border }]}>
          <Text style={[styles.selectionText, { color: colors.foreground }]}>{selectedIds.length} selected</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Share selected files" onPress={() => visibleEntries.filter((entry) => selectedIds.includes(entry.id)).forEach((entry) => onFileAction?.('share', entry))}><Feather name="share-2" size={18} color={colors.primary} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Encrypt selected files" onPress={() => visibleEntries.filter((entry) => selectedIds.includes(entry.id)).forEach((entry) => onFileAction?.('encrypt', entry))}><Feather name="lock" size={18} color={colors.primary} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Delete selected files" onPress={() => visibleEntries.filter((entry) => selectedIds.includes(entry.id)).forEach((entry) => onFileAction?.('delete', entry))}><Feather name="trash-2" size={18} color={colors.primary} /></Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} /><Text style={[styles.centerText, { color: colors.mutedForeground }]}>Loading files…</Text></View>
      ) : error ? (
        <View style={styles.center}><Feather name="folder-minus" size={30} color={colors.mutedForeground} /><Text accessibilityRole="alert" style={[styles.centerText, { color: colors.foreground }]}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={[styles.retry, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>Retry</Text></Pressable></View>
      ) : visibleEntries.length === 0 ? (
        <View style={styles.center}><Feather name="folder" size={36} color={colors.mutedForeground} /><Text style={[styles.centerText, { color: colors.mutedForeground }]}>{searchQuery ? 'No matching files.' : 'This folder is empty.'}</Text></View>
      ) : (
        <FlatList
          accessibilityLabel="Files and folders"
          data={visibleEntries}
          key={viewMode}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.list}
          extraData={selectedIds}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  storageRow: { paddingVertical: 8, gap: 7 },
  storageCopy: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  storageTitle: { fontSize: 13, fontWeight: '700' },
  storageMeta: { fontSize: 10 },
  storageBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  storageFill: { height: 5, borderRadius: 3 },
  search: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 12, marginBottom: 8 },
  selectionBar: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 18, marginVertical: 7 },
  selectionText: { flex: 1, fontSize: 12, fontWeight: '700' },
  list: { paddingTop: 6, paddingBottom: 24 },
  item: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  gridItem: { width: '50%', minHeight: 122, borderWidth: 0, flexDirection: 'column', alignItems: 'flex-start', paddingHorizontal: 8 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 9.5, marginTop: 3 },
  more: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 30 },
  centerText: { fontSize: 11, textAlign: 'center' },
  retry: { minHeight: 42, paddingHorizontal: 18, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});

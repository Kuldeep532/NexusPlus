import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FileSortMode, FileManagerViewMode } from '../FileManagerTypes';
import { FILE_SORT_OPTIONS } from '../FileManagerConfig';

export function FileManagerToolbar({
  searchQuery,
  onSearch,
  sortMode,
  onSort,
  viewMode,
  onViewMode,
  onMore,
}: {
  searchQuery: string;
  onSearch: () => void;
  sortMode: FileSortMode;
  onSort: () => void;
  viewMode: FileManagerViewMode;
  onViewMode: (mode: FileManagerViewMode) => void;
  onMore: () => void;
}) {
  const sortLabel = FILE_SORT_OPTIONS.find((item) => item.id === sortMode)?.title ?? 'Sort';
  return (
    <View style={styles.row} accessibilityRole="toolbar" accessibilityLabel="File manager controls">
      <Pressable accessibilityRole="button" accessibilityLabel={searchQuery ? `Search. Current query ${searchQuery}` : 'Search files'} onPress={onSearch} style={styles.control}>
        <Feather name="search" size={18} />
        <Text numberOfLines={1} style={styles.label}>{searchQuery || 'Search'}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Sort. Current ${sortLabel}`} onPress={onSort} style={styles.iconControl}>
        <Feather name="filter" size={18} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`View mode. Current ${viewMode}`} onPress={() => onViewMode(viewMode === 'list' ? 'grid' : 'list')} style={styles.iconControl}>
        <Feather name={viewMode === 'list' ? 'grid' : 'list'} size={18} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="More file manager options" onPress={onMore} style={styles.iconControl}>
        <Feather name="more-vertical" size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  control: { flex: 1, minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconControl: { width: 44, height: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 12 },
});

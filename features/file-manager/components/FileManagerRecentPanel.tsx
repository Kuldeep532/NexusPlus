import { Feather } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { FileManagerEntry } from '../FileManagerTypes';

export function FileManagerRecentPanel({ entries, onOpen }: { entries: FileManagerEntry[]; onOpen: (entry: FileManagerEntry) => void }) {
  const colors = useColors();
  const recent = useMemo(() => [...entries].sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, 12), [entries]);
  return (
    <View style={styles.root}>
      <View style={styles.heading}><View><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Recent files</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Recently modified items available in this workspace.</Text></View><Feather name="clock" size={20} color={colors.primary} /></View>
      {recent.length ? recent.map((entry) => (
        <Pressable key={entry.id} accessibilityRole="button" accessibilityLabel={`Open recent ${entry.name}`} onPress={() => onOpen(entry)} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={entry.isDirectory ? 'folder' : 'file'} size={18} color={colors.primary} /></View>
          <View style={styles.copy}><Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{entry.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{new Date(entry.modifiedAt).toLocaleString()}</Text></View>
          <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
        </Pressable>
      )) : <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>No recent items are available yet.</Text></View>}
    </View>
  );
}

const styles = StyleSheet.create({ root: { gap: 9 }, heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }, title: { fontSize: 17, fontWeight: '700' }, subtitle: { fontSize: 10.5, lineHeight: 16, marginTop: 3 }, item: { minHeight: 58, borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, icon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, name: { fontSize: 11.5, fontWeight: '600' }, meta: { fontSize: 9, marginTop: 3 }, empty: { minHeight: 58, borderWidth: 1, borderRadius: 14, padding: 12 } });

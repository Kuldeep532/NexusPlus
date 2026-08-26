import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { FileManagerEntry } from '../FileManagerTypes';
import { getEntryDetails } from '../FileManagerActions';

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
}

export function FileManagerPropertiesSheet({
  entry,
  visible,
  onClose,
}: {
  entry: FileManagerEntry | null;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const [details, setDetails] = useState<Awaited<ReturnType<typeof getEntryDetails>> | null>(null);

  useEffect(() => {
    setDetails(null);
    if (visible && entry) void getEntryDetails(entry).then(setDetails).catch(() => setDetails(null));
  }, [entry, visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close properties" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={entry?.isDirectory ? 'folder' : 'file'} size={22} color={colors.primary} /></View>
            <View style={styles.copy}><Text accessibilityRole="header" numberOfLines={2} style={[styles.title, { color: colors.foreground }]}>{entry?.name ?? 'Properties'}</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{entry?.isDirectory ? 'Folder' : 'File'}</Text></View>
          </View>
          {entry && (
            <View style={styles.rows}>
              <PropertyRow label="Location" value={entry.uri} colors={colors} />
              <PropertyRow label="Size" value={details ? formatBytes(details.size) : 'Loading…'} colors={colors} />
              <PropertyRow label="Type" value={entry.extension ? entry.extension.toUpperCase() : entry.isDirectory ? 'Folder' : 'File'} colors={colors} />
              <PropertyRow label="Status" value={details?.exists === false ? 'Missing' : 'Available'} colors={colors} />
            </View>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="Close properties" onPress={onClose} style={[styles.close, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>Done</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PropertyRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.row, { borderBottomColor: colors.border }]}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><Text selectable style={[styles.value, { color: colors.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 16, paddingBottom: 24 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#888', opacity: 0.45, marginBottom: 15 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 10, marginTop: 3 },
  rows: { marginTop: 12 },
  row: { paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, gap: 5 },
  label: { fontSize: 9 },
  value: { fontSize: 11 },
  close: { minHeight: 44, marginTop: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

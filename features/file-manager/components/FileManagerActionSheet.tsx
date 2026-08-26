import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { FileManagerEntry, FileManagerSelectionAction } from '../FileManagerTypes';

const ACTIONS: ReadonlyArray<{ id: FileManagerSelectionAction; title: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: 'open', title: 'Open', icon: 'external-link' },
  { id: 'share', title: 'Share', icon: 'share-2' },
  { id: 'rename', title: 'Rename', icon: 'edit-2' },
  { id: 'copy', title: 'Copy', icon: 'copy' },
  { id: 'move', title: 'Move', icon: 'corner-up-right' },
  { id: 'compress', title: 'Compress', icon: 'archive' },
  { id: 'encrypt', title: 'Encrypt', icon: 'lock' },
  { id: 'properties', title: 'Properties', icon: 'info' },
  { id: 'delete', title: 'Delete', icon: 'trash-2' },
];

export function FileManagerActionSheet({
  entry,
  visible,
  onClose,
  onAction,
}: {
  entry: FileManagerEntry | null;
  visible: boolean;
  onClose: () => void;
  onAction: (action: FileManagerSelectionAction, entry: FileManagerEntry) => void;
}) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close file actions" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.handle} />
          <Text accessibilityRole="header" numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{entry?.name ?? 'File actions'}</Text>
          <Text numberOfLines={1} style={[styles.subtitle, { color: colors.mutedForeground }]}>{entry?.isDirectory ? 'Folder' : entry?.extension || 'File'}</Text>
          <View style={styles.grid}>
            {ACTIONS.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}${entry ? ` ${entry.name}` : ''}`}
                onPress={() => entry && onAction(item.id, entry)}
                style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name={item.icon} size={20} color={item.id === 'delete' ? colors.destructive : colors.primary} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>{item.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 26 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, opacity: 0.45, backgroundColor: '#8a8a8a', marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 10, marginTop: 3, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  action: { width: '31.8%', minHeight: 70, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 7 },
  actionText: { fontSize: 10, fontWeight: '600' },
});

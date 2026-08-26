import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FileManagerEntry } from '../FileManagerTypes';
import { useColors } from '@/hooks/useColors';

export function FileManagerPreviewSheet({ entry, visible, onClose }: { entry: FileManagerEntry | null; visible: boolean; onClose: () => void }) {
  const colors = useColors();
  if (!entry) return null;
  const kind = entry.isDirectory ? 'Folder' : entry.extension ? entry.extension.toUpperCase() : 'File';
  const previewable = ['jpg','jpeg','png','gif','webp','bmp','heic','pdf','txt','md','log','rtf'].includes(entry.extension);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text accessibilityRole="header" numberOfLines={2} style={[styles.title, { color: colors.foreground }]}>{entry.name}</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{kind}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close preview" onPress={onClose} style={styles.close}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={[styles.preview, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Feather name={previewable ? 'eye' : 'file'} size={34} color={colors.primary} />
            <Text style={[styles.previewTitle, { color: colors.foreground }]}>{previewable ? 'Preview available' : 'Preview not available'}</Text>
            <Text style={[styles.previewText, { color: colors.mutedForeground }]}>Opening the native preview/reader is handled by the host integration. This sheet keeps preview state isolated from the main browser.</Text>
          </View>
          <Text selectable style={[styles.path, { color: colors.mutedForeground }]}>Path: {entry.uri}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close preview" onPress={onClose} style={[styles.done, { backgroundColor: colors.primary }]}>
            <Text style={[styles.doneText, { color: colors.primaryForeground }]}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 18, gap: 14 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, opacity: 0.25, backgroundColor: '#777' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleWrap: { flex: 1 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 11, marginTop: 3 },
  close: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  preview: { minHeight: 190, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 9 },
  previewTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  previewText: { fontSize: 10.5, lineHeight: 16, textAlign: 'center' },
  path: { fontSize: 9.5, lineHeight: 14 },
  done: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});

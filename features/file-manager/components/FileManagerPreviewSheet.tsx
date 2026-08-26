import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { FileManagerEntry } from '../FileManagerTypes';
import { useColors } from '@/hooks/useColors';
import { resolveFileOpenTarget } from '../FileManagerOpenService';
import { FileManagerAIButton } from './FileManagerAIButton';

export function FileManagerPreviewSheet({
  entry,
  visible,
  onClose,
  onOpenSpecialized,
  onOpenExternal,
}: {
  entry: FileManagerEntry | null;
  visible: boolean;
  onClose: () => void;
  onOpenSpecialized?: (entry: FileManagerEntry) => void;
  onOpenExternal?: (entry: FileManagerEntry) => void;
}) {
  const colors = useColors();
  if (!entry) return null;
  const kind = entry.isDirectory ? 'Folder' : entry.extension ? entry.extension.toUpperCase() : 'File';
  const target = resolveFileOpenTarget(entry);
  const previewable = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'pdf', 'txt', 'md', 'log', 'rtf'].includes(entry.extension);
  const specializedLabel = target.kind === 'media' ? 'Open with Nexus Media Player' : target.kind === 'document' ? 'Open with Book Reader' : 'Open with system app';

  const open = () => {
    onClose();
    if (target.kind === 'external') onOpenExternal?.(entry);
    else onOpenSpecialized?.(entry);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close file preview" onPress={onClose} />
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
            <Text style={[styles.previewTitle, { color: colors.foreground }]}>{previewable ? 'Preview available' : 'Specialized opening available'}</Text>
            <Text style={[styles.previewText, { color: colors.mutedForeground }]}>{target.kind === 'media' ? 'This media file will open in Nexus Media Player.' : target.kind === 'document' ? 'This document will open in Book Reader.' : 'Nexus Plus has no specialized viewer registered for this extension; the system app picker can handle it.'}</Text>
          </View>

          <Text selectable style={[styles.path, { color: colors.mutedForeground }]}>Path: {entry.uri}</Text>

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel={specializedLabel} onPress={open} style={[styles.primaryAction, { backgroundColor: colors.primary }]}>
              <Feather name={target.kind === 'media' ? 'play-circle' : target.kind === 'document' ? 'book-open' : 'external-link'} size={18} color={colors.primaryForeground} />
              <Text style={[styles.actionText, { color: colors.primaryForeground }]}>{specializedLabel}</Text>
            </Pressable>
            <FileManagerAIButton entry={entry} />
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Close preview" onPress={onClose} style={[styles.done, { borderColor: colors.border }]}>
            <Text style={[styles.doneText, { color: colors.foreground }]}>Close</Text>
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
  preview: { minHeight: 170, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 9 },
  previewTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  previewText: { fontSize: 10.5, lineHeight: 16, textAlign: 'center' },
  path: { fontSize: 9.5, lineHeight: 14 },
  actions: { gap: 9 },
  primaryAction: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  actionText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' },
  done: { minHeight: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' },
});

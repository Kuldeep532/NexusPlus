import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Props = {
  resultUri: string | null;
  title?: string;
  filename?: string;
  onClose: () => void;
  onReset?: () => void;
};

export function PdfToolResultPanel({
  resultUri,
  title = 'PDF saved successfully',
  filename,
  onClose,
  onReset,
}: Props) {
  const colors = useColors();

  async function share() {
    if (!resultUri) return;
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing unavailable', 'The PDF is saved in the app cache but sharing is unavailable on this device.');
        return;
      }
      await Sharing.shareAsync(resultUri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF' });
    } catch {
      Alert.alert('Share unavailable', 'The PDF could not be shared.');
    }
  }

  async function saveToDevice() {
    if (!resultUri) return;
    Alert.alert('PDF ready', `${filename ?? 'The processed PDF'} is available to share. This PDF is currently stored in the app cache until you close or reset this tool.`);
  }

  function close() {
    onClose();
    router.back();
  }

  if (!resultUri) return null;

  return (
    <View accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={[styles.successIcon, { backgroundColor: colors.secondary }]}>
        <Feather name="check" size={24} color={colors.primary} />
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text accessibilityLiveRegion="polite" style={[styles.detail, { color: colors.mutedForeground }]}>{filename ?? 'Processed PDF'} is ready.</Text>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Share processed PDF" onPress={() => void share()} style={[styles.action, { backgroundColor: colors.primary }]}>
          <Feather name="share-2" size={18} color={colors.primaryForeground} />
          <Text style={[styles.actionText, { color: colors.primaryForeground }]}>Share</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Save processed PDF" onPress={() => void saveToDevice()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="download" size={18} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Save</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Close PDF tool" onPress={close} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="x" size={18} color={colors.foreground} />
          <Text style={[styles.actionText, { color: colors.foreground }]}>Close</Text>
        </Pressable>
      </View>

      {!!onReset && (
        <Pressable accessibilityRole="button" accessibilityLabel="Process another PDF" onPress={onReset} style={styles.reset}>
          <Text style={[styles.resetText, { color: colors.primary }]}>Process another PDF</Text>
        </Pressable>
      )}
    </View>
  );
}

export async function cleanupPdfToolResult(uri: string | null): Promise<void> {
  if (!uri || !uri.startsWith(FileSystem.cacheDirectory ?? '___never___')) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Best-effort cache cleanup.
  }
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 16, alignItems: 'center' },
  successIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 5, textAlign: 'center' },
  detail: { fontSize: 11, lineHeight: 17, textAlign: 'center' },
  actions: { width: '100%', gap: 9, marginTop: 15 },
  action: { minHeight: 48, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  reset: { marginTop: 13, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});

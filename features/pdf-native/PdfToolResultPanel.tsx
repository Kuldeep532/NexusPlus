import { Feather } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Props = { resultUri: string | null; title?: string; filename?: string; mimeType?: string; onClose: () => void; onReset?: () => void };

export async function sharePdfResult(resultUri: string, title = 'Share PDF', mimeType = 'application/pdf'): Promise<void> {
  try {
    if (!(await Sharing.isAvailableAsync())) { Alert.alert('Sharing unavailable', 'The file is already saved in Nexus Plus storage, but sharing is unavailable on this device.'); return; }
    await Sharing.shareAsync(resultUri, { mimeType, dialogTitle: title });
  } catch { Alert.alert('Share unavailable', 'The saved file could not be shared.'); }
}

export function PdfToolResultPanel({ resultUri, title = 'File saved successfully', filename, mimeType = 'application/pdf', onClose, onReset }: Props) {
  const colors = useColors();
  function close() { onClose(); router.back(); }
  if (!resultUri) return null;
  const isPdf = mimeType === 'application/pdf';
  return (
    <View accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={[styles.successIcon, { backgroundColor: colors.secondary }]}><Feather name="check" size={24} color={colors.primary} /></View>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text accessibilityLiveRegion="polite" style={[styles.detail, { color: colors.mutedForeground }]}>{filename ?? (isPdf ? 'Processed PDF' : 'Processed image')} has been saved to Nexus Plus → PDF Tools.</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Share saved file" onPress={() => void sharePdfResult(resultUri, 'Share saved file', mimeType)} style={[styles.action, { backgroundColor: colors.primary }]}><Feather name="share-2" size={18} color={colors.primaryForeground} /><Text style={[styles.actionText, { color: colors.primaryForeground }]}>Share</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Close PDF tool" onPress={close} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="x" size={18} color={colors.foreground} /><Text style={[styles.actionText, { color: colors.foreground }]}>Close</Text></Pressable>
      </View>
      {!!onReset && <Pressable accessibilityRole="button" accessibilityLabel={isPdf ? 'Process another PDF' : 'Convert another file'} onPress={onReset} style={styles.reset}><Text style={[styles.resetText, { color: colors.primary }]}>{isPdf ? 'Process another PDF' : 'Convert another file'}</Text></Pressable>}
    </View>
  );
}

export const cleanupPdfToolResult = async (_uri: string | null): Promise<void> => undefined;

const styles = StyleSheet.create({ card: { marginHorizontal: 20, marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 16, alignItems: 'center' }, successIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, title: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 5, textAlign: 'center' }, detail: { fontSize: 11, lineHeight: 17, textAlign: 'center' }, actions: { width: '100%', gap: 9, marginTop: 15 }, action: { minHeight: 48, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, reset: { marginTop: 13, minHeight: 42, alignItems: 'center', justifyContent: 'center' }, resetText: { fontSize: 12, fontFamily: 'Inter_700Bold' } });

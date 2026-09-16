import { Feather } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Props = {
  message?: string;
  outputPath: string;
  resultUri: string;
  onClose: () => void;
};

export function AudioEditorResultPanel({ message, outputPath, resultUri, onClose }: Props) {
  const colors = useColors();

  const share = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Share unavailable', 'Sharing is not available on this device.');
        return;
      }
      await Sharing.shareAsync(resultUri, {
        mimeType: 'audio/mp4',
        dialogTitle: 'Share saved audio',
      });
    } catch {
      Alert.alert('Share unavailable', 'The saved audio could not be shared.');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityLabel="Audio saved successfully">
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
          <Feather name="check-circle" size={22} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>
            {message || 'Audio saved successfully.'}
          </Text>
          <Text style={[styles.path, { color: colors.mutedForeground }]} numberOfLines={2}>
            {outputPath}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={share} accessibilityRole="button" accessibilityLabel="Share saved audio" style={[styles.button, { backgroundColor: colors.primary }]}>
          <Feather name="share-2" size={18} color={colors.primaryForeground} />
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Share</Text>
        </Pressable>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close and reset audio editor" style={[styles.button, styles.closeButton, { borderColor: colors.border }]}>
          <Feather name="x" size={18} color={colors.foreground} />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', lineHeight: 19 },
  path: { fontSize: 10.5, lineHeight: 15, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 9 },
  button: { minHeight: 50, flex: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 15 },
  closeButton: { borderWidth: 1 },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});

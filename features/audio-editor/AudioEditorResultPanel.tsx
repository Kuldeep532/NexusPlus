import { Feather } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Props = {
  message?: string;
  outputPath?: string;
  resultUri: string;
  onClose: () => void;
};

export function AudioEditorResultPanel({ message = 'Audio saved successfully.', outputPath, resultUri, onClose }: Props) {
  const colors = useColors();
  const router = useRouter();

  const share = async () => {
    if (!(await Sharing.isAvailableAsync())) return;
    await Sharing.shareAsync(resultUri);
  };

  const close = () => {
    onClose();
    router.back();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
        <Feather name="check-circle" size={24} color={colors.primary} />
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio ready</Text>
      <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
      {outputPath ? <Text numberOfLines={2} style={[styles.path, { color: colors.mutedForeground }]}>{outputPath}</Text> : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Play saved audio" onPress={() => void share()} style={[styles.secondaryButton, { borderColor: colors.border }]}>
          <Feather name="share-2" size={17} color={colors.foreground} />
          <Text style={[styles.buttonText, { color: colors.foreground }]}>Share</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Close audio result" onPress={close} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Feather name="check" size={17} color={colors.primaryForeground} />
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  message: { fontSize: 11, lineHeight: 17 },
  path: { fontSize: 10, lineHeight: 15 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 5 },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  buttonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});

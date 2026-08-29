import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useCctvCameras } from '@/features/cctv/useCctvCameras';
import { readCctvSecrets } from '@/features/cctv/cctvStorage';

export default function CctvEraseScreen() {
  const colors = useColors(); const router = useRouter();
  const { cameraId } = useLocalSearchParams<{ cameraId?: string }>();
  const { cameras } = useCctvCameras();
  const camera = useMemo(() => cameras.find((item) => item.id === cameraId), [cameras, cameraId]);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const erase = async () => {
    if (!camera || busy) return;
    if (!password) { Alert.alert('Password required', 'Enter the erase-protection password before deleting any CCTV data.'); return; }
    setBusy(true);
    try {
      const secrets = await readCctvSecrets(camera.id);
      if (!secrets?.erasePasswordHash) {
        Alert.alert('Erase locked', 'This camera has no configured erase-protection password. Set protection before attempting deletion.');
        return;
      }
      Alert.alert('Verification unavailable', 'A secure password verifier must be configured for this camera before deletion can be enabled. No data was deleted.');
    } finally { setBusy(false); }
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}><Stack.Screen options={{ title: 'Erase Data' }} /><View style={styles.content}><Text style={[styles.title, { color: colors.foreground }]}>Erase CCTV Data</Text><Text style={[styles.warning, { color: colors.foreground }]}>Deletion is protected. Nothing will be erased until the local erase password is securely verified.</Text><TextInput accessibilityLabel="Erase protection password" value={password} onChangeText={setPassword} placeholder="Enter erase password" placeholderTextColor={colors.mutedForeground} secureTextEntry autoCapitalize="none" style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]} /><Pressable accessibilityRole="button" accessibilityLabel="Verify password and erase data" onPress={() => void erase()} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{busy ? 'Checking…' : 'Verify & Erase'}</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Cancel and go back" onPress={() => router.back()} style={[styles.secondary, { borderColor: colors.border }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Cancel</Text></Pressable></View></View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, content: { padding: 18, gap: 14 }, title: { fontSize: 22, fontFamily: 'Inter_700Bold' }, warning: { fontSize: 12, lineHeight: 18 }, input: { minHeight: 50, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 13 }, button: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, secondary: { minHeight: 50, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, buttonText: { fontSize: 12, fontFamily: 'Inter_700Bold' } });

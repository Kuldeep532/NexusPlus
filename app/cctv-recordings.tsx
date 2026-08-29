import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useColors } from '@/hooks/useColors';
import { useCctvCameras } from '@/features/cctv/useCctvCameras';

export default function CctvRecordingsScreen() {
  const colors = useColors();
  const { cameraId } = useLocalSearchParams<{ cameraId?: string }>();
  const { cameras } = useCctvCameras();
  const camera = useMemo(() => cameras.find((item) => item.id === cameraId), [cameras, cameraId]);
  return <View style={[styles.root, { backgroundColor: colors.background }]}><Stack.Screen options={{ title: 'Recordings' }} /><View style={styles.content}><Feather name="archive" size={34} color={colors.primary} /><Text style={[styles.title, { color: colors.foreground }]}>Recording View</Text><Text style={[styles.text, { color: colors.mutedForeground }]}>{camera?.capabilities.recordings ? 'Supported recordings will appear here through the verified camera adapter.' : 'This camera has not reported recording support yet.'}</Text></View></View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }, title: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 10 }, text: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6 }, });

import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useCctvCameras } from '@/features/cctv/useCctvCameras';

export default function CctvCamerasScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cameras, loading } = useCctvCameras();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'CCTV Cameras' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 }]} accessibilityLabel="CCTV camera list">
        <View style={styles.headerRow}>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: colors.foreground }]}>CCTV Cameras</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Cameras stay on this phone. Network details and passwords are hidden.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Add CCTV camera" onPress={() => router.push('/cctv-add')} style={[styles.addButton, { backgroundColor: colors.primary }]}>
            <Feather name="plus" size={21} color={colors.primaryForeground} />
          </Pressable>
        </View>
        {loading ? <Text style={[styles.message, { color: colors.mutedForeground }]}>Loading cameras…</Text> : cameras.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="video" size={30} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No cameras added</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Use QR scan, serial number, or manual detection. Keep the phone and camera on the same Wi-Fi network when LAN discovery is required.</Text>
          </View>
        ) : cameras.map((camera) => (
          <Pressable key={camera.id} accessibilityRole="button" accessibilityLabel={`Open ${camera.name}`} onPress={() => router.push({ pathname: '/cctv-live-view', params: { cameraId: camera.id } })} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="video" size={22} color={colors.primary} /></View>
            <View style={styles.copy}>
              <Text style={[styles.name, { color: colors.foreground }]}>{camera.name}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{camera.manufacturer ?? 'Unknown manufacturer'} · {camera.protocol.toUpperCase()}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{camera.serialNumber ? `Serial ending ${camera.serialNumber.slice(-4)}` : 'Serial not provided'}</Text>
            </View>
            <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  copy: { flex: 1 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 11, lineHeight: 17, marginTop: 5 },
  addButton: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  message: { fontSize: 12 },
  empty: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 11, lineHeight: 17, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  meta: { fontSize: 10.5, lineHeight: 16 },
});

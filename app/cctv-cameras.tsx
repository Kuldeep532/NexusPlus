import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getCctvManagementState } from '@/features/cctv/cctvManagement';
import type { CctvManagementState } from '@/features/cctv/cctvManagement';
import { removeCctvCameraSecurely } from '@/features/cctv/cctvController';

export default function CctvCamerasScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<CctvManagementState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setState(await getCctvManagementState());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const cameras = state?.cameras ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'CCTV Cameras' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 }]} accessibilityLabel="CCTV camera management">
        <View style={styles.headerRow}>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: colors.foreground }]}>CCTV Cameras</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Manage cameras, DVRs and NVRs. Credentials stay on this phone.</Text>
          </View>
          {cameras.length > 0 && <AddButton colors={colors} onPress={() => router.push('/cctv-add')} />}
        </View>

        {loading ? <Text style={[styles.message, { color: colors.mutedForeground }]}>Loading CCTV cameras…</Text> : cameras.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="video" size={42} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No CCTV camera added</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Add an IP camera, network camera, DVR or NVR to start your CCTV setup.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Add CCTV camera" onPress={() => router.push('/cctv-add')} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={18} color={colors.primaryForeground} />
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Add CCTV Camera</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.list}>
              {cameras.map((camera) => (
                <View key={camera.id} style={[styles.cameraCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Open ${camera.name}`} onPress={() => router.push({ pathname: '/cctv-live-view', params: { cameraId: camera.id } })} style={styles.cameraLink}>
                    <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={camera.deviceKind === 'nvr' || camera.deviceKind === 'dvr' ? 'server' : 'video'} size={22} color={colors.primary} /></View>
                    <View style={styles.cameraCopy}>
                      <Text style={[styles.name, { color: colors.foreground }]}>{camera.name}</Text>
                      <Text style={[styles.meta, { color: colors.mutedForeground }]}>{(camera.deviceKind ?? 'ip_camera').replace('_', ' ').toUpperCase()} · {camera.manufacturer ?? 'Unknown manufacturer'}</Text>
                      <Text style={[styles.meta, { color: colors.mutedForeground }]}>{camera.serialNumber ? `Serial ending ${camera.serialNumber.slice(-4)}` : 'Serial not provided'}</Text>
                    </View>
                    <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${camera.name}`} onPress={() => Alert.alert('Remove camera', `Remove ${camera.name} from this phone?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => void removeCctvCameraSecurely(camera.id).then(refresh) }])} style={styles.deleteButton}>
                    <Feather name="trash-2" size={17} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              ))}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Add another CCTV camera" onPress={() => router.push('/cctv-add')} style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="plus-circle" size={18} color={colors.primary} />
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>Add Another CCTV Camera</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function AddButton({ colors, onPress }: { colors: ReturnType<typeof useColors>; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Add CCTV camera" onPress={onPress} style={[styles.addButton, { backgroundColor: colors.primary }]}><Feather name="plus" size={21} color={colors.primaryForeground} /></Pressable>;
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
  empty: { borderWidth: 1, borderRadius: 18, padding: 22, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  emptyText: { fontSize: 11, lineHeight: 17, textAlign: 'center' },
  primaryButton: { minHeight: 50, paddingHorizontal: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 4 },
  buttonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  list: { gap: 10 },
  cameraCard: { minHeight: 90, borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center' },
  cameraLink: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cameraCopy: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  name: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 10.5, lineHeight: 16, marginTop: 2 },
  deleteButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});

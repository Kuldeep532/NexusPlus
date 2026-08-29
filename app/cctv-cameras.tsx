import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getCctvManagementState } from '@/features/cctv/cctvManagement';
import type { CctvManagementState } from '@/features/cctv/cctvManagement';
import { removeCctvCameraSecurely } from '@/features/cctv/cctvController';
import { Alert } from 'react-native';

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
  const devices = state?.devices ?? [];

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
            {devices.map((device) => {
              const deviceCameras = cameras.filter((camera) => device.cameraIds.includes(camera.id));
              return (
                <View key={device.id} style={[styles.deviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.deviceHeader}>
                    <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={device.kind === 'nvr' || device.kind === 'dvr' ? 'server' : 'video'} size={22} color={colors.primary} /></View>
                    <View style={styles.copy}>
                      <Text style={[styles.deviceName, { color: colors.foreground }]}>{device.name}</Text>
                      <Text style={[styles.meta, { color: colors.mutedForeground }]}>{device.kind.toUpperCase().replace('_', ' ')} · {deviceCameras.length} camera{deviceCameras.length === 1 ? '' : 's'}</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Add camera to ${device.name}`} onPress={() => router.push('/cctv-add')} style={[styles.smallAdd, { backgroundColor: colors.primary }]}>
                      <Feather name="plus" size={18} color={colors.primaryForeground} />
                    </Pressable>
                  </View>

                  {deviceCameras.map((camera) => (
                    <View key={camera.id} style={[styles.cameraRow, { borderTopColor: colors.border }]}>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${camera.name}`} onPress={() => router.push({ pathname: '/cctv-live-view', params: { cameraId: camera.id } })} style={styles.cameraLink}>
                        <View style={styles.cameraCopy}>
                          <Text style={[styles.name, { color: colors.foreground }]}>{camera.name}</Text>
                          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{camera.manufacturer ?? 'Unknown manufacturer'} · {(camera.deviceKind ?? 'ip_camera').replace('_', ' ').toUpperCase()}</Text>
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
              );
            })}
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
  deviceCard: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  deviceHeader: { padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  deviceName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  icon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  meta: { fontSize: 10.5, lineHeight: 16, marginTop: 2 },
  smallAdd: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cameraRow: { borderTopWidth: 1, paddingHorizontal: 13, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  cameraLink: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cameraCopy: { flex: 1 },
  name: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  deleteButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});

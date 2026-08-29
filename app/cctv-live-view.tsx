import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useColors } from '@/hooks/useColors';
import { useCctvCameras } from '@/features/cctv/useCctvCameras';

export default function CctvLiveViewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { cameraId } = useLocalSearchParams<{ cameraId?: string }>();
  const { cameras } = useCctvCameras();
  const camera = useMemo(() => cameras.find((item) => item.id === cameraId), [cameras, cameraId]);

  if (!camera) return <View style={[styles.root, { backgroundColor: colors.background }]}><Text style={[styles.error, { color: colors.foreground }]}>Camera not found.</Text></View>;

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: camera.name }} />
    <View style={styles.content}>
      <View accessibilityRole="image" accessible accessibilityLabel={`Live view placeholder for ${camera.name}. Real feed requires a supported camera adapter.`} style={[styles.feed, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="video-off" size={42} color={colors.mutedForeground} />
        <Text style={[styles.feedTitle, { color: colors.foreground }]}>Live Feed</Text>
        <Text style={[styles.feedText, { color: colors.mutedForeground }]}>This camera is saved locally. A live stream is enabled only when a verified protocol/model adapter is available.</Text>
      </View>
      <View style={styles.controls}>
        <ControlButton label={camera.capabilities.audio ? 'Sound' : 'Sound unsupported'} icon="volume-2" disabled={!camera.capabilities.audio} colors={colors} />
        <ControlButton label="Recordings" icon="archive" disabled={!camera.capabilities.recordings} colors={colors} onPress={() => router.push({ pathname: '/cctv-recordings', params: { cameraId: camera.id } })} />
        <ControlButton label="Search & Playback" icon="search" disabled={!camera.capabilities.playback} colors={colors} onPress={() => router.push({ pathname: '/cctv-playback', params: { cameraId: camera.id } })} />
        <ControlButton label="Security" icon="shield" colors={colors} onPress={() => router.push({ pathname: '/cctv-security', params: { cameraId: camera.id } })} />
        <ControlButton label="Erase Data" icon="trash-2" disabled={!camera.capabilities.eraseData} colors={colors} onPress={() => router.push({ pathname: '/cctv-erase', params: { cameraId: camera.id } })} />
      </View>
    </View>
  </View>;
}

function ControlButton({ label, icon, disabled = false, colors, onPress }: { label: string; icon: string; disabled?: boolean; colors: ReturnType<typeof useColors>; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.control, { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.45 : 1 }]}><Feather name={icon as never} size={20} color={colors.foreground} /><Text style={[styles.controlText, { color: colors.foreground }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, content: { flex: 1, padding: 18, gap: 14 }, feed: { minHeight: 310, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 22 }, feedTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 10 }, feedText: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6 }, controls: { gap: 9 }, control: { minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, controlText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' }, error: { padding: 20, fontSize: 14 }, });

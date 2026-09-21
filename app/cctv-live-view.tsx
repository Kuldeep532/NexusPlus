import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useColors } from '@/hooks/useColors';
import { useCctvCameras } from '@/features/cctv/useCctvCameras';
import { executeCctvLiveControl } from '@/features/cctv/cctvControls';
import { getActiveCctvSession, closeCctvSession } from '@/features/cctv/cctvSession';
import { CctvBackendError, type CctvCameraRecord } from '@/features/cctv/cctvBackend';

type Control = { id: 'start' | 'stop' | 'playback' | 'ptz'; label: string; icon: string; capability?: keyof CctvCameraRecord['capabilities'] };
const CONTROLS: readonly Control[] = [
  { id: 'start', label: 'Live View', icon: 'play', capability: 'liveView' },
  { id: 'stop', label: 'Stop', icon: 'square' },
  { id: 'playback', label: 'Playback', icon: 'clock', capability: 'playback' },
  { id: 'ptz', label: 'PTZ', icon: 'move', capability: 'panTiltZoom' },
];

export default function CctvLiveViewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { cameraId } = useLocalSearchParams<{ cameraId?: string }>();
  const { cameras } = useCctvCameras();
  const camera = useMemo(() => cameras.find((item) => item.id === cameraId), [cameras, cameraId]);
  const [running, setRunning] = useState(false);
  const [streamUri, setStreamUri] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const player = useVideoPlayer(streamUri ? { uri: streamUri } : null, (instance) => { if (streamUri) instance.play(); });

  useEffect(() => {
    if (!camera) return;
    const active = getActiveCctvSession(camera.id);
    setRunning(Boolean(active?.live));
    setStreamUri(active?.context.streamUri ?? null);
  }, [camera]);

  useEffect(() => () => { if (camera) void closeCctvSession(camera.id); }, [camera]);

  if (!camera) return <View style={[styles.root, { backgroundColor: colors.background }]}><Text style={[styles.error, { color: colors.foreground }]}>Camera not found.</Text></View>;

  const runControl = async (control: Control['id']) => {
    setMessage(null);
    try {
      await executeCctvLiveControl(camera, control);
      const active = getActiveCctvSession(camera.id);
      if (control === 'start') { setRunning(Boolean(active?.live)); setStreamUri(active?.context.streamUri ?? null); }
      if (control === 'stop') { setRunning(false); setStreamUri(null); }
      if (control === 'playback') router.push({ pathname: '/cctv-playback', params: { cameraId: camera.id } });
    } catch (error) {
      setMessage(error instanceof CctvBackendError ? error.message : error instanceof Error ? error.message : 'Camera control failed.');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: camera.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View accessible accessibilityRole="image" accessibilityLabel={running ? `Authorized live camera stream for ${camera.name}.` : `Live view inactive for ${camera.name}.`} style={[styles.feed, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {running && streamUri ? (
            <VideoView player={player} style={styles.video} contentFit="contain" nativeControls allowsFullscreen />
          ) : (
            <>
              <Feather name="video-off" size={42} color={colors.mutedForeground} />
              <Text style={[styles.feedTitle, { color: colors.foreground }]}>Live View</Text>
              <Text style={[styles.feedText, { color: colors.mutedForeground }]}>Live View authenticates the camera first and then opens the RTSP stream returned by ONVIF.</Text>
            </>
          )}
        </View>
        {message && <View accessibilityRole="alert" style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.messageTitle, { color: colors.foreground }]}>Camera control</Text><Text style={[styles.feedText, { color: colors.mutedForeground }]}>{message}</Text></View>}
        <View style={styles.controls}>
          {CONTROLS.map((item) => {
            const supported = item.capability ? Boolean(camera.capabilities[item.capability]) : true;
            const disabled = item.id === 'start' ? running || !supported : item.id === 'stop' ? !running : !running || !supported;
            return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.label}${supported ? '' : ' unavailable on this camera'}`} accessibilityState={{ disabled }} disabled={disabled} onPress={() => void runControl(item.id)} style={[styles.control, { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.45 : 1 }]}><Feather name={item.icon as never} size={19} color={colors.foreground} /><Text style={[styles.controlText, { color: colors.foreground }]}>{item.label}</Text></Pressable>;
          })}
        </View>
        <View style={styles.secondaryControls}>
          <Pressable disabled={!camera.capabilities.recordings} accessibilityRole="button" accessibilityLabel="Open recordings" accessibilityState={{ disabled: !camera.capabilities.recordings }} onPress={() => router.push({ pathname: '/cctv-recordings', params: { cameraId: camera.id } })} style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: camera.capabilities.recordings ? 1 : 0.45 }]}><Feather name="archive" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Recordings</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 18, gap: 12 }, feed: { minHeight: 290, borderWidth: 1, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', padding: 12 }, video: { width: '100%', minHeight: 290, borderRadius: 14 }, feedTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 10 }, feedText: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6, paddingHorizontal: 10 }, controls: { gap: 8 }, control: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }, controlText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' }, secondaryControls: { flexDirection: 'row', gap: 8 }, secondaryButton: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, messageCard: { borderWidth: 1, borderRadius: 14, padding: 13 }, messageTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' }, error: { padding: 20, fontSize: 14 },
});
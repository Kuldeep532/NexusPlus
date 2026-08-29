import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { useCctvCameras } from '@/features/cctv/useCctvCameras';
import { executeCctvLiveControl, type CctvLiveControl } from '@/features/cctv/cctvControls';
import { getActiveCctvSession, startCctvLiveView, closeCctvSession } from '@/features/cctv/cctvSession';
import { CctvBackendError } from '@/features/cctv/cctvBackend';

const CONTROLS: Array<{ id: CctvLiveControl; label: string; icon: string; capability?: keyof ReturnType<typeof useCameraCapabilityMap> }> = [
  { id: 'start', label: 'Start', icon: 'play' },
  { id: 'stop', label: 'Stop', icon: 'square' },
  { id: 'sound', label: 'Sound', icon: 'volume-2', capability: 'audio' },
  { id: 'switch_camera', label: 'Switch Camera', icon: 'repeat', capability: 'switchCamera' },
  { id: 'playback', label: 'Playback', icon: 'clock', capability: 'playback' },
  { id: 'flip', label: 'Flip', icon: 'refresh-cw', capability: 'flip' },
  { id: 'ptz', label: 'PTZ', icon: 'move', capability: 'panTiltZoom' },
  { id: 'night_vision', label: 'Night Vision', icon: 'moon', capability: 'nightVision' },
  { id: 'talk', label: 'Talk', icon: 'mic', capability: 'talk' },
];

function useCameraCapabilityMap() { return { audio: false, switchCamera: false, playback: false, flip: false, panTiltZoom: false, nightVision: false, talk: false }; }

export default function CctvLiveViewScreen() {
  const colors = useColors();
  const router = useRouter();
  const { cameraId } = useLocalSearchParams<{ cameraId?: string }>();
  const { cameras } = useCctvCameras();
  const camera = useMemo(() => cameras.find((item) => item.id === cameraId), [cameras, cameraId]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => () => { if (camera) void closeCctvSession(camera.id); }, [camera]);
  if (!camera) return <View style={[styles.root, { backgroundColor: colors.background }]}><Text style={[styles.error, { color: colors.foreground }]}>Camera not found.</Text></View>;

  const runControl = async (control: CctvLiveControl) => {
    setMessage(null);
    try {
      await executeCctvLiveControl(camera, control);
      setRunning(control === 'start' ? true : control === 'stop' ? false : Boolean(getActiveCctvSession(camera.id)));
      if (control === 'playback') router.push({ pathname: '/cctv-playback', params: { cameraId: camera.id } });
    } catch (error) {
      const text = error instanceof CctvBackendError ? error.message : error instanceof Error ? error.message : 'Camera control failed.';
      setMessage(text);
    }
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: camera.name }} />
    <ScrollView contentContainerStyle={styles.content}>
      <View accessibilityRole="image" accessible accessibilityLabel={`${running ? 'Live session active' : 'Live session not started'} for ${camera.name}.`} style={[styles.feed, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name={running ? 'video' : 'video-off'} size={42} color={colors.mutedForeground} />
        <Text style={[styles.feedTitle, { color: colors.foreground }]}>{running ? 'Live Session Active' : 'Live View'}</Text>
        <Text style={[styles.feedText, { color: colors.mutedForeground }]}>{running ? 'The verified adapter owns the actual media transport.' : 'Press Start to open the camera session. A real feed requires a verified camera adapter.'}</Text>
      </View>
      {message && <View accessibilityRole="alert" style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.messageTitle, { color: colors.foreground }]}>Camera control</Text><Text style={[styles.feedText, { color: colors.mutedForeground }]}>{message}</Text></View>}
      <View style={styles.controls}>{CONTROLS.map((item) => {
        const supported = item.id === 'start' || item.id === 'stop' || item.id === 'sound' || item.id === 'switch_camera' || item.id === 'playback' || item.id === 'flip' || item.id === 'ptz' || item.id === 'night_vision' || item.id === 'talk' ? (item.capability ? Boolean(camera.capabilities[item.capability]) : true) : false;
        const disabled = item.id === 'start' ? running || !camera.capabilities.liveView : item.id === 'stop' ? !running : !running || !supported;
        return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ disabled }} disabled={disabled} onPress={() => void runControl(item.id)} style={[styles.control, { backgroundColor: colors.card, borderColor: colors.border, opacity: disabled ? 0.45 : 1 }]}><Feather name={item.icon as never} size={19} color={colors.foreground} /><Text style={[styles.controlText, { color: colors.foreground }]}>{item.label}</Text></Pressable>;
      })}</View>
      <View style={styles.secondaryControls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open recordings" onPress={() => router.push({ pathname: '/cctv-recordings', params: { cameraId: camera.id } })} style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="archive" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Recordings</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open security" onPress={() => router.push({ pathname: '/cctv-security', params: { cameraId: camera.id } })} style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="shield" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Security</Text></Pressable>
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, content: { padding: 18, gap: 12 }, feed: { minHeight: 290, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 22 }, feedTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 10 }, feedText: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 6 }, controls: { gap: 8 }, control: { minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }, controlText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' }, secondaryControls: { flexDirection: 'row', gap: 8 }, secondaryButton: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, secondaryText: { fontSize: 11, fontFamily: 'Inter_700Bold' }, messageCard: { borderWidth: 1, borderRadius: 14, padding: 13 }, messageTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' }, error: { padding: 20, fontSize: 14 } });

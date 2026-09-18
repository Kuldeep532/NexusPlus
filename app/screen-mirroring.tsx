import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { castMedia, getMirrorStatus, replaceCastMedia, requestScreenCapture, stopCastMedia, stopScreenProjection } from '@/features/screen-mirroring/screenMirrorNative';
import { saveMirrorSession } from '@/features/screen-mirroring/screenMirrorStore';
import type { MirrorMediaItem, MirrorMode, MirrorTarget } from '@/features/screen-mirroring/screenMirrorTypes';

function toItem(asset: DocumentPicker.DocumentPickerAsset): MirrorMediaItem {
  const mime = asset.mimeType ?? '';
  return { uri: asset.uri, mimeType: mime, kind: mime.startsWith('image/') ? 'image' : 'video', name: asset.name, durationMs: asset.duration ?? undefined };
}

export default function ScreenMirroringScreen() {
  const colors = useColors();
  const [target, setTarget] = useState<MirrorTarget>('tv');
  const [mode, setMode] = useState<MirrorMode | null>(null);
  const [status, setStatus] = useState('Choose a casting mode.');
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<MirrorMediaItem | null>(null);
  const [receiverUrl, setReceiverUrl] = useState<string | null>(null);

  useEffect(() => {
    void getMirrorStatus().then((s) => {
      setMode(s.projectionActive ? 'complete-screen' : s.mediaActive ? 'media' : null);
      setReceiverUrl(typeof s.receiverUrl === 'string' ? s.receiverUrl : null);
    });
  }, []);

  const startScreen = async (next: Extract<MirrorMode, 'specific-app' | 'complete-screen'>) => {
    setBusy(true);
    try {
      const started = await requestScreenCapture(next);
      if (!started) {
        setStatus('Screen capture permission was cancelled.');
        return;
      }
      setMode(next);
      const s = await getMirrorStatus();
      setReceiverUrl(typeof s.receiverUrl === 'string' ? s.receiverUrl : null);
      setStatus(next === 'specific-app' ? 'Specific-app sharing is active.' : 'Complete-screen sharing is active.');
      await saveMirrorSession({ id: String(Date.now()), target, mode: next, active: true, startedAt: Date.now() });
    } catch (e) {
      Alert.alert('Screen Mirroring', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const pick = async (replace = false) => {
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'video/*'], multiple: false, copyToCacheDirectory: true });
      if (result.canceled) return;
      const item = toItem(result.assets[0]);
      if (replace) {
        await replaceCastMedia(item);
        setStatus('Media changed without disconnecting the casting session.');
      } else {
        const response = await castMedia(target, item);
        if (response && typeof response === 'object' && 'receiverUrl' in response) {
          const url = (response as { receiverUrl?: unknown }).receiverUrl;
          setReceiverUrl(typeof url === 'string' && url.length ? url : null);
        }
        setStatus(item.kind === 'image' ? 'Image is casting. Back does not stop the cast session.' : 'Video is casting.');
        setMode('media');
      }
      setSelected(item);
      await saveMirrorSession({ id: String(Date.now()), target, mode: 'media', active: true, selectedMedia: item, startedAt: Date.now() });
    } catch (e) {
      Alert.alert('Media Cast', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    try {
      if (mode === 'media') await stopCastMedia();
      else if (mode) await stopScreenProjection();
      setMode(null);
      setSelected(null);
      setReceiverUrl(null);
      setStatus('Casting stopped.');
      await saveMirrorSession(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Screen Mirroring' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Screen Mirroring</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Persistent media casting plus Android screen projection.</Text>

        <View style={styles.targets}>
          {(['tv', 'computer'] as MirrorTarget[]).map((value) => (
            <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: target === value }} onPress={() => setTarget(value)} style={[styles.target, { backgroundColor: target === value ? colors.secondary : colors.card, borderColor: target === value ? colors.primary : colors.border }]}>
              <Feather name={value === 'tv' ? 'tv' : 'monitor'} size={18} color={colors.primary} />
              <Text style={[styles.targetText, { color: colors.foreground }]}>{value === 'tv' ? 'Mirror with TV' : 'Mirror with computer'}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.foreground }]}>Screen mirroring</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Android shows its own screen-sharing permission dialog. Nexus Plus does not bypass it.</Text>
          <Pressable disabled={busy} onPress={() => void startScreen('specific-app')} style={[styles.button, { backgroundColor: colors.secondary }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Cast specific apps</Text></Pressable>
          <Pressable disabled={busy} onPress={() => void startScreen('complete-screen')} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Cast complete screen</Text></Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.foreground }]}>Cast video or image</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Choose from the Android file picker. Change media without reconnecting.</Text>
          <Pressable disabled={busy} onPress={() => void pick(false)} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Select video or image</Text></Pressable>
          {selected ? <Pressable disabled={busy} onPress={() => void pick(true)} style={[styles.button, { backgroundColor: colors.secondary }]}><Text style={[styles.buttonText, { color: colors.foreground }]}>Change media</Text></Pressable> : null}
        </View>

        {receiverUrl ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.section, { color: colors.foreground }]}>Computer receiver</Text>
            <Text selectable style={[styles.url, { color: colors.primary }]}>{receiverUrl}</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Open this URL in any modern browser on the same Wi-Fi network. No separate computer receiver application is required.</Text>
          </View>
        ) : null}

        <View accessible accessibilityLiveRegion="polite" style={[styles.status, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>Status</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{status}</Text>
          {mode ? <Text style={[styles.body, { color: colors.primary }]}>Active mode: {mode}</Text> : null}
        </View>

        {mode ? <Pressable disabled={busy} onPress={() => void stop()} style={[styles.stop, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="square" size={18} color={colors.foreground} /><Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold' }}>Stop Casting</Text></Pressable> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 18, gap: 12, paddingBottom: 30 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, lineHeight: 19 },
  targets: { gap: 10 },
  target: { minHeight: 58, borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  targetText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  card: { borderWidth: 1, borderRadius: 18, padding: 15, gap: 10 },
  section: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  body: { fontSize: 12, lineHeight: 18 },
  button: { minHeight: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontFamily: 'Inter_700Bold' },
  url: { fontSize: 12, lineHeight: 18 },
  status: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 4 },
  statusTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  stop: { minHeight: 52, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
});

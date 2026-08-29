import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useCctvCameras } from '@/features/cctv/useCctvCameras';
import { loadCctvPlaybackPage } from '@/features/cctv/cctvPlayback';
import type { CctvRecordingItem } from '@/features/cctv/cctvBackend';

function formatTime(value: number): string {
  return new Date(value).toLocaleString();
}

export default function CctvRecordingsScreen() {
  const colors = useColors();
  const { cameraId } = useLocalSearchParams<{ cameraId?: string }>();
  const { cameras } = useCctvCameras();
  const camera = useMemo(() => cameras.find((item) => item.id === cameraId), [cameras, cameraId]);
  const [items, setItems] = useState<CctvRecordingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!camera) return;
    setLoading(true);
    setError(null);
    void loadCctvPlaybackPage(camera, { from: Date.now() - 24 * 60 * 60 * 1000, to: Date.now(), limit: 50, sort: 'newest' })
      .then((page) => { if (!cancelled) setItems(page.items); })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setItems([]);
          setError(cause instanceof Error ? cause.message : 'Recording service is unavailable.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [camera]);

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: 'Recordings' }} />
    <ScrollView contentContainerStyle={styles.content} accessibilityLabel="CCTV recordings">
      <View style={styles.header}>
        <View style={styles.iconWrap}><Feather name="archive" size={28} color={colors.primary} /></View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.foreground }]}>Recording View</Text>
          <Text style={[styles.text, { color: colors.mutedForeground }]}>{camera?.name ?? 'Camera'} · Last 24 hours</Text>
        </View>
      </View>
      {!camera ? <Text style={[styles.text, { color: colors.mutedForeground }]}>Camera not found.</Text> : !camera.capabilities.recordings ? (
        <Text style={[styles.text, { color: colors.mutedForeground }]}>This camera has not reported recording support.</Text>
      ) : loading ? <Text style={[styles.text, { color: colors.mutedForeground }]}>Loading recordings…</Text> : error ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Recording service unavailable</Text>
          <Text style={[styles.text, { color: colors.mutedForeground }]}>{error}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Retry loading recordings" onPress={() => setCameraRefresh((value) => value + 1)} style={[styles.retry, { backgroundColor: colors.primary }]}><Text style={[styles.retryText, { color: colors.primaryForeground }]}>Retry</Text></Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.cardTitle, { color: colors.foreground }]}>No recordings available</Text><Text style={[styles.text, { color: colors.mutedForeground }]}>The verified camera adapter returned no recording items for the selected period.</Text></View>
      ) : items.map((item) => (
        <View key={item.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.label ?? 'Recording'}</Text>
          <Text style={[styles.text, { color: colors.mutedForeground }]}>{formatTime(item.startedAt)} — {formatTime(item.endedAt)}</Text>
        </View>
      ))}
    </ScrollView>
  </View>;
}

function setCameraRefresh(_value: (current: number) => number): void {
  // Intentionally no-op placeholder; refresh support is added when the screen is migrated to a shared query controller.
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 18, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  text: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 4 },
  cardTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  retry: { marginTop: 8, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
});

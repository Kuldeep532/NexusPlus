import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { discoverLocalAudio, pickAudioFromFileManager } from '@/features/audio-editor/audioEditorSource';
import { canAddImage, clampImageDuration, getImageTimelineDuration, getRemainingAudioTime, type AudioToVideoImage } from '@/features/audio-editor/audioToVideoTypes';
import type { AudioEditorSource } from '@/features/audio-editor/types';
import { assertAudioEditorNative, type AudioProbeResult } from '@/modules/audio-editor-native';

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function parseSeconds(value: string): number | null {
  const numeric = Number(value.trim());
  return Number.isFinite(numeric) && numeric >= 1 ? numeric * 1000 : null;
}

export default function AudioToVideoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [audio, setAudio] = useState<AudioEditorSource | null>(null);
  const [probe, setProbe] = useState<AudioProbeResult | null>(null);
  const [images, setImages] = useState<AudioToVideoImage[]>([]);
  const [library, setLibrary] = useState<AudioEditorSource[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const audioDurationMs = probe?.durationMs ?? audio?.durationMs ?? 0;
  const timelineDurationMs = useMemo(() => getImageTimelineDuration(images), [images]);
  const remainingMs = useMemo(() => getRemainingAudioTime(audioDurationMs, images), [audioDurationMs, images]);
  const imageUploadEnabled = canAddImage(audioDurationMs, images) && !loading;
  const timelineComplete = Boolean(audio && audioDurationMs > 0 && timelineDurationMs === audioDurationMs);
  const timelineOverrun = timelineDurationMs > audioDurationMs;

  const loadAudio = useCallback(async (next: AudioEditorSource) => {
    setLoading(true);
    setMessage('Reading audio duration…');
    try {
      const metadata = await assertAudioEditorNative().probe(next.uri);
      const resolved = { ...next, durationMs: metadata.durationMs };
      setAudio(resolved);
      setProbe(metadata);
      setImages([]);
      setMessage(`Audio loaded. ${formatTime(metadata.durationMs)} is available for images.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to inspect this audio file.');
    } finally {
      setLoading(false);
    }
  }, []);

  const chooseAudio = useCallback(async () => {
    const picked = await pickAudioFromFileManager();
    if (picked) await loadAudio(picked);
  }, [loadAudio]);

  const discover = useCallback(async () => {
    setLoading(true);
    setMessage('Scanning local audio…');
    try {
      const result = await discoverLocalAudio(query);
      setLibrary(result.audio);
      setMessage(result.permissionGranted ? `${result.audio.length} audio file${result.audio.length === 1 ? '' : 's'} found.` : 'Music and audio permission is required to scan local audio.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to scan local audio.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const addImageFromLibrary = useCallback(async () => {
    if (!audio || !audioDurationMs || !imageUploadEnabled) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: false, quality: 0.9 });
    if (result.canceled || !result.assets[0]) return;

    const remaining = getRemainingAudioTime(audioDurationMs, images);
    if (remaining < 1000) {
      setMessage('The image was not added because the audio timeline has no remaining time. Remove an image to continue.');
      return;
    }
    const defaultDuration = Math.max(1000, Math.min(5000, remaining));
    const asset = result.assets[0];
    setImages((current) => [
      ...current,
      { id: `${asset.assetId ?? asset.uri}-${Date.now()}`, uri: asset.uri, name: asset.fileName ?? `Image ${current.length + 1}`, durationMs: defaultDuration },
    ]);
    setMessage(`Image added for ${formatTime(defaultDuration)}. ${formatTime(Math.max(0, remaining - defaultDuration))} remains.`);
  }, [audio, audioDurationMs, imageUploadEnabled, images]);

  const removeImage = (id: string) => {
    setImages((current) => current.filter((image) => image.id !== id));
    setMessage('Image removed. The freed audio time is available again.');
  };

  const changeDuration = (index: number, nextMs: number) => {
    setImages((current) => current.map((image, imageIndex) => imageIndex === index ? { ...image, durationMs: clampImageDuration(nextMs, audioDurationMs, current, index) } : image));
  };

  const nudgeDuration = (index: number, deltaMs: number) => {
    const image = images[index];
    if (!image) return;
    changeDuration(index, image.durationMs + deltaMs);
  };

  const exportVideo = async () => {
    if (!audio || !timelineComplete || loading || timelineOverrun) return;
    setLoading(true);
    setMessage('Preparing Audio to Video export…');
    try {
      // The existing repository exposes native video editing operations, but does not yet expose
      // an image-sequence + audio render operation through the stable TypeScript adapter. Do not fake export success.
      const outputPath = await createAudioEditorOutputPath('Audio to Video', audio.name, 'video');
      void outputPath;
      throw new Error('Audio to Video render is not yet wired to the stable native video-export adapter. The timeline and validation are ready, but no fake export is performed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to export Audio to Video.');
    } finally {
      setLoading(false);
    }
  };

  const timingLabel = timelineComplete ? 'The images are uploaded with audio timing.' : timelineOverrun ? 'Images exceed the audio duration. Remove or shorten an image.' : `${formatTime(remainingMs)} of audio timing remains.`;

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Audio to Video' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="film" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Audio to Video</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create a video from one audio track and one or more images. Every image is governed by the audio timeline.</Text>
        </View>
      </View>

      <Pressable onPress={chooseAudio} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
        <Feather name="music" size={19} color={colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose Audio</Text>
      </Pressable>

      <View style={styles.searchRow}>
        <TextInput value={query} onChangeText={setQuery} placeholder="Search local audio" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} accessibilityLabel="Search local audio" />
        <Pressable onPress={discover} accessibilityRole="button" style={[styles.scanButton, { backgroundColor: colors.secondary }]}><Feather name="search" size={19} color={colors.primary} /></Pressable>
      </View>

      {library.length > 0 && <View style={styles.libraryList}>{library.map((item) => <Pressable key={item.id} onPress={() => loadAudio(item)} accessibilityRole="button" style={[styles.libraryItem, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="music" size={18} color={colors.primary} /><View style={styles.libraryCopy}><Text numberOfLines={1} style={[styles.itemTitle, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{formatTime(item.durationMs)}</Text></View></Pressable>)}</View>}

      {audio && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{audio.name}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{formatTime(audioDurationMs)} • {probe?.sampleRate ?? 0} Hz • {probe?.channels ?? 0} channel(s)</Text>
          <View style={[styles.timingBox, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
            <Feather name={timelineComplete ? 'check-circle' : 'clock'} size={18} color={colors.primary} />
            <View style={styles.timingCopy}>
              <Text accessibilityLiveRegion="polite" style={[styles.timingTitle, { color: colors.foreground }]}>{timingLabel}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>Image timing: {formatTime(timelineDurationMs)} / Audio: {formatTime(audioDurationMs)}</Text>
            </View>
          </View>

          <Pressable disabled={!imageUploadEnabled} onPress={addImageFromLibrary} accessibilityRole="button" accessibilityState={{ disabled: !imageUploadEnabled }} style={[styles.primaryButton, { backgroundColor: imageUploadEnabled ? colors.primary : colors.muted }]}>
            <Feather name="image" size={19} color={colors.primaryForeground} />
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{imageUploadEnabled ? 'Add Image' : 'Image Upload Disabled'}</Text>
          </Pressable>

          {images.length === 0 && <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Add images until the audio timing is covered. Uploading is blocked once the timeline is full.</Text>}

          {images.map((image, index) => (
            <View key={image.id} style={[styles.imageCard, { borderColor: colors.border }]}>
              <View style={styles.imageHeader}>
                <View style={styles.imageBadge}><Text style={[styles.imageBadgeText, { color: colors.primary }]}>{index + 1}</Text></View>
                <View style={styles.imageCopy}><Text numberOfLines={1} style={[styles.itemTitle, { color: colors.foreground }]}>{image.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>Timing: {formatTime(image.durationMs)}</Text></View>
                <Pressable onPress={() => removeImage(image.id)} accessibilityRole="button" accessibilityLabel={`Remove image ${index + 1}`} style={[styles.removeButton, { borderColor: colors.border }]}><Feather name="trash-2" size={17} color={colors.primary} /><Text style={[styles.removeText, { color: colors.foreground }]}>Remove image</Text></Pressable>
              </View>
              <View style={styles.durationRow}>
                <TextInput value={(image.durationMs / 1000).toFixed(1)} onChangeText={(value) => { const parsed = parseSeconds(value); if (parsed !== null) changeDuration(index, parsed); }} keyboardType="decimal-pad" style={[styles.durationInput, { color: colors.foreground, borderColor: colors.border }]} accessibilityLabel={`Image ${index + 1} duration seconds`} />
                <Text style={[styles.secondsLabel, { color: colors.mutedForeground }]}>seconds</Text>
                <Pressable onPress={() => nudgeDuration(index, -1000)} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>−1s</Text></Pressable>
                <Pressable onPress={() => nudgeDuration(index, 1000)} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>+1s</Text></Pressable>
              </View>
            </View>
          ))}

          <Pressable disabled={!timelineComplete || loading} onPress={exportVideo} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: timelineComplete && !loading ? colors.primary : colors.muted }]}>
            {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="video" size={19} color={colors.primaryForeground} />}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{loading ? 'Working…' : 'Create Video'}</Text>
          </Pressable>
        </View>
      )}

      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 14 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 11.5, lineHeight: 17 },
  primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 16 },
  buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  searchRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  searchInput: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 13 },
  scanButton: { width: 48, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  libraryList: { gap: 8, marginTop: 12 },
  libraryItem: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center' },
  libraryCopy: { flex: 1, marginLeft: 10 },
  itemTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold' },
  itemMeta: { fontSize: 10.5, marginTop: 3 },
  card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 10.5, lineHeight: 15 },
  timingBox: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  timingCopy: { flex: 1 },
  timingTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  emptyText: { fontSize: 11, lineHeight: 16 },
  imageCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  imageHeader: { flexDirection: 'row', alignItems: 'center' },
  imageBadge: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  imageBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  imageCopy: { flex: 1, marginLeft: 8, marginRight: 8 },
  removeButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  removeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  durationInput: { width: 78, minHeight: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, fontSize: 12 },
  secondsLabel: { fontSize: 10.5, flex: 1 },
  smallButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 8 },
  smallButtonText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  message: { fontSize: 11, lineHeight: 17, marginTop: 12 },
});

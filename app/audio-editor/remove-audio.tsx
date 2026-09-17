import { Feather } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { VideoEditorResultPanel } from '@/features/audio-editor/VideoEditorResultPanel';
import { removeAudioFromVideo } from '@/features/audio-editor/removeVideoAudio';

export default function RemoveAudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [video, setVideo] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [message, setMessage] = useState('Choose a video to create an audio-free copy.');

  const chooseVideo = useCallback(async () => {
    if (working) return;
    const picked = await DocumentPicker.getDocumentAsync({ type: ['video/*'], multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setVideo({ uri: asset.uri, name: asset.name || 'video', mimeType: asset.mimeType });
    setResult(null);
    setMessage('Video selected. Press Remove Audio to create a new copy without audio.');
  }, [working]);

  const removeAudio = useCallback(async () => {
    if (!video || working) return;
    setWorking(true);
    setResult(null);
    setMessage('Removing audio track without re-encoding the video…');
    try {
      const baseName = video.name.replace(/\.[^.]+$/, '') || 'video';
      const outputDirectory = `${FileSystem.documentDirectory || ''}Nexus Plus Audio Editor/Remove Audio from Video/`;
      await FileSystem.makeDirectoryAsync(outputDirectory, { intermediates: true });
      const outputPath = `${outputDirectory}${baseName}-no-audio-${Date.now()}.mp4`;
      const processed = await removeAudioFromVideo(video.uri, outputPath);
      setResult(processed.outputPath);
      setMessage('Audio removed successfully. The original video was not changed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to remove audio from this video.');
    } finally {
      setWorking(false);
    }
  }, [video, working]);

  const reset = useCallback(() => {
    setVideo(null);
    setResult(null);
    setWorking(false);
    setMessage('Choose a video to create an audio-free copy.');
  }, []);

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}>
      <Stack.Screen options={{ title: 'Remove Audio from Video' }} />
      <View style={styles.headerRow}><View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="volume-x" size={24} color={colors.primary} /></View><View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Remove Audio from Video</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create a copy of a video without its audio tracks. The original file stays unchanged.</Text></View></View>
      {!result && <>
        <Pressable onPress={chooseVideo} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: working ? 0.65 : 1 }]}><Feather name="video" size={19} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Choose Video</Text></Pressable>
        {video && <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.fileRow}><View style={[styles.fileIcon, { backgroundColor: colors.secondary }]}><Feather name="file" size={20} color={colors.primary} /></View><View style={styles.fileCopy}><Text numberOfLines={2} style={[styles.fileName, { color: colors.foreground }]}>{video.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{video.mimeType || 'Video file'}</Text></View></View>
          <View style={[styles.infoBox, { borderColor: colors.border, backgroundColor: colors.secondary }]}><Feather name="check-circle" size={18} color={colors.primary} /><Text style={[styles.infoText, { color: colors.foreground }]}>Only audio tracks are removed. Video frames are copied to a new MP4 without video re-encoding.</Text></View>
          <Pressable onPress={removeAudio} disabled={working} accessibilityRole="button" accessibilityState={{ disabled: working }} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: working ? 0.65 : 1 }]}>{working ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="volume-x" size={19} color={colors.primaryForeground} />}<Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{working ? 'Removing Audio…' : 'Remove Audio'}</Text></Pressable>
        </View>}
      </>}
      {result && <VideoEditorResultPanel outputPath={result} resultUri={`file://${result}`} message="Audio removed successfully. Audio-free video copy saved locally." onClose={reset} />}
      {!!message && <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>}
      {working && <Text style={[styles.meta, { color: colors.mutedForeground, textAlign: 'center', marginTop: 10 }]}>Processing is running natively.</Text>}
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
  card: { marginTop: 16, borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  fileIcon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1 },
  fileName: { fontSize: 13.5, fontFamily: 'Inter_700Bold', lineHeight: 18 },
  meta: { fontSize: 10.5, lineHeight: 15 },
  infoBox: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 11, lineHeight: 17 },
  message: { fontSize: 11.5, lineHeight: 17, marginTop: 12 },
});

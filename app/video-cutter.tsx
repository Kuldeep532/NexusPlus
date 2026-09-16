import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { removeVideoSegment } from '@/features/video-editor/videoCutter';

export default function VideoCutterScreen() {
  const colors = useColors();
  const [inputUri, setInputUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [startSeconds, setStartSeconds] = useState('10');
  const [endSeconds, setEndSeconds] = useState('20');
  const [busy, setBusy] = useState(false);
  const [outputUri, setOutputUri] = useState<string | null>(null);

  const startMs = Number(startSeconds) * 1000;
  const endMs = Number(endSeconds) * 1000;
  const validRange = useMemo(() => Number.isFinite(startMs) && Number.isFinite(endMs) && startMs >= 0 && endMs > startMs, [startMs, endMs]);

  async function pickVideo() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'video/*', copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets?.[0]) return;
      setInputUri(result.assets[0].uri);
      setFileName(result.assets[0].name ?? 'Selected video');
      setOutputUri(null);
    } catch (error) {
      Alert.alert('Video selection failed', error instanceof Error ? error.message : 'Unable to select the video.');
    }
  }

  async function cutSegment() {
    if (!inputUri) {
      Alert.alert('Select a video', 'Choose a video before cutting a segment.');
      return;
    }
    if (!validRange) {
      Alert.alert('Invalid cut range', 'End time must be greater than start time, and both values must be valid seconds.');
      return;
    }

    setBusy(true);
    setOutputUri(null);
    try {
      const result = await removeVideoSegment({ inputUri, startMs, endMs });
      setOutputUri(result.outputUri);
      Alert.alert('Video cut complete', `Removed ${startSeconds}–${endSeconds} seconds and joined the remaining parts.`);
    } catch (error) {
      Alert.alert('Video cut failed', error instanceof Error ? error.message : 'Native video processing failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Video Cutter' }} />
      <View style={styles.content}>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="scissors" size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.foreground }]}>Video Cutter</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>Remove a specific segment from the middle of a video and join the beginning and ending parts into one output.</Text>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Select video" onPress={pickVideo} style={[styles.selectButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Feather name="video" size={19} color={colors.foreground} />
          <View style={styles.selectCopy}>
            <Text style={[styles.selectTitle, { color: colors.foreground }]}>{fileName || 'Select a video'}</Text>
            <Text style={[styles.selectSubtitle, { color: colors.mutedForeground }]}>{inputUri ? 'Video ready for cutting' : 'Choose an MP4 or another Android-supported video'}</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Segment to remove</Text>
          <Text style={[styles.help, { color: colors.mutedForeground }]}>Enter the start and end time in seconds. The selected middle segment is removed; everything before and after it is preserved.</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>Start (seconds)</Text>
              <TextInput accessibilityLabel="Segment start in seconds" keyboardType="decimal-pad" value={startSeconds} onChangeText={setStartSeconds} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>End (seconds)</Text>
              <TextInput accessibilityLabel="Segment end in seconds" keyboardType="decimal-pad" value={endSeconds} onChangeText={setEndSeconds} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            </View>
          </View>
          <View accessibilityRole="text" style={[styles.rangeStatus, { borderColor: validRange ? colors.primary : colors.border }]}>
            <Text style={[styles.rangeStatusText, { color: validRange ? colors.primary : colors.mutedForeground }]}>{validRange ? `Remove ${startSeconds}s → ${endSeconds}s` : 'Enter a valid start/end range'}</Text>
          </View>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Remove selected video segment" disabled={busy} onPress={cutSegment} style={[styles.cutButton, { backgroundColor: colors.primary }, busy && styles.disabled]}>
          {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="scissors" size={18} color={colors.primaryForeground} />}
          <Text style={[styles.cutText, { color: colors.primaryForeground }]}>{busy ? 'Processing…' : 'Remove Segment'}</Text>
        </Pressable>

        {outputUri ? <View style={[styles.result, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Feather name="check-circle" size={24} color={colors.primary} />
          <View style={styles.resultCopy}><Text style={[styles.resultTitle, { color: colors.foreground }]}>Output created</Text><Text selectable style={[styles.resultUri, { color: colors.mutedForeground }]}>{outputUri}</Text></View>
        </View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14 },
  hero: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 8 },
  title: { fontSize: 21, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  selectButton: { minHeight: 70, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  selectCopy: { flex: 1 },
  selectTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  selectSubtitle: { marginTop: 3, fontSize: 10.5, fontFamily: 'Inter_400Regular' },
  card: { borderWidth: 1, borderRadius: 18, padding: 15, gap: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  help: { fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', gap: 10 },
  field: { flex: 1, gap: 6 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14, fontFamily: 'Inter_700Bold' },
  rangeStatus: { minHeight: 40, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  rangeStatusText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  cutButton: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  cutText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  disabled: { opacity: 0.7 },
  result: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10 },
  resultCopy: { flex: 1, gap: 3 },
  resultTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  resultUri: { fontSize: 10, lineHeight: 15, fontFamily: 'Inter_400Regular' },
});

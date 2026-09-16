import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { createAudioEditorOutputPath } from '@/features/audio-editor/audioEditorExport';
import { discoverLocalAudio } from '@/features/audio-editor/audioEditorSource';
import { VoicePitchSoundSelector } from '@/features/audio-editor/VoicePitchSoundSelector';
import type { VoicePitchProfile } from '@/features/audio-editor/voicePitchingEngine';
import { changeAudioVoice } from '@/features/audio-editor/voiceChangerEngine';
import { loadStoredVoiceModels, importVoiceModel, type StoredVoiceModel } from '@/features/audio-editor/voiceModelStorage';
import { AudioEditorResultPanel } from '@/features/audio-editor/AudioEditorResultPanel';

export default function VoiceChangerScreen() {
  const colors = useColors();
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioName, setAudioName] = useState('Selected Audio');
  const [selected, setSelected] = useState<VoicePitchProfile | null>(null);
  const [models, setModels] = useState<StoredVoiceModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<StoredVoiceModel | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ uri: string; path: string; name: string } | null>(null);
  const [message, setMessage] = useState('Choose an audio file or scan the audio library.');

  const refreshModels = useCallback(async () => {
    setModels(await loadStoredVoiceModels());
  }, []);

  useEffect(() => {
    void refreshModels();
  }, [refreshModels]);

  const pickAudio = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ['audio/*'], copyToCacheDirectory: true, multiple: false });
      if (picked.canceled || !picked.assets[0]) return;
      const asset = picked.assets[0];
      const mime = asset.mimeType ?? '';
      if (!mime.startsWith('audio/')) {
        Alert.alert('Audio only', 'Voice Changer supports audio files only. Video files are not supported here.');
        return;
      }
      setAudioUri(asset.uri);
      setAudioName(asset.name || 'Selected Audio');
      setResult(null);
      setMessage('Audio selected. Choose a voice and apply the change.');
    } catch {
      Alert.alert('Audio selection failed', 'The audio file could not be selected.');
    }
  };

  const scanLibrary = async () => {
    try {
      const found = await discoverLocalAudio('');
      if (!found.permissionGranted) {
        setMessage('Music and audio permission is required to scan the local audio library.');
        return;
      }
      const first = found.audio[0];
      if (!first) {
        setMessage('No local audio files were found.');
        return;
      }
      setAudioUri(first.uri);
      setAudioName(first.name);
      setResult(null);
      setMessage(`Selected from audio library: ${first.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to scan the audio library.');
    }
  };

  const importModel = async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ['application/octet-stream', 'model/onnx', 'audio/*'], copyToCacheDirectory: true, multiple: false });
      if (picked.canceled || !picked.assets[0]) return;
      const asset = picked.assets[0];
      const extension = asset.name?.toLowerCase().endsWith('.onnx');
      if (!extension) {
        Alert.alert('ONNX model required', 'Upload an ONNX voice model file.');
        return;
      }
      const model = await importVoiceModel(asset.uri, asset.name?.replace(/\.onnx$/i, '') || 'Custom Voice', 'onnx');
      setModels((current) => [model, ...current]);
      setSelectedModel(model);
      setMessage(`Voice model saved locally: ${model.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to import the voice model.');
    }
  };

  const applyChange = async () => {
    if (!audioUri || processing) return;
    if (!selected && !selectedModel) {
      Alert.alert('Choose a voice', 'Select a generated voice profile or an imported ONNX model.');
      return;
    }
    setProcessing(true);
    try {
      const outputPath = await createAudioEditorOutputPath('Voice Changer', audioName, 'voice-changed', 'm4a');
      const changed = await changeAudioVoice({
        inputPath: audioUri,
        outputPath,
        profile: selected ?? undefined,
        voiceModel: selectedModel ?? undefined,
      });
      setResult({ uri: changed.outputPath, path: outputPath, name: selectedModel?.name ?? selected?.name ?? 'Voice Changed' });
      setMessage('Voice changed audio was saved automatically.');
    } catch (error) {
      Alert.alert('Voice change unavailable', error instanceof Error ? error.message : 'The selected voice could not be applied.');
    } finally {
      setProcessing(false);
    }
  };

  const playPreview = async () => {
    if (!result?.uri) return;
    try {
      const playable = await FileSystem.getInfoAsync(result.uri);
      if (!playable.exists) {
        Alert.alert('Preview unavailable', 'The saved audio file could not be opened.');
        return;
      }
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Preview unavailable', 'Audio preview is not available in this build.');
        return;
      }
      await Sharing.shareAsync(result.uri, { mimeType: 'audio/mp4', dialogTitle: 'Open saved audio' });
    } catch {
      Alert.alert('Preview unavailable', 'The saved audio could not be opened.');
    }
  };

  const reset = () => {
    setAudioUri(null);
    setAudioName('Selected Audio');
    setSelected(null);
    setSelectedModel(null);
    setResult(null);
    setMessage('Choose an audio file or scan the audio library.');
  };

  if (result) {
    return (
      <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
        <Stack.Screen options={{ title: 'Voice Changer' }} />
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Preview before leaving</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>{result.name}</Text>
          <Pressable onPress={playPreview} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.primary }]}><Feather name="play" size={18} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Open / Play Result</Text></Pressable>
        </View>
        <AudioEditorResultPanel outputPath={result.path} resultUri={result.uri} message="Voice changed audio saved successfully." onClose={reset} />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Voice Changer' }} />
      <View style={styles.headerRow}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="mic" size={24} color={colors.primary} /></View>
        <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Voice Changer</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Audio files only. Choose a generated profile or import your own ONNX voice model.</Text></View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Audio source</Text>
        <View style={styles.row}>
          <Pressable onPress={pickAudio} disabled={processing} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Feather name="folder" size={18} color={colors.primaryForeground} /><Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Upload Audio</Text></Pressable>
          <Pressable onPress={scanLibrary} disabled={processing} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.primary }]}><Feather name="music" size={18} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Audio Library</Text></Pressable>
        </View>
        {audioUri ? <Text style={[styles.selectedAudio, { color: colors.foreground }]} numberOfLines={2}>Selected: {audioName}</Text> : null}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose voice</Text>
        <VoicePitchSoundSelector value={selected?.id} onChange={(profile) => { setSelected(profile); setSelectedModel(null); }} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.modelHeader}>
          <View style={styles.headerCopy}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Voice / ONNX</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>Imported models are stored locally inside Nexus Plus.</Text></View>
          <Pressable onPress={importModel} disabled={processing} accessibilityRole="button" style={[styles.smallButton, { borderColor: colors.primary }]}><Feather name="upload" size={17} color={colors.primary} /><Text style={[styles.smallButtonText, { color: colors.primary }]}>Upload</Text></Pressable>
        </View>
        {models.length === 0 ? <Text style={[styles.meta, { color: colors.mutedForeground }]}>No custom voice model imported yet.</Text> : models.map((model) => <Pressable key={model.id} onPress={() => { setSelectedModel(model); setSelected(null); }} accessibilityRole="button" style={[styles.modelItem, { borderColor: selectedModel?.id === model.id ? colors.primary : colors.border, backgroundColor: selectedModel?.id === model.id ? colors.secondary : colors.background }]}><Feather name="cpu" size={17} color={colors.primary} /><View style={styles.headerCopy}><Text style={[styles.modelTitle, { color: colors.foreground }]}>{model.name}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{model.kind.toUpperCase()} • stored locally</Text></View></Pressable>)}
      </View>

      <Pressable onPress={applyChange} disabled={!audioUri || (!selected && !selectedModel) || processing} accessibilityRole="button" style={[styles.processButton, { backgroundColor: colors.primary, opacity: !audioUri || (!selected && !selectedModel) || processing ? 0.45 : 1 }]}><Feather name="sliders" size={19} color={colors.primaryForeground} /><Text style={[styles.processText, { color: colors.primaryForeground }]}>{processing ? 'Changing Voice…' : 'Change Voice & Save'}</Text></Pressable>
      <Text accessibilityLiveRegion="polite" style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { padding: 18, paddingBottom: 34, gap: 14 }, headerRow: { flexDirection: 'row', alignItems: 'center' }, heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 14 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 11.5, lineHeight: 17 }, card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 }, row: { flexDirection: 'row', gap: 8 }, primaryButton: { flex: 1, minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12 }, secondaryButton: { minHeight: 50, flex: 1, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 12 }, buttonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, secondaryButtonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, selectedAudio: { fontSize: 12, lineHeight: 17 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, meta: { fontSize: 10.5, lineHeight: 15 }, modelHeader: { flexDirection: 'row', alignItems: 'center' }, smallButton: { minHeight: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, smallButtonText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' }, modelItem: { minHeight: 56, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, modelTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold', marginBottom: 3 }, processButton: { minHeight: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, processText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, message: { fontSize: 11, lineHeight: 16, textAlign: 'center' }, previewCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 } });

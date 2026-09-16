import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getVoiceStudioDisplayName, importVoiceStudioOnnx, syncVoiceStudioFolder, type VoiceStudioModel } from '@/features/audio-editor/voiceStudio';
import { getVoiceStudioTtsCapability, validateVoiceStudioTtsRequest } from '@/features/audio-editor/voiceStudioTts';

export default function VoiceStudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [models, setModels] = useState<VoiceStudioModel[]>([]);
  const [selected, setSelected] = useState<VoiceStudioModel | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Voice Studio is ready.');

  const refresh = useCallback(async () => {
    const next = await syncVoiceStudioFolder();
    setModels(next);
    setSelected((current) => current && next.some((model) => model.id === current.id) ? current : next[0] ?? null);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const importModel = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/octet-stream', 'model/*', '*/*'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.name.toLowerCase().endsWith('.onnx')) {
        Alert.alert('Unsupported model', 'Voice Studio accepts ONNX voice model files only.');
        return;
      }
      await importVoiceStudioOnnx(asset.uri, asset.name.replace(/\.onnx$/i, ''));
      await refresh();
      setStatus('ONNX voice model imported locally.');
    } catch {
      Alert.alert('Voice Studio', 'The ONNX model could not be imported.');
    } finally {
      setLoading(false);
    }
  };

  const generateSpeech = async () => {
    if (!selected) {
      setStatus('Select a compatible cloned voice model first.');
      return;
    }
    try {
      validateVoiceStudioTtsRequest({ text, model: selected, outputPath: `${FileSystem.documentDirectory ?? ''}voice-studio-output.m4a` });
      const capability = getVoiceStudioTtsCapability(selected);
      if (!capability.supported) {
        setStatus(capability.reason ?? 'This ONNX model cannot be used as a Voice Studio TTS model.');
        return;
      }
      setStatus('Generating speech offline…');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Voice generation could not start.');
    }
  };

  return <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}>
    <Stack.Screen options={{ title: 'Voice Studio' }} />
    <View style={styles.header}><View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="mic" size={24} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Voice Studio</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Offline text-to-speech from an existing compatible cloned voice model.</Text></View></View>
    <Pressable onPress={importModel} disabled={loading} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}><Feather name="upload" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{loading ? 'Importing…' : 'Upload ONNX Voice Model'}</Text></Pressable>
    <Pressable onPress={refresh} disabled={loading} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="refresh-cw" size={18} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Detect Local Voice Models</Text></Pressable>
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Cloned voices</Text>
      {models.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No ONNX voice models detected.</Text> : models.map((model, index) => <Pressable key={model.id} onPress={() => setSelected(model)} accessibilityRole="radio" accessibilityState={{ selected: selected?.id === model.id }} style={[styles.model, { borderColor: selected?.id === model.id ? colors.primary : colors.border, backgroundColor: selected?.id === model.id ? colors.secondary : colors.background }]}><View style={[styles.modelIcon, { backgroundColor: colors.secondary }]}><Feather name="volume-2" size={17} color={colors.primary} /></View><View style={styles.modelCopy}><Text style={[styles.modelName, { color: colors.foreground }]}>{getVoiceStudioDisplayName(model, index)}</Text><Text style={[styles.modelMeta, { color: colors.mutedForeground }]}>ONNX • {model.source === 'device-folder' ? 'Detected locally' : 'Added in Voice Studio'}</Text></View></Pressable>)}
    </View>
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Generate speech</Text>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>This screen uses an existing cloned voice for TTS. It does not clone or train a voice.</Text>
      <TextInput value={text} onChangeText={setText} placeholder="Enter text" placeholderTextColor={colors.mutedForeground} multiline style={[styles.textInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} accessibilityLabel="Text to synthesize" />
      <Pressable onPress={generateSpeech} disabled={!selected || loading} accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: !selected || loading ? 0.45 : 1 }]}><Feather name="volume-2" size={18} color={colors.primaryForeground} /><Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Generate With Cloned Voice</Text></Pressable>
    </View>
    <Text accessibilityLiveRegion="polite" style={[styles.note, { color: colors.mutedForeground }]}>{status}</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 14 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 11.5, lineHeight: 17 }, primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 14 }, primaryButtonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, secondaryButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, marginTop: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, secondaryButtonText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, card: { marginTop: 14, borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, empty: { marginTop: 2, fontSize: 11, lineHeight: 16 }, model: { minHeight: 58, borderWidth: 1, borderRadius: 14, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' }, modelIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, modelCopy: { flex: 1, marginLeft: 10 }, modelName: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, modelMeta: { fontSize: 10.5, marginTop: 3 }, meta: { fontSize: 10.5, lineHeight: 15 }, textInput: { minHeight: 140, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top', fontSize: 13 }, note: { marginTop: 12, fontSize: 11, lineHeight: 16, textAlign: 'center' } });

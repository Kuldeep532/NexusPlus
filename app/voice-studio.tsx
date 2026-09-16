import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { importVoiceStudioOnnx, loadVoiceStudioModels, syncVoiceStudioFolder, type VoiceStudioModel } from '@/features/audio-editor/voiceStudio';

export default function VoiceStudioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [models, setModels] = useState<VoiceStudioModel[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setModels(await syncVoiceStudioFolder());
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
    } catch {
      Alert.alert('Voice Studio', 'The ONNX model could not be imported.');
    } finally {
      setLoading(false);
    }
  };

  return <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}>
    <Stack.Screen options={{ title: 'Voice Studio' }} />
    <View style={styles.header}><View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="mic" size={24} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Voice Studio</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Manage local ONNX voice models used by Voice Changer and Fun Recordings.</Text></View></View>
    <Pressable onPress={importModel} disabled={loading} accessibilityRole="button" accessibilityState={{ disabled: loading }} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}><Feather name="upload" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{loading ? 'Importing…' : 'Upload ONNX Voice Model'}</Text></Pressable>
    <Pressable onPress={refresh} disabled={loading} accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colors.border }]}><Feather name="refresh-cw" size={18} color={colors.primary} /><Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Detect Local Voice Models</Text></Pressable>
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Available voices</Text>
      {models.length === 0 ? <Text style={[styles.empty, { color: colors.mutedForeground }]}>No compatible ONNX voice models were detected.</Text> : models.map((model) => <View key={model.id} style={[styles.model, { borderColor: colors.border }]}><View style={[styles.modelIcon, { backgroundColor: colors.secondary }]}><Feather name="volume-2" size={17} color={colors.primary} /></View><View style={styles.modelCopy}><Text style={[styles.modelName, { color: colors.foreground }]}>{model.name}</Text><Text style={[styles.modelMeta, { color: colors.mutedForeground }]}>ONNX voice model • {model.source === 'device-folder' ? 'Detected locally' : 'Added in Voice Studio'}</Text></View></View>)}
    </View>
    <Text style={[styles.note, { color: colors.mutedForeground }]}>Voice models stay local to this app. Voice Changer and Fun Recordings read this shared inventory; the model file itself is not embedded in source code.</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 14 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 11.5, lineHeight: 17 }, primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, primaryButtonText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, secondaryButton: { minHeight: 48, borderWidth: 1, borderRadius: 14, marginTop: 9, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, secondaryButtonText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, card: { marginTop: 14, borderWidth: 1, borderRadius: 18, padding: 14 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, empty: { marginTop: 9, fontSize: 11, lineHeight: 16 }, model: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingVertical: 11, marginTop: 10 }, modelIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, modelCopy: { flex: 1, marginLeft: 10 }, modelName: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, modelMeta: { fontSize: 10.5, marginTop: 3 }, note: { marginTop: 12, fontSize: 10.5, lineHeight: 16, textAlign: 'center' } });

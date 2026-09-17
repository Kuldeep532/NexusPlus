import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { preparePdfOutputPath } from '@/features/pdf-native/pdfPageOperations';
import { readPdfMetadataWithGotenberg, writePdfMetadataWithGotenberg } from '@/features/pdf-gotenberg/metadataApi';
import { PdfToolResultPanel } from '@/features/pdf-native/PdfToolResultPanel';

type PickedFile = { uri: string; name: string };
type Meta = { Author: string; Title: string; Subject: string; Keywords: string };

function baseName(name: string): string { return name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document'; }
function initialMeta(): Meta { return { Author: '', Title: '', Subject: '', Keywords: '' }; }

export default function PdfMetadataScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [meta, setMeta] = useState<Meta>(initialMeta());
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function pickFile() {
    setStatus(''); setResult(null);
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setFile({ uri: asset.uri, name: asset.name || 'document.pdf' });
    try {
      const current = await readPdfMetadataWithGotenberg(asset.uri);
      setMeta({ Author: String(current.Author ?? ''), Title: String(current.Title ?? ''), Subject: String(current.Subject ?? ''), Keywords: Array.isArray(current.Keywords) ? current.Keywords.join(', ') : String(current.Keywords ?? '') });
      setStatus('PDF selected. Existing metadata loaded.');
    } catch (error) {
      setStatus(error instanceof Error ? `PDF selected. Metadata could not be read: ${error.message}` : 'PDF selected. Metadata could not be read.');
      setMeta(initialMeta());
    }
  }

  async function saveMetadata() {
    if (!file) { setStatus('Choose a PDF first.'); return; }
    setBusy(true); setResult(null); setStatus('Updating PDF metadata with Gotenberg…');
    try {
      const outputName = `${baseName(file.name)}-metadata.pdf`;
      await preparePdfOutputPath('PDF Metadata', outputName);
      const keywords = meta.Keywords.split(',').map((value) => value.trim()).filter(Boolean);
      const metadata: Record<string, unknown> = {};
      if (meta.Author.trim()) metadata.Author = meta.Author.trim();
      if (meta.Title.trim()) metadata.Title = meta.Title.trim();
      if (meta.Subject.trim()) metadata.Subject = meta.Subject.trim();
      if (keywords.length) metadata.Keywords = keywords;
      const uri = await writePdfMetadataWithGotenberg(file.uri, outputName, metadata);
      setResult(uri); setStatus('Metadata updated successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'PDF metadata update could not be completed.');
    } finally { setBusy(false); }
  }

  function update(key: keyof Meta, value: string) { setMeta((previous) => ({ ...previous, [key]: value })); }
  function reset() { setFile(null); setMeta(initialMeta()); setResult(null); setStatus(''); }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'PDF Metadata' }} />
      {busy ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Updating PDF metadata</Text><Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status}</Text></View> :
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }}>
        <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="file-document-edit-outline" size={29} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>PDF Metadata</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Read and update PDF metadata using the existing Gotenberg PDF Engines metadata API.</Text></View></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose PDF" onPress={() => void pickFile()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="file-plus" size={20} color={colors.primary} /><View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>Choose PDF</Text><Text numberOfLines={1} style={[styles.pickDetail, { color: colors.mutedForeground }]}>{file?.name || 'Select a PDF document'}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
        {!!file && <View style={styles.form}>{(['Author', 'Title', 'Subject', 'Keywords'] as const).map((key) => <View key={key} style={styles.field}><Text style={[styles.label, { color: colors.foreground }]}>{key}</Text><TextInput accessibilityLabel={key} value={meta[key]} onChangeText={(value) => update(key, value)} placeholder={`Enter ${key.toLowerCase()}`} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /></View>)}</View>}
        {!result && <Pressable accessibilityRole="button" accessibilityLabel="Save PDF metadata" onPress={() => void saveMetadata()} disabled={!file} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (!file || pressed) && styles.disabled]}><MaterialCommunityIcons name="content-save-outline" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Save Metadata</Text></Pressable>}
        {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('successfully') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}
        <PdfToolResultPanel resultUri={result} filename={result ? `${baseName(file?.name || 'document')}-metadata.pdf` : undefined} mimeType="application/pdf" onClose={reset} onReset={reset} title="PDF metadata updated" />
      </ScrollView>}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }, icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 13 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18 }, pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }, pickCopy: { flex: 1, marginHorizontal: 12 }, pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 }, pickDetail: { fontSize: 11 }, form: { marginHorizontal: 20, marginTop: 16, gap: 12 }, field: { gap: 6 }, label: { fontSize: 12, fontFamily: 'Inter_700Bold' }, input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontSize: 13 }, primary: { marginHorizontal: 20, marginTop: 18, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, status: { marginHorizontal: 20, marginTop: 16, fontSize: 11, lineHeight: 17 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 }, loadingText: { fontSize: 13, lineHeight: 19, textAlign: 'center' }, pressed: { opacity: 0.75 }, disabled: { opacity: 0.5 } });

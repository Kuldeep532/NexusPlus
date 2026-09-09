import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getPdfInfo } from '@uzimandias/react-native-pdf-to-image';
import { assertValidPageCount, pageRangeStrings, sanitizePageRangeInput } from '@/features/pdf-native/pdfPageInput';
import { splitPdfWithNativeEngine } from '@/features/pdf-native/pdfPageOperations';
import { PdfToolResultPanel, cleanupPdfToolResult } from '@/features/pdf-native/PdfToolResultPanel';

type PdfInput = { uri: string; name: string; pageCount: number };

function safeBaseName(name: string): string {
  return name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document';
}

export default function ExtractPdfPagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pdf, setPdf] = useState<PdfInput | null>(null);
  const [selection, setSelection] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<string | null>(null);

  async function pickPdf() {
    await cleanupPdfToolResult(result);
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    try {
      const asset = picked.assets[0];
      const pageCount = assertValidPageCount((await getPdfInfo(asset.uri)).pageCount);
      setPdf({ uri: asset.uri, name: asset.name || 'document.pdf', pageCount });
      setSelection(''); setResult(null);
      setStatus(`${pageCount} pages loaded. Valid page numbers are 1 to ${pageCount}.`);
    } catch (error) { setPdf(null); setResult(null); setStatus(error instanceof Error ? error.message : 'Could not read the PDF page count.'); }
  }

  function updateSelection(value: string) { if (pdf) setSelection(sanitizePageRangeInput(value, pdf.pageCount)); }
  function resetTool() { void cleanupPdfToolResult(result); setPdf(null); setSelection(''); setResult(null); setStatus(''); }

  async function extract() {
    if (!pdf || !selection.trim()) { setStatus(`Enter page numbers or ranges from 1 to ${pdf?.pageCount ?? 0}.`); return; }
    setBusy(true); setResult(null); setStatus('Cutting and extracting selected pages…');
    try {
      const ranges = pageRangeStrings(selection, pdf.pageCount);
      const directory = `${FileSystem.cacheDirectory || ''}nexus-pdf-cut-extract-${Date.now()}/`;
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      const parts = await splitPdfWithNativeEngine(pdf.uri, directory, [ranges.join(',')], pdf.pageCount);
      const uri = parts[0];
      if (!uri) throw new Error('The PDF engine did not return an output file.');
      setResult(uri); setStatus('Pages cut and extracted successfully.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not cut and extract the selected pages.'); }
    finally { setBusy(false); }
  }

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!pdf && !result && !selection && !busy) return false;
      resetTool();
      return false;
    });
    return () => subscription.remove();
  }, [busy, pdf, result, selection]));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'Cut & Extract Pages' }} />
      {busy ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Cutting & Extracting Pages</Text><Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status}</Text></View> :
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="content-cut" size={28} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Cut & Extract Pages</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Cut selected pages from a PDF and save them as a new PDF.</Text></View></View>
        <Pressable accessibilityRole="button" accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'} onPress={() => void pickPdf()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="file-plus" size={20} color={colors.primary} /><View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? `${pdf.pageCount} pages • valid range 1-${pdf.pageCount}` : 'Select a local PDF file'}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
        {pdf && !result && <><Text style={[styles.label, { color: colors.foreground }]}>Pages to cut & extract</Text><TextInput accessibilityLabel="Pages to cut and extract" accessibilityHint={`Enter page numbers from 1 to ${pdf.pageCount}. Example: 2, 4-6.`} value={selection} onChangeText={updateSelection} placeholder={`1-${pdf.pageCount}`} placeholderTextColor={colors.mutedForeground} keyboardType="numbers-and-punctuation" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.hint, { color: colors.mutedForeground }]}>Only 1-{pdf.pageCount} are accepted. Numbers above {pdf.pageCount} are automatically clamped.</Text><Pressable accessibilityRole="button" accessibilityLabel="Cut and extract selected PDF pages" onPress={() => void extract()} disabled={!selection.trim()} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (pressed || !selection.trim()) && styles.disabled]}><MaterialCommunityIcons name="content-cut" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Cut & Extract Pages</Text></Pressable></>}
        {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('successfully') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}
        <PdfToolResultPanel resultUri={result} filename={result ? `${safeBaseName(pdf?.name ?? 'document')}-cut-extracted.pdf` : undefined} onClose={resetTool} onReset={resetTool} title="Cut & extract completed" />
      </ScrollView>}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 22 }, icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 13 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18 }, pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }, pickCopy: { flex: 1, marginHorizontal: 12 }, pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 }, pickDetail: { fontSize: 11 }, label: { marginHorizontal: 20, marginTop: 20, marginBottom: 8, fontSize: 12, fontFamily: 'Inter_700Bold' }, input: { marginHorizontal: 20, minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 }, hint: { marginHorizontal: 20, marginTop: 8, fontSize: 11, lineHeight: 17 }, primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, status: { marginHorizontal: 20, marginTop: 15, fontSize: 11, lineHeight: 17 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 }, loadingText: { textAlign: 'center', fontSize: 13, lineHeight: 19 }, pressed: { opacity: 0.74 }, disabled: { opacity: 0.5 } });

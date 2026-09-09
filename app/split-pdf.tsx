import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { splitPdfWithNativeEngine, preparePdfOutputPath } from '@/features/pdf-native/pdfPageOperations';
import { assertValidPageCount, sanitizePageRangeInput } from '@/features/pdf-native/pdfPageInput';
import { PdfToolResultPanel } from '@/features/pdf-native/PdfToolResultPanel';
import { getPdfInfo } from '@uzimandias/react-native-pdf-to-image';

type PdfInput = { uri: string; name: string; pageCount: number };

export default function SplitPdfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pdf, setPdf] = useState<PdfInput | null>(null);
  const [ranges, setRanges] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [outputs, setOutputs] = useState<string[]>([]);

  async function pickPdf() {
    setStatus(''); setOutputs([]);
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      const asset = result.assets[0];
      const pageCount = assertValidPageCount((await getPdfInfo(asset.uri)).pageCount);
      setPdf({ uri: asset.uri, name: asset.name || 'document.pdf', pageCount });
      setRanges(''); setStatus(`${pageCount} pages loaded. Valid page numbers are 1 to ${pageCount}.`);
    } catch (error) { setPdf(null); setRanges(''); setStatus(error instanceof Error ? error.message : 'Could not read the PDF page count.'); }
  }

  function updateRanges(value: string) { setRanges(pdf ? sanitizePageRangeInput(value, pdf.pageCount) : value); }

  async function split() {
    if (!pdf || !ranges.trim()) { setStatus(`Enter page numbers or ranges from 1 to ${pdf?.pageCount ?? 0}.`); return; }
    setBusy(true); setOutputs([]); setStatus('Splitting PDF…');
    try {
      const pageRanges = ranges.split(',').map((item) => item.trim()).filter(Boolean);
      const tempDirectory = `${FileSystem.cacheDirectory || ''}nexus-pdf-split-${Date.now()}/`;
      await FileSystem.makeDirectoryAsync(tempDirectory, { intermediates: true });
      const result = await splitPdfWithNativeEngine(pdf.uri, tempDirectory, pageRanges, pdf.pageCount);
      const persisted: string[] = [];
      const { copyAsync, deleteAsync } = await import('expo-file-system/legacy');
      for (let index = 0; index < result.length; index += 1) {
        const temporary = result[index];
        const filename = `part-${index + 1}.pdf`;
        const output = await preparePdfOutputPath('Split PDFs', filename);
        await deleteAsync(output, { idempotent: true });
        await copyAsync({ from: temporary, to: output });
        persisted.push(output);
      }
      await deleteAsync(tempDirectory, { idempotent: true });
      setOutputs(persisted); setStatus(`PDF split into ${persisted.length} file${persisted.length === 1 ? '' : 's'} successfully.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not split this PDF.'); }
    finally { setBusy(false); }
  }

  function reset() { setPdf(null); setRanges(''); setOutputs([]); setStatus(''); }
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (!pdf && !outputs.length && !ranges && !busy) return false; reset(); return false; });
    return () => sub.remove();
  }, [busy, outputs.length, pdf, ranges]));

  return <View style={[styles.root, { backgroundColor: colors.background }]}><Stack.Screen options={{ title: 'Split PDF' }} />{busy ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Splitting PDF</Text><Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status}</Text></View> : <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="content-cut" size={29} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Split PDF</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Cut a PDF into separate documents using page ranges.</Text></View></View>
    <Pressable accessibilityRole="button" accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'} onPress={() => void pickPdf()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="file-plus" size={20} color={colors.primary} /><View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? `${pdf.pageCount} pages • valid range 1-${pdf.pageCount}` : 'Select a local PDF file'}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
    {pdf && !outputs.length && <><Text style={[styles.label, { color: colors.foreground }]}>Page ranges</Text><TextInput accessibilityLabel="Page ranges" accessibilityHint={`Enter page numbers from 1 to ${pdf.pageCount}. Use commas for separate outputs.`} value={ranges} onChangeText={updateRanges} keyboardType="numbers-and-punctuation" placeholder={`1-${Math.min(3, pdf.pageCount)}`} placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.hint, { color: colors.mutedForeground }]}>Only 1-{pdf.pageCount} are accepted. Numbers above {pdf.pageCount} are automatically clamped.</Text><Pressable accessibilityRole="button" accessibilityLabel="Split PDF" onPress={() => void split()} disabled={!ranges.trim()} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (pressed || !ranges.trim()) && styles.disabled]}><MaterialCommunityIcons name="content-cut" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Split PDF</Text></Pressable></>}
    {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('successfully') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}
    {outputs.length === 1 && <PdfToolResultPanel resultUri={outputs[0]} filename="part-1.pdf" onClose={reset} onReset={reset} title="Split completed" />}
    {outputs.length > 1 && <View style={styles.outputs}>{outputs.map((uri, index) => <View key={uri} style={[styles.output, { backgroundColor: colors.card, borderColor: colors.border }]}><View><Text style={[styles.outputTitle, { color: colors.foreground }]}>Part {index + 1} saved</Text><Text style={[styles.outputDetail, { color: colors.mutedForeground }]}>Nexus Plus → PDF Tools → Split PDFs</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Share split PDF part ${index + 1}`} onPress={async () => { const { sharePdfResult } = await import('@/features/pdf-native/PdfToolResultPanel'); await sharePdfResult(uri, `Share split PDF part ${index + 1}`); }}><Feather name="share-2" size={18} color={colors.primary} /></Pressable></View>)}</View>}
  </ScrollView>}</View>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 22 }, icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 13 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18 }, pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }, pickCopy: { flex: 1, marginHorizontal: 12 }, pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 }, pickDetail: { fontSize: 11 }, label: { marginHorizontal: 20, marginTop: 20, marginBottom: 8, fontSize: 12, fontFamily: 'Inter_700Bold' }, input: { marginHorizontal: 20, minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 }, hint: { marginHorizontal: 20, marginTop: 8, fontSize: 11, lineHeight: 17 }, primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, status: { marginHorizontal: 20, marginTop: 15, fontSize: 11, lineHeight: 17 }, outputs: { marginHorizontal: 20, marginTop: 15, gap: 8 }, output: { minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, outputTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' }, outputDetail: { fontSize: 10, marginTop: 3 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 }, loadingText: { textAlign: 'center', fontSize: 13, lineHeight: 19 }, pressed: { opacity: 0.74 }, disabled: { opacity: 0.5 } });
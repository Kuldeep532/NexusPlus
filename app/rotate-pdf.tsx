import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPdfInfo } from '@uzimandias/react-native-pdf-to-image';
import { useColors } from '@/hooks/useColors';
import { assertValidPageCount, pageRangeStrings, sanitizePageRangeInput } from '@/features/pdf-native/pdfPageInput';
import { PdfNativeBridge } from '@/features/pdf-native/PdfNativeBridge';
import { preparePdfOutputPath } from '@/features/pdf-native/pdfPageOperations';
import { PdfToolResultPanel } from '@/features/pdf-native/PdfToolResultPanel';

type PdfInput = { uri: string; name: string; pageCount: number };
type Rotation = 90 | 180 | 270;

function safeBaseName(name: string): string {
  return name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document';
}

export default function RotatePdfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pdf, setPdf] = useState<PdfInput | null>(null);
  const [selection, setSelection] = useState('');
  const [rotation, setRotation] = useState<Rotation>(90);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<string | null>(null);

  function resetTool() {
    setPdf(null);
    setSelection('');
    setResult(null);
    setStatus('');
    setRotation(90);
  }

  async function pickPdf() {
    resetTool();
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    try {
      const asset = picked.assets[0];
      const pageCount = assertValidPageCount((await getPdfInfo(asset.uri)).pageCount);
      setPdf({ uri: asset.uri, name: asset.name || 'document.pdf', pageCount });
      setSelection(`1-${pageCount}`);
      setStatus(`${pageCount} pages loaded. Valid page numbers are 1 to ${pageCount}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not read the PDF page count.');
    }
  }

  function updateSelection(value: string) {
    if (pdf) setSelection(sanitizePageRangeInput(value, pdf.pageCount));
  }

  async function rotatePdf() {
    if (!pdf || !selection.trim()) {
      setStatus(`Enter page numbers or ranges from 1 to ${pdf?.pageCount ?? 0}.`);
      return;
    }
    setBusy(true);
    setResult(null);
    setStatus(`Rotating selected pages ${rotation}°…`);
    try {
      const ranges = pageRangeStrings(selection, pdf.pageCount);
      const filename = `${safeBaseName(pdf.name)}-rotated-${rotation}.pdf`;
      const outputPath = await preparePdfOutputPath('Rotate PDFs', filename);
      const uri = await PdfNativeBridge.rotate(pdf.uri, outputPath, ranges, rotation, pdf.pageCount);
      setResult(uri);
      setStatus(`PDF rotated ${rotation}° and saved successfully.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not rotate this PDF.');
    } finally {
      setBusy(false);
    }
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
      <Stack.Screen options={{ title: 'Rotate PDF' }} />
      {busy ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Rotating PDF</Text>
          <Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="rotate-right" size={29} color={colors.primary} /></View>
            <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Rotate PDF</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Rotate selected pages and save a new PDF.</Text></View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'} onPress={() => void pickPdf()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <Feather name="file-plus" size={20} color={colors.primary} />
            <View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? `${pdf.pageCount} pages • valid range 1-${pdf.pageCount}` : 'Select a local PDF file'}</Text></View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
          {pdf && !result && <>
            <Text style={[styles.label, { color: colors.foreground }]}>Pages to rotate</Text>
            <TextInput accessibilityLabel="Pages to rotate" accessibilityHint={`Enter page numbers from 1 to ${pdf.pageCount}. Example: 1, 3-5.`} value={selection} onChangeText={updateSelection} placeholder={`1-${pdf.pageCount}`} placeholderTextColor={colors.mutedForeground} keyboardType="numbers-and-punctuation" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>Only 1-{pdf.pageCount} are accepted. Numbers above {pdf.pageCount} are automatically clamped.</Text>
            <Text style={[styles.label, { color: colors.foreground }]}>Rotation</Text>
            <View style={styles.options}>{([90, 180, 270] as Rotation[]).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: rotation === value }} accessibilityLabel={`Rotate ${value} degrees`} onPress={() => setRotation(value)} style={[styles.option, { backgroundColor: rotation === value ? colors.primary : colors.card, borderColor: colors.border }]}><Text style={[styles.optionText, { color: rotation === value ? colors.primaryForeground : colors.foreground }]}>{value}°</Text></Pressable>)}</View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Rotate selected pages ${rotation} degrees`} onPress={() => void rotatePdf()} disabled={!selection.trim()} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (pressed || !selection.trim()) && styles.disabled]}><MaterialCommunityIcons name="rotate-right" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Rotate PDF</Text></Pressable>
          </>}
          {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('successfully') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}
          <PdfToolResultPanel resultUri={result} filename={result ? `${safeBaseName(pdf?.name ?? 'document')}-rotated-${rotation}.pdf` : undefined} title="PDF rotated and saved" onClose={resetTool} onReset={resetTool} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 22 }, icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 13 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18 }, pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }, pickCopy: { flex: 1, marginHorizontal: 12 }, pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 }, pickDetail: { fontSize: 11 }, label: { marginHorizontal: 20, marginTop: 20, marginBottom: 8, fontSize: 12, fontFamily: 'Inter_700Bold' }, input: { marginHorizontal: 20, minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 }, hint: { marginHorizontal: 20, marginTop: 8, fontSize: 11, lineHeight: 17 }, options: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 }, option: { flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, optionText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, status: { marginHorizontal: 20, marginTop: 15, fontSize: 11, lineHeight: 17 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 }, loadingText: { textAlign: 'center', fontSize: 13, lineHeight: 19 }, pressed: { opacity: 0.74 }, disabled: { opacity: 0.5 },
});

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { convertPage, getPdfInfo } from '@uzimandias/react-native-pdf-to-image';
import { zip } from 'react-native-zip-archive';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { playDocumentProcessingSound } from '@/features/audio/audioPlayback';
import { assertValidPageCount, parsePageRanges, sanitizePageRangeInput } from '@/features/pdf-native/pdfPageInput';
import { PdfNativeBridge } from '@/features/pdf-native/PdfNativeBridge';
import { preparePdfOutputPath } from '@/features/pdf-native/pdfPageOperations';
import { PdfToolResultPanel } from '@/features/pdf-native/PdfToolResultPanel';

type Format = 'png' | 'jpeg';
type Mode = 'pdf-to-images' | 'images-to-pdf';
type ImageItem = { uri: string; name: string };

function parsePageSelection(value: string, pageCount: number): number[] {
  const ranges = parsePageRanges(value, pageCount);
  const pages = new Set<number>();
  for (const { start, end } of ranges) for (let page = start; page <= end; page += 1) pages.add(page);
  return [...pages].sort((a, b) => a - b);
}

export default function PdfImageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('pdf-to-images');
  const [pdf, setPdf] = useState<{ uri: string; name: string; pageCount: number } | null>(null);
  const [selection, setSelection] = useState('');
  const [format, setFormat] = useState<Format>('png');
  const [dpi, setDpi] = useState('300');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | undefined>();
  const [imageUris, setImageUris] = useState<string[]>([]);

  const selectedPages = useMemo(() => {
    if (!pdf) return [];
    if (!selection.trim()) return Array.from({ length: pdf.pageCount }, (_, index) => index + 1);
    try { return parsePageSelection(selection, pdf.pageCount); } catch { return []; }
  }, [selection, pdf]);

  function reset() {
    setPdf(null); setSelection(''); setImages([]); setBusy(false); setStatus(''); setResultUri(null); setResultFilename(undefined); setImageUris([]);
  }

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!pdf && !images.length && !resultUri && !busy) return false;
      reset();
      return true;
    });
    return () => subscription.remove();
  }, [busy, images.length, pdf, resultUri]);

  function switchMode(next: Mode) {
    if (next === mode) return;
    reset();
    setMode(next);
  }

  async function pickPdf() {
    setStatus(''); setResultUri(null); setImageUris([]);
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
    if (picked.canceled || !picked.assets?.[0]) return;
    try {
      const asset = picked.assets[0];
      const pageCount = assertValidPageCount((await getPdfInfo(asset.uri)).pageCount);
      setPdf({ uri: asset.uri, name: asset.name || 'document.pdf', pageCount });
      setSelection(`1-${pageCount}`);
      setStatus(`${pageCount} pages detected. Valid page numbers are 1 to ${pageCount}.`);
    } catch (error) {
      setPdf(null); setSelection(''); setStatus(error instanceof Error ? error.message : 'Could not read the PDF page count.');
    }
  }

  function updateSelection(value: string) {
    setSelection(pdf ? sanitizePageRangeInput(value, pdf.pageCount) : value);
  }

  async function exportImages() {
    if (!pdf || selectedPages.length === 0) { setStatus(`Select at least one valid page from 1 to ${pdf?.pageCount ?? 0}.`); return; }
    const parsedDpi = Math.min(600, Math.max(72, Number(dpi) || 300));
    setBusy(true); setStatus('Rendering selected pages…'); setResultUri(null); setImageUris([]);
    try {
      await playDocumentProcessingSound();
      const outputDirectory = `${FileSystem.cacheDirectory}pdf-images/`;
      await FileSystem.makeDirectoryAsync(outputDirectory, { intermediates: true });
      const rendered: string[] = [];
      const scale = parsedDpi / 72;
      for (const pageNumber of selectedPages) {
        setStatus(`Rendering page ${pageNumber} of ${selectedPages.length}…`);
        const image = await convertPage(pdf.uri, pageNumber - 1, { dpi: parsedDpi, format, quality: 0.95, output: 'file', outputDir: outputDirectory, filePrefix: `page-${String(pageNumber).padStart(4, '0')}`, scale });
        rendered.push(image.uri);
      }
      const base = pdf.name.replace(/\.pdf$/i, '') || 'document';
      const zipFilename = `${base}-images.zip`;
      const zipPath = `${FileSystem.cacheDirectory}${zipFilename}`;
      await FileSystem.deleteAsync(zipPath, { idempotent: true });
      const zipResult = await zip(rendered, zipPath);
      setImageUris(rendered);
      setResultUri(zipResult);
      setResultFilename(zipFilename);
      setStatus(`Created ZIP with ${rendered.length} image${rendered.length === 1 ? '' : 's'}.`);
    } catch {
      setStatus('Could not render this PDF. Try another document or a lower DPI.');
    } finally { setBusy(false); }
  }

  async function shareImages() {
    if (!resultUri) return;
    if (!(await Sharing.isAvailableAsync())) { Alert.alert('Sharing unavailable', 'The image package is available on this device, but sharing is unavailable.'); return; }
    try { await Sharing.shareAsync(resultUri, { mimeType: 'application/zip', dialogTitle: 'Share PDF images' }); } catch { Alert.alert('Share unavailable', 'The image package could not be shared.'); }
  }

  async function saveImagesToDevice() {
    if (!imageUris.length) return;
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) { Alert.alert('Storage permission required', 'Allow photo and video access so Nexus Plus can save the converted images.'); return; }
      for (const uri of imageUris) await MediaLibrary.createAssetAsync(uri);
      Alert.alert('Saved to device', `${imageUris.length} image${imageUris.length === 1 ? '' : 's'} saved successfully.`);
    } catch { Alert.alert('Save failed', 'Nexus Plus could not save the generated images to device storage.'); }
  }

  async function pickImages() {
    setStatus(''); setResultUri(null); setResultFilename(undefined);
    const picked = await DocumentPicker.getDocumentAsync({ type: ['image/*'], multiple: true, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.length) return;
    setImages(picked.assets.map((asset) => ({ uri: asset.uri, name: asset.name || 'image' })));
    setStatus(`${picked.assets.length} image${picked.assets.length === 1 ? '' : 's'} selected.`);
  }

  async function convertImagesToPdf() {
    if (!images.length) { setStatus('Select at least one image.'); return; }
    setBusy(true); setResultUri(null); setResultFilename(undefined); setStatus('Creating PDF…');
    try {
      const filename = `images-to-pdf-${Date.now()}.pdf`;
      const output = await preparePdfOutputPath('Images to PDF', filename);
      const uri = await PdfNativeBridge.imageToPdf(images.map((item) => item.uri), output, 90);
      setResultUri(uri); setResultFilename(filename); setStatus('PDF created and saved successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create the PDF.');
    } finally { setBusy(false); }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'PDF ⇄ Image' }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="file-swap-outline" size={28} color={colors.primary} /></View>
          <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>PDF ⇄ Image</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Convert between PDFs and images from one place.</Text></View>
        </View>
        <View accessibilityRole="tablist" style={[styles.tabs, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === 'pdf-to-images' }} accessibilityLabel="PDF to Images" onPress={() => switchMode('pdf-to-images')} style={[styles.tab, mode === 'pdf-to-images' && { backgroundColor: colors.primary }]}><Text style={[styles.tabText, { color: mode === 'pdf-to-images' ? colors.primaryForeground : colors.foreground }]}>PDF to Images</Text></Pressable>
          <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === 'images-to-pdf' }} accessibilityLabel="Images to PDF" onPress={() => switchMode('images-to-pdf')} style={[styles.tab, mode === 'images-to-pdf' && { backgroundColor: colors.primary }]}><Text style={[styles.tabText, { color: mode === 'images-to-pdf' ? colors.primaryForeground : colors.foreground }]}>Images to PDF</Text></Pressable>
        </View>
        {busy ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Processing document</Text><Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status || 'Please wait…'}</Text></View> : mode === 'pdf-to-images' ? <>
          <Pressable accessibilityRole="button" accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'} onPress={() => void pickPdf()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="file-plus" size={20} color={colors.primary} /><View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? `${pdf.pageCount} pages • valid range 1-${pdf.pageCount}` : 'Select a local PDF file'}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
          {pdf && <>
            <Text style={[styles.label, { color: colors.foreground }]}>Pages</Text>
            <TextInput accessibilityLabel="Pages to render" accessibilityHint={`Enter page numbers and ranges from 1 to ${pdf.pageCount}, such as 1, 3-5`} value={selection} onChangeText={updateSelection} placeholder={`1-${pdf.pageCount}`} placeholderTextColor={colors.mutedForeground} keyboardType="numbers-and-punctuation" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>{selectedPages.length ? `${selectedPages.length} valid page${selectedPages.length === 1 ? '' : 's'} selected. Only 1-${pdf.pageCount} can be entered.` : `Only page numbers from 1 to ${pdf.pageCount} are accepted.`}</Text>
            <Text style={[styles.label, { color: colors.foreground }]}>Image format</Text>
            <View style={styles.options}>{(['png', 'jpeg'] as Format[]).map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: format === item }} accessibilityLabel={item === 'png' ? 'PNG' : 'JPG'} onPress={() => setFormat(item)} style={[styles.option, { backgroundColor: format === item ? colors.primary : colors.card, borderColor: colors.border }]}><Text style={[styles.optionText, { color: format === item ? colors.primaryForeground : colors.foreground }]}>{item === 'png' ? 'PNG' : 'JPG'}</Text></Pressable>)}</View>
            <Text style={[styles.label, { color: colors.foreground }]}>Resolution (DPI)</Text><TextInput accessibilityLabel="Output resolution in DPI" value={dpi} onChangeText={setDpi} keyboardType="number-pad" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} /><Text style={[styles.hint, { color: colors.mutedForeground }]}>Use 300 DPI for high-quality output. Values from 72 to 600 are supported.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Render ${selectedPages.length} selected pages`} onPress={() => void exportImages()} disabled={selectedPages.length === 0} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed, selectedPages.length === 0 && styles.disabled]}><Feather name="archive" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Create Image Package</Text></Pressable>
          </>}
        </> : <>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose images" onPress={() => void pickImages()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="image" size={20} color={colors.primary} /><View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>Choose images</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{images.length ? `${images.length} selected` : 'Select JPG, PNG or other images'}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
          {images.length > 0 && <View style={styles.files}>{images.map((item, index) => <View key={`${item.uri}-${index}`} style={[styles.fileRow, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.index, { color: colors.primary }]}>{index + 1}</Text><Text numberOfLines={1} style={[styles.fileName, { color: colors.foreground }]}>{item.name}</Text></View>)}</View>}
          {!resultUri && <Pressable accessibilityRole="button" accessibilityLabel="Create PDF from selected images" onPress={() => void convertImagesToPdf()} disabled={!images.length} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed, !images.length && styles.disabled]}><MaterialCommunityIcons name="file-pdf-box" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Create PDF</Text></Pressable>}
        </>}
        {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text>}
        {mode === 'images-to-pdf' && !!resultUri && <PdfToolResultPanel resultUri={resultUri} filename={resultFilename} title="PDF saved successfully" onClose={reset} onReset={reset} />}
        {mode === 'pdf-to-images' && !!resultUri && <View style={styles.resultCard}><View style={[styles.resultIcon, { backgroundColor: colors.secondary }]}><Feather name="check" size={23} color={colors.primary} /></View><Text accessibilityRole="header" style={[styles.resultTitle, { color: colors.foreground }]}>Images created successfully</Text><Text accessibilityLiveRegion="polite" style={[styles.resultText, { color: colors.mutedForeground }]}>{resultFilename} has been created and is ready to share.</Text><Pressable accessibilityRole="button" accessibilityLabel="Share generated image package" onPress={() => void shareImages()} style={[styles.secondaryButton, { backgroundColor: colors.primary }]}><Feather name="share-2" size={18} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Share</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Save converted images to device" onPress={() => void saveImagesToDevice()} style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="download" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Save Images to Device</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Close PDF to image tool" onPress={reset} style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="x" size={18} color={colors.foreground} /><Text style={[styles.actionText, { color: colors.foreground }]}>Close</Text></Pressable></View>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 18 }, icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 13 }, title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' }, tabs: { marginHorizontal: 20, padding: 4, borderRadius: 15, borderWidth: 1, flexDirection: 'row', marginBottom: 18 }, tab: { flex: 1, minHeight: 46, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, tabText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, pick: { marginHorizontal: 20, minHeight: 72, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, pickCopy: { flex: 1, marginHorizontal: 12 }, pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 }, pickDetail: { fontSize: 11, fontFamily: 'Inter_400Regular' }, label: { marginHorizontal: 20, fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 8, marginTop: 6 }, input: { marginHorizontal: 20, minHeight: 48, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 8 }, hint: { marginHorizontal: 20, fontSize: 11, lineHeight: 17, marginBottom: 14 }, options: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 8 }, option: { flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, optionText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, primaryButton: { marginHorizontal: 20, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 10 }, primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, files: { marginTop: 3, paddingHorizontal: 20, gap: 8 }, fileRow: { minHeight: 48, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }, index: { width: 28, fontFamily: 'Inter_700Bold' }, fileName: { flex: 1, fontSize: 12 }, status: { marginHorizontal: 20, marginTop: 14, fontSize: 11, lineHeight: 17 }, resultCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 16, alignItems: 'center' }, resultIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, resultTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: 5, textAlign: 'center' }, resultText: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginBottom: 14 }, secondaryButton: { width: '100%', minHeight: 48, marginTop: 9, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, loading: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingVertical: 90 }, loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 }, loadingText: { fontSize: 13, lineHeight: 19, textAlign: 'center' }, pressed: { opacity: 0.74 }, disabled: { opacity: 0.55 } });
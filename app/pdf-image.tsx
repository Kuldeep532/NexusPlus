import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { PdfNativeBridge } from '@/features/pdf-native/PdfNativeBridge';
import { preparePdfOutputPath } from '@/features/pdf-native/pdfPageOperations';
import { PdfToolResultPanel } from '@/features/pdf-native/PdfToolResultPanel';
import { assertValidPageCount, pageRangeStrings } from '@/features/pdf-native/pdfPageInput';
import * as FileSystem from 'expo-file-system/legacy';
import { getPdfInfo } from '@uzimandias/react-native-pdf-to-image';

type Mode = 'pdf-to-image' | 'image-to-pdf';
type Format = 'png' | 'jpeg';
type ImageItem = { uri: string; name: string };

type Result = { uri: string; mime: string; filename: string; imageCount?: number } | null;

function parsePageSelection(value: string, pageCount: number): number[] {
  const pages = new Set<number>();
  for (const token of value.split(',')) {
    const part = token.trim();
    if (!part) continue;
    const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(part);
    if (!match) continue;
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (!Number.isInteger(start) || !Number.isInteger(end)) continue;
    const left = Math.min(start, end);
    const right = Math.max(start, end);
    if (left < 1 || right > pageCount) continue;
    for (let page = left; page <= right; page += 1) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}

export default function PdfImageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('pdf-to-image');
  const [pdf, setPdf] = useState<{ uri: string; name: string; pageCount: number } | null>(null);
  const [selection, setSelection] = useState('');
  const [format, setFormat] = useState<Format>('png');
  const [dpi, setDpi] = useState('300');
  const [combine, setCombine] = useState(true);
  const [outputName, setOutputName] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const selectedPages = useMemo(
    () => (pdf ? parsePageSelection(selection || `1-${pdf.pageCount}`, pdf.pageCount) : []),
    [pdf, selection],
  );

  function reset() {
    setPdf(null); setSelection(''); setImages([]); setResult(null); setBusy(false); setStatus(''); setOutputName('');
  }

  function switchMode(next: Mode) {
    reset(); setMode(next);
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!pdf && !images.length && !result && !busy) return false;
      reset();
      return true;
    });
    return () => sub.remove();
  }, [busy, images.length, pdf, result]);

  async function pickPdf() {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    try {
      const info = await getPdfInfo(asset.uri);
      assertValidPageCount(info.pageCount);
      setPdf({ uri: asset.uri, name: asset.name || 'document.pdf', pageCount: info.pageCount });
      setSelection(`1-${info.pageCount}`);
      setResult(null);
      setStatus(`${info.pageCount} pages detected.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not read this PDF.');
    }
  }

  async function pickImages() {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['image/*'], multiple: true, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.length) return;
    setImages(picked.assets.map((asset) => ({ uri: asset.uri, name: asset.name || 'image' })));
    setResult(null);
    setStatus(`${picked.assets.length} image${picked.assets.length === 1 ? '' : 's'} selected.`);
  }

  function baseName(name: string) {
    return name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._ -]/g, '_').trim() || 'converted';
  }

  async function convertPdfToImages() {
    if (!pdf || selectedPages.length === 0) { setStatus('Select at least one valid page within the PDF.'); return; }
    const parsedDpi = Math.min(600, Math.max(72, Number(dpi) || 300));
    setBusy(true); setResult(null); setStatus('Rendering PDF pages with the native PDF engine…');
    try {
      const outputDir = `${FileSystem.cacheDirectory}nexus-pdf-images-${Date.now()}/`;
      await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });
      const rendered = await PdfNativeBridge.pdfToImages(pdf.uri, outputDir, selectedPages, parsedDpi, format, pdf.pageCount);
      if (!rendered.length) throw new Error('The PDF did not produce any supported image pages.');

      const source = baseName(pdf.name);
      if (rendered.length === 1 || !combine) {
        const target = await PdfNativeBridge.preparePdfToolOutput('PDF to Images', `${outputName.trim() || source}-page-${String(selectedPages[0]).padStart(4, '0')}.${format === 'png' ? 'png' : 'jpg'}`);
        await FileSystem.copyAsync({ from: rendered[0], to: target });
        setResult({ uri: target, mime: format === 'png' ? 'image/png' : 'image/jpeg', filename: target.split('/').pop() || 'converted-image', imageCount: 1 });
        setStatus('Image created and saved.');
        return;
      }

      const combinedPath = await PdfNativeBridge.preparePdfToolOutput('PDF to Images', `${outputName.trim() || source}-combined.${format === 'png' ? 'png' : 'jpg'}`);
      try {
        const combined = await PdfNativeBridge.combineImages(rendered, combinedPath, format, 95);
        setResult({ uri: combined, mime: format === 'png' ? 'image/png' : 'image/jpeg', filename: combined.split('/').pop() || 'combined-image', imageCount: 1 });
        setStatus(`${rendered.length} pages combined into one image and saved.`);
      } catch (combineError) {
        const fallbackPaths: string[] = [];
        for (let index = 0; index < rendered.length; index += 1) {
          const pageNumber = selectedPages[index];
          const target = await PdfNativeBridge.preparePdfToolOutput('PDF to Images', `${outputName.trim() || source}-page-${String(pageNumber).padStart(4, '0')}.${format === 'png' ? 'png' : 'jpg'}`);
          await FileSystem.copyAsync({ from: rendered[index], to: target });
          fallbackPaths.push(target);
        }
        const first = fallbackPaths[0];
        setResult({ uri: first, mime: format === 'png' ? 'image/png' : 'image/jpeg', filename: `${fallbackPaths.length} images`, imageCount: fallbackPaths.length });
        setStatus(`One-image output was not safe on this device, so Nexus Plus automatically created ${fallbackPaths.length} separate images instead.`);
        void combineError;
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not convert this PDF to images. Try a lower DPI.');
    } finally { setBusy(false); }
  }

  async function convertImagesToPdf() {
    if (!images.length) { setStatus('Select at least one image.'); return; }
    setBusy(true); setResult(null); setStatus(`Creating a ${images.length}-page PDF with the native PDF engine…`);
    try {
      const source = baseName(images[0]?.name || 'images');
      const filename = images.length === 1 ? `${source}.pdf` : `${source}-images-to-pdf.pdf`;
      const output = await preparePdfOutputPath('Images to PDF', filename);
      const uri = await PdfNativeBridge.imageToPdf(images.map((item) => item.uri), output, 90);
      setResult({ uri, mime: 'application/pdf', filename: uri.split('/').pop() || filename });
      setStatus(images.length === 1 ? 'Single-page PDF created and saved.' : `${images.length}-page PDF created and saved.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not create the PDF.');
    } finally { setBusy(false); }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'PDF ⇄ Image' }} />
      {busy ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Processing</Text><Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="file-swap-outline" size={28} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>PDF ⇄ Image</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Convert PDFs to images or turn images into a PDF using the native engine.</Text></View></View>
          <View style={styles.tabs}>
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === 'pdf-to-image' }} onPress={() => switchMode('pdf-to-image')} style={[styles.tab, { backgroundColor: mode === 'pdf-to-image' ? colors.primary : colors.card, borderColor: colors.border }]}><Text style={[styles.tabText, { color: mode === 'pdf-to-image' ? colors.primaryForeground : colors.foreground }]}>PDF to Images</Text></Pressable>
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: mode === 'image-to-pdf' }} onPress={() => switchMode('image-to-pdf')} style={[styles.tab, { backgroundColor: mode === 'image-to-pdf' ? colors.primary : colors.card, borderColor: colors.border }]}><Text style={[styles.tabText, { color: mode === 'image-to-pdf' ? colors.primaryForeground : colors.foreground }]}>Images to PDF</Text></Pressable>
          </View>

          {mode === 'pdf-to-image' ? (
            <>
              <Pressable accessibilityRole="button" accessibilityLabel="Choose PDF" onPress={() => void pickPdf()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="file-plus" size={20} color={colors.primary} /><View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? `${pdf.pageCount} pages` : 'Select a local PDF file'}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
              {pdf && <>
                <Text style={[styles.label, { color: colors.foreground }]}>Pages</Text>
                <TextInput accessibilityLabel="Pages to convert" accessibilityHint={`Enter page numbers from 1 to ${pdf.pageCount}, or ranges such as 1-3`} value={selection} onChangeText={setSelection} placeholder={`1-${pdf.pageCount}`} placeholderTextColor={colors.mutedForeground} keyboardType="numbers-and-punctuation" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
                <Text style={[styles.hint, { color: colors.mutedForeground }]}>Only pages inside this document are accepted. Invalid/out-of-range page entries are ignored rather than rendered.</Text>
                <Text style={[styles.label, { color: colors.foreground }]}>Image format</Text>
                <View style={styles.options}>{(['png', 'jpeg'] as Format[]).map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: format === item }} onPress={() => setFormat(item)} style={[styles.option, { backgroundColor: format === item ? colors.primary : colors.card, borderColor: colors.border }]}><Text style={[styles.optionText, { color: format === item ? colors.primaryForeground : colors.foreground }]}>{item === 'png' ? 'PNG' : 'JPG'}</Text></Pressable>)}</View>
                <Text style={[styles.label, { color: colors.foreground }]}>Resolution (DPI)</Text>
                <TextInput accessibilityLabel="Output resolution in DPI" value={dpi} onChangeText={setDpi} keyboardType="number-pad" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
                <Text style={[styles.label, { color: colors.foreground }]}>Output name (optional)</Text>
                <TextInput accessibilityLabel="Output image name" value={outputName} onChangeText={setOutputName} placeholder="Use PDF filename automatically" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
                <Pressable accessibilityRole="switch" accessibilityState={{ checked: combine }} onPress={() => setCombine((value) => !value)} style={[styles.toggle, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.toggleDot, { backgroundColor: combine ? colors.primary : colors.mutedForeground }]} /><View style={styles.toggleCopy}><Text style={[styles.toggleTitle, { color: colors.foreground }]}>Try one combined image</Text><Text style={[styles.toggleHint, { color: colors.mutedForeground }]}>When the pages cannot safely fit into one image, Nexus Plus automatically falls back to separate images.</Text></View></Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Convert ${selectedPages.length} PDF pages to images`} disabled={selectedPages.length === 0} onPress={() => void convertPdfToImages()} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (!selectedPages.length || pressed) && styles.disabled]}><Feather name="image" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Convert to Images</Text></Pressable>
              </>}
            </>
          ) : (
            <>
              <Pressable accessibilityRole="button" accessibilityLabel="Choose images" onPress={() => void pickImages()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="image" size={20} color={colors.primary} /><View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>Choose images</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{images.length ? `${images.length} selected` : 'Select JPG, PNG or other images'}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
              {images.length > 0 && <View style={styles.files}>{images.map((item, index) => <View key={`${item.uri}-${index}`} style={[styles.fileRow, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.index, { color: colors.primary }]}>{index + 1}</Text><Text numberOfLines={1} style={[styles.fileName, { color: colors.foreground }]}>{item.name}</Text></View>)}</View>}
              <Pressable accessibilityRole="button" accessibilityLabel="Create PDF" disabled={!images.length} onPress={() => void convertImagesToPdf()} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (!images.length || pressed) && styles.disabled]}><MaterialCommunityIcons name="file-pdf-box" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Create PDF</Text></Pressable>
            </>
          )}
          {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text>}
          {result && <PdfToolResultPanel resultUri={result.uri} filename={result.filename} onClose={reset} title={mode === 'image-to-pdf' ? 'PDF saved successfully' : result.imageCount && result.imageCount > 1 ? 'Images saved successfully' : 'Image saved successfully'} />}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 18 }, icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 13 }, title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18 }, tabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 }, tab: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, tabText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, pickCopy: { flex: 1, marginHorizontal: 12 }, pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 }, pickDetail: { fontSize: 11 }, label: { marginHorizontal: 20, fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 8, marginTop: 8 }, input: { marginHorizontal: 20, minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14, marginBottom: 8 }, hint: { marginHorizontal: 20, fontSize: 11, lineHeight: 17, marginBottom: 10 }, options: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 8 }, option: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, optionText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, toggle: { marginHorizontal: 20, marginTop: 8, minHeight: 64, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' }, toggleDot: { width: 16, height: 16, borderRadius: 8, marginRight: 11 }, toggleCopy: { flex: 1 }, toggleTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 }, toggleHint: { fontSize: 10, lineHeight: 15 }, primary: { marginHorizontal: 20, minHeight: 52, marginTop: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, status: { marginHorizontal: 20, marginTop: 14, fontSize: 11, lineHeight: 17 }, files: { paddingHorizontal: 20, gap: 8, marginBottom: 4 }, fileRow: { minHeight: 46, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }, index: { width: 28, fontFamily: 'Inter_700Bold' }, fileName: { flex: 1, fontSize: 12 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 20, marginBottom: 8 }, loadingText: { fontSize: 13, lineHeight: 19, textAlign: 'center' }, pressed: { opacity: 0.75 }, disabled: { opacity: 0.5 },
});

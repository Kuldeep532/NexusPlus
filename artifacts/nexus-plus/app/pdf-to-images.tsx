import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { convertPage, getPdfInfo } from '@uzimandias/react-native-pdf-to-image';
import { zip } from 'react-native-zip-archive';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Format = 'png' | 'jpeg';

function parsePageSelection(value: string, pageCount: number): number[] {
  const pages = new Set<number>();
  for (const token of value.split(',')) {
    const part = token.trim();
    if (!part) continue;
    if (part.includes('-')) {
      const [left, right] = part.split('-').map((item) => Number(item.trim()));
      if (!Number.isInteger(left) || !Number.isInteger(right)) continue;
      const start = Math.max(1, Math.min(left, right));
      const end = Math.min(pageCount, Math.max(left, right));
      for (let page = start; page <= end; page += 1) pages.add(page);
    } else {
      const page = Number(part);
      if (Number.isInteger(page) && page >= 1 && page <= pageCount) pages.add(page);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

export default function PdfToImagesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pdf, setPdf] = useState<{ uri: string; name: string; pageCount: number } | null>(null);
  const [selection, setSelection] = useState('');
  const [format, setFormat] = useState<Format>('png');
  const [dpi, setDpi] = useState('300');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [outputUri, setOutputUri] = useState<string | null>(null);

  const selectedPages = useMemo(
    () => (pdf ? parsePageSelection(selection || `1-${pdf.pageCount}`, pdf.pageCount) : []),
    [selection, pdf],
  );

  async function pickPdf() {
    setStatus('');
    setOutputUri(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const info = await getPdfInfo(asset.uri);
    setPdf({ uri: asset.uri, name: asset.name || 'document.pdf', pageCount: info.pageCount });
    setSelection(`1-${info.pageCount}`);
    setStatus(`${info.pageCount} pages detected.`);
  }

  async function exportImages() {
    if (!pdf || selectedPages.length === 0) {
      setStatus('Select at least one valid page.');
      return;
    }
    const parsedDpi = Math.min(600, Math.max(72, Number(dpi) || 300));
    setBusy(true);
    setStatus('Rendering selected pages…');
    setOutputUri(null);

    try {
      const outputDirectory = `${FileSystem.cacheDirectory}pdf-images/`;
      await FileSystem.makeDirectoryAsync(outputDirectory, { intermediates: true });

      const imageUris: string[] = [];
      const scale = parsedDpi / 72;
      for (let index = 0; index < selectedPages.length; index += 1) {
        const pageNumber = selectedPages[index];
        setStatus(`Rendering page ${pageNumber} of ${selectedPages.length}…`);
        const image = await convertPage(pdf.uri, pageNumber - 1, {
          dpi: parsedDpi,
          format,
          quality: 0.95,
          output: 'file',
          outputDir: outputDirectory,
          filePrefix: `page-${String(pageNumber).padStart(4, '0')}`,
          scale,
        });
        imageUris.push(image.uri);
      }

      const zipPath = `${FileSystem.cacheDirectory}${pdf.name.replace(/\.pdf$/i, '')}-images.zip`;
      await FileSystem.deleteAsync(zipPath, { idempotent: true });
      const result = await zip(imageUris, zipPath);
      setOutputUri(result);
      setStatus(`Created ZIP with ${imageUris.length} image${imageUris.length === 1 ? '' : 's'}.`);
    } catch (error) {
      console.error('PDF to images failed', error);
      setStatus('Could not render this PDF. Try another document or a lower DPI.');
    } finally {
      setBusy(false);
    }
  }

  async function shareOutput() {
    if (!outputUri || !(await Sharing.isAvailableAsync())) return;
    await Sharing.shareAsync(outputUri, { mimeType: 'application/zip', dialogTitle: 'Share PDF images ZIP' });
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
          <MaterialCommunityIcons name="file-pdf-box" size={28} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>PDF to Images</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Convert chosen pages into image files and package them locally.</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'}
        onPress={pickPdf}
        disabled={busy}
        style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
      >
        <Feather name="file-plus" size={20} color={colors.primary} />
        <View style={styles.pickCopy}>
          <Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text>
          <Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? `${pdf.pageCount} pages` : 'Select a local PDF file'}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </Pressable>

      {pdf && (
        <>
          <Text style={[styles.label, { color: colors.foreground }]}>Pages</Text>
          <TextInput
            accessibilityLabel="Pages to render"
            accessibilityHint="Enter page numbers and ranges such as 1, 3-5"
            value={selection}
            onChangeText={setSelection}
            placeholder={`1-${pdf.pageCount}`}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numbers-and-punctuation"
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Image format</Text>
          <View style={styles.options}>
            {(['png', 'jpeg'] as Format[]).map((item) => (
              <Pressable
                key={item}
                accessibilityRole="radio"
                accessibilityState={{ selected: format === item }}
                accessibilityLabel={item === 'png' ? 'PNG' : 'JPG'}
                onPress={() => setFormat(item)}
                style={[styles.option, { backgroundColor: format === item ? colors.primary : colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.optionText, { color: format === item ? colors.primaryForeground : colors.foreground }]}>{item === 'png' ? 'PNG' : 'JPG'}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { color: colors.foreground }]}>Resolution (DPI)</Text>
          <TextInput
            accessibilityLabel="Output resolution in DPI"
            value={dpi}
            onChangeText={setDpi}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Use 300 DPI for high-quality output. Values from 72 to 600 are supported.</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Render ${selectedPages.length} selected pages`}
            onPress={exportImages}
            disabled={busy || selectedPages.length === 0}
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, (pressed || busy) && styles.pressed, (busy || selectedPages.length === 0) && styles.disabled]}
          >
            {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="archive" size={19} color={colors.primaryForeground} />}
            <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{busy ? 'Processing…' : 'Create ZIP'}</Text>
          </Pressable>
        </>
      )}

      {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text>}

      {outputUri && (
        <Pressable accessibilityRole="button" accessibilityLabel="Share generated ZIP" onPress={shareOutput} style={({ pressed }) => [styles.shareButton, { borderColor: colors.border, backgroundColor: colors.card }, pressed && styles.pressed]}>
          <Feather name="share-2" size={18} color={colors.primary} />
          <Text style={[styles.shareText, { color: colors.foreground }]}>Share ZIP</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 22 },
  icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 13 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  pick: { marginHorizontal: 20, minHeight: 72, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  pickCopy: { flex: 1, marginHorizontal: 12 },
  pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  pickDetail: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  label: { marginHorizontal: 20, fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 8, marginTop: 8 },
  input: { marginHorizontal: 20, minHeight: 48, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  hint: { marginHorizontal: 20, fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular', marginBottom: 15 },
  options: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 8 },
  option: { flex: 1, minHeight: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  primaryButton: { marginHorizontal: 20, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 8 },
  primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  status: { marginHorizontal: 20, marginTop: 15, fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  shareButton: { marginHorizontal: 20, minHeight: 50, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 12 },
  shareText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.74 },
  disabled: { opacity: 0.55 },
});

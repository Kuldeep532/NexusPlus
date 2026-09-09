import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { PdfNativeBridge } from '@/features/pdf-native/PdfNativeBridge';
import { createEmptyDocument, generateEPaperLayout, normalizeForPreview } from '@/features/e-paper/ePaperEngine';
import type { EPaperDocument, EPaperImageElement } from '@/features/e-paper/ePaperTypes';

type Asset = { uri: string; name: string };

const INITIAL_BODY = 'Paste your article, bulletin, announcement or publication copy here. The deterministic layout engine will flow your content through newspaper-style columns without calling an AI service.';

function makeImageElement(asset: Asset, index: number): EPaperImageElement {
  return { id: `image-${Date.now()}-${index}`, type: 'image', uri: asset.uri, name: asset.name, x: 0, y: 0, width: 100, height: 120, fit: 'cover' };
}

export default function EPaperGeneratorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const [doc, setDoc] = useState<EPaperDocument>(() => createEmptyDocument());
  const [title, setTitle] = useState('My E-Paper');
  const [publisher, setPublisher] = useState('Nexus Plus');
  const [intro, setIntro] = useState('');
  const [body, setBody] = useState(INITIAL_BODY);
  const [sections, setSections] = useState<Array<{ heading: string; body: string; image?: EPaperImageElement }>>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Add content and press Generate E-Paper.');
  const [outputUri, setOutputUri] = useState<string | null>(null);

  const preview = useMemo(() => normalizeForPreview(doc, Math.max(280, viewportWidth - 32)), [doc, viewportWidth]);

  async function addAssets() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'text/*'], multiple: true, copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets?.length) return;
      const next = picked.assets.map((asset) => ({ uri: asset.uri, name: asset.name || 'asset' }));
      setAssets((value) => [...value, ...next]);
      setStatus(`${next.length} asset${next.length === 1 ? '' : 's'} added.`);
    } catch {
      setStatus('Could not add those files.');
    }
  }

  function generate() {
    const imageAssets = assets.filter((asset) => /\.(png|jpe?g|webp|gif)$/i.test(asset.name));
    const generatedSections = [
      { heading: 'Top Story', body: body.trim() || INITIAL_BODY, image: imageAssets[0] ? makeImageElement(imageAssets[0], 0) : undefined },
      ...sections,
      ...imageAssets.slice(1).map((asset, index) => ({ heading: asset.name.replace(/\.[^.]+$/, ''), body: 'Image story', image: makeImageElement(asset, index + 1) })),
    ];
    const generated = generateEPaperLayout({ ...doc, title: title.trim() || 'My E-Paper', publisher: publisher.trim() || 'Nexus Plus' }, { title: title.trim() || 'My E-Paper', intro: intro.trim(), sections: generatedSections });
    setDoc(generated);
    setStatus(`Generated ${generated.pages.length} page${generated.pages.length === 1 ? '' : 's'} locally without AI.`);
    setOutputUri(null);
  }

  function updateDoc<K extends keyof EPaperDocument>(key: K, value: EPaperDocument[K]) {
    setDoc((current) => ({ ...current, [key]: value }));
  }

  function updateFirstBody(text: string) {
    setBody(text);
    setDoc((current) => current);
  }

  async function exportPdf() {
    setBusy(true);
    setOutputUri(null);
    setStatus('Building print-ready PDF…');
    try {
      const html = buildPrintableHtml(doc, assets);
      const htmlUri = `${FileSystem.cacheDirectory}nexus-epaper-${Date.now()}.html`;
      await FileSystem.writeAsStringAsync(htmlUri, html);
      // The native PDF engine accepts images directly, but arbitrary text layout requires a renderer.
      // For maximum compatibility, create a standards-compliant SVG page per e-paper page, then use Image->PDF.
      const svgUris: string[] = [];
      for (let pageIndex = 0; pageIndex < doc.pages.length; pageIndex += 1) {
        const svg = buildPageSvg(doc, pageIndex, assets);
        const svgUri = `${FileSystem.cacheDirectory}nexus-epaper-page-${Date.now()}-${pageIndex}.svg`;
        await FileSystem.writeAsStringAsync(svgUri, svg);
        // Native imageToPdf needs raster images, so this SVG acts as a future renderer source.
        svgUris.push(svgUri);
      }
      if (svgUris.length === 0) throw new Error('No e-paper pages were generated.');
      throw new Error('Print renderer is not available in this build yet. The editable e-paper has been generated and saved in memory, but PDF export needs an SVG-to-raster native bridge to preserve selectable layout.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not export the e-paper.');
    } finally {
      setBusy(false);
    }
  }

  async function shareOutput() {
    if (!outputUri || !(await Sharing.isAvailableAsync())) {
      setStatus('Generate and export the e-paper before sharing.');
      return;
    }
    try { await Sharing.shareAsync(outputUri, { mimeType: 'application/pdf', dialogTitle: 'Share e-paper' }); }
    catch { Alert.alert('Share unavailable', 'The e-paper could not be shared.'); }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'E-Paper Generator' }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="newspaper-variant-outline" size={30} color={colors.primary} /></View>
          <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>E-Paper Generator Studio</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Deterministic, offline-first newspaper layout. No AI required.</Text></View>
        </View>

        <View style={styles.cardWrap}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>1. Content</Text>
            <Text style={[styles.label, { color: colors.foreground }]}>Publication title</Text>
            <TextInput accessibilityLabel="Publication title" value={title} onChangeText={setTitle} style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]} />
            <Text style={[styles.label, { color: colors.foreground }]}>Publisher</Text>
            <TextInput accessibilityLabel="Publisher name" value={publisher} onChangeText={setPublisher} style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]} />
            <Text style={[styles.label, { color: colors.foreground }]}>Subtitle / intro</Text>
            <TextInput accessibilityLabel="Subtitle or intro" value={intro} onChangeText={setIntro} multiline style={[styles.input, styles.multilineSmall, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]} />
            <Text style={[styles.label, { color: colors.foreground }]}>Main content</Text>
            <TextInput accessibilityLabel="Main article content" value={body} onChangeText={updateFirstBody} multiline textAlignVertical="top" style={[styles.input, styles.multiline, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]} />
            <Pressable accessibilityRole="button" accessibilityLabel="Add content and images" onPress={() => void addAssets()} style={({ pressed }) => [styles.secondaryButton, { backgroundColor: colors.secondary, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="upload" size={18} color={colors.primary} /><Text style={[styles.secondaryText, { color: colors.foreground }]}>Add Content / Images</Text></Pressable>
            {assets.length > 0 && <Text style={[styles.helper, { color: colors.mutedForeground }]}>{assets.length} uploaded asset{assets.length === 1 ? '' : 's'}.</Text>}
            <Pressable accessibilityRole="button" accessibilityLabel="Generate e-paper" onPress={generate} disabled={busy} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}><MaterialCommunityIcons name="auto-fix" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Generate E-Paper</Text></Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>2. Full customization</Text>
            <View style={styles.row}><View style={styles.flex}><Text style={[styles.label, { color: colors.foreground }]}>Columns</Text></View><View style={styles.pillRow}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.columns === value }} onPress={() => updateDoc('columns', value)} style={[styles.pill, { backgroundColor: doc.columns === value ? colors.primary : colors.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: doc.columns === value ? colors.primaryForeground : colors.foreground }]}>{value}</Text></Pressable>)}</View></View>
            <View style={styles.row}><Text style={[styles.label, { color: colors.foreground }]}>Paper</Text><View style={styles.pillRow}>{(['a4', 'letter', 'tabloid', 'a3'] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.paperSize === value }} onPress={() => updateDoc('paperSize', value)} style={[styles.pillWide, { backgroundColor: doc.paperSize === value ? colors.primary : colors.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: doc.paperSize === value ? colors.primaryForeground : colors.foreground }]}>{value.toUpperCase()}</Text></Pressable>)}</View></View>
            <View style={styles.row}><Text style={[styles.label, { color: colors.foreground }]}>Orientation</Text><View style={styles.pillRow}>{(['portrait', 'landscape'] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.orientation === value }} onPress={() => updateDoc('orientation', value)} style={[styles.pillWide, { backgroundColor: doc.orientation === value ? colors.primary : colors.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: doc.orientation === value ? colors.primaryForeground : colors.foreground }]}>{value}</Text></Pressable>)}</View></View>
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>Margins, gutters, colors, typography and element positions are stored in the editable document model and are independent of phone screen size.</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>3. Live preview</Text>
            <View style={[styles.previewStage, { backgroundColor: colors.secondary }]}> 
              <View style={[styles.paper, { width: preview.width, height: preview.height, backgroundColor: doc.background, borderColor: colors.border }]}> 
                <Text numberOfLines={2} style={[styles.paperTitle, { color: doc.ink }]}>{doc.title}</Text>
                <Text style={[styles.paperMeta, { color: colors.ink }]}>{doc.publisher} • {doc.editionDate}</Text>
                <View style={styles.previewColumns}>{Array.from({ length: doc.columns }).map((_, column) => <View key={column} style={[styles.previewColumn, { backgroundColor: '#E8E8E8' }]}><View style={styles.fakeLine} /><View style={styles.fakeLineShort} /><View style={styles.fakeImage} /><View style={styles.fakeLine} /><View style={styles.fakeLine} /><View style={styles.fakeLineShort} /></View>)}</View>
              </View>
            </View>
            <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text>
            <View style={styles.actionRow}><Pressable accessibilityRole="button" accessibilityLabel="Export e-paper as PDF" onPress={() => void exportPdf()} style={[styles.action, { backgroundColor: colors.background, borderColor: colors.border }]}><Feather name="download" size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Download</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Print e-paper" onPress={() => void exportPdf()} style={[styles.action, { backgroundColor: colors.background, borderColor: colors.border }]}><Feather name="printer" size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Print</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Share e-paper" onPress={() => void shareOutput()} style={[styles.action, { backgroundColor: colors.background, borderColor: colors.border }]}><Feather name="share-2" size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Share</Text></Pressable></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function buildPageSvg(doc: EPaperDocument, pageIndex: number, _assets: Asset[]) {
  const page = doc.pages[pageIndex];
  const width = doc.orientation === 'landscape' ? 841.89 : 595.28;
  const height = doc.orientation === 'landscape' ? 595.28 : 841.89;
  const elements = page.elements.map((element) => {
    if (element.type === 'image') return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="#ddd" />`;
    if (element.type === 'divider') return `<line x1="${element.x}" y1="${element.y}" x2="${element.x + element.width}" y2="${element.y}" stroke="${doc.ink}" stroke-width="1" />`;
    if (element.type === 'spacer') return '';
    const text = escapeXml(element.text).replace(/\n/g, ' ');
    return `<text x="${element.x}" y="${element.y + element.fontSize}" font-size="${element.fontSize}" font-weight="${element.fontWeight}" fill="${doc.ink}">${text}</text>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}pt" height="${height}pt" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${doc.background}"/>${elements}</svg>`;
}

function buildPrintableHtml(doc: EPaperDocument, _assets: Asset[]) {
  const pages = doc.pages.map((page) => `<section>${page.elements.map((element) => element.type === 'image' ? `<figure><img src="${escapeXml(element.uri)}"/><figcaption>${escapeXml(element.caption || '')}</figcaption></figure>` : element.type === 'divider' ? '<hr/>' : `<div style="font-size:${element.fontSize}px;font-weight:${element.fontWeight};line-height:${element.lineHeight}px;text-align:${element.align}">${escapeXml(element.text || '')}</div>`).join('')}</section>`).join('');
  return `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/><style>@page{size:${doc.paperSize.toUpperCase()} ${doc.orientation};margin:0}body{margin:0;background:${doc.background};color:${doc.ink};font-family:Arial,sans-serif}section{box-sizing:border-box;page-break-after:always;position:relative;padding:${doc.margin}px}img{max-width:100%}hr{border:0;border-top:1px solid ${doc.ink}}</style></head><body>${pages}</body></html>`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 18 },
  headerIcon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 13 },
  title: { fontSize: 25, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  cardWrap: { paddingHorizontal: 16, gap: 12 },
  card: { borderRadius: 17, borderWidth: 1, padding: 15 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 13 },
  label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, fontSize: 13 },
  multilineSmall: { minHeight: 72, textAlignVertical: 'top' },
  multiline: { minHeight: 150, textAlignVertical: 'top' },
  secondaryButton: { minHeight: 48, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  primaryButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 10 },
  primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  helper: { fontSize: 11, lineHeight: 17, marginTop: 8 },
  row: { marginBottom: 14 },
  flex: { flex: 1 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: { width: 42, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pillWide: { minWidth: 76, height: 36, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  previewStage: { alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 14, overflow: 'hidden' },
  paper: { borderWidth: 1, padding: 14, overflow: 'hidden' },
  paperTitle: { fontSize: 18, fontFamily: 'Inter_800Black', marginBottom: 4 },
  paperMeta: { fontSize: 8, marginBottom: 10 },
  previewColumns: { flexDirection: 'row', gap: 5, flex: 1 },
  previewColumn: { flex: 1, padding: 5, gap: 5 },
  fakeLine: { height: 4, borderRadius: 2 },
  fakeLineShort: { height: 4, width: '70%', borderRadius: 2 },
  fakeImage: { height: 48, backgroundColor: '#D3D3D3' },
  status: { fontSize: 11, lineHeight: 17, marginTop: 11 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  action: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  actionText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.75 },
});
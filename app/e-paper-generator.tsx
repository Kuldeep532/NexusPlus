import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { createEmptyDocument, generateEPaperLayout, normalizeForPreview } from '@/features/e-paper/ePaperEngine';
import { normalizeContentInputs, autoPlaceImages, type InputSection } from '@/features/e-paper/ePaperContentPipeline';
import { addPage, deleteElement, duplicateElement, redo, undo, updateElement, pushHistory, type EPaperHistory } from '@/features/e-paper/ePaperEditor';
import { saveEPaperProject } from '@/features/e-paper/ePaperProject';
import { humanOptimizeStory, humanOptimizeHeadline } from '@/features/e-paper/ePaperHumanizer';
import { importEPaperZip } from '@/features/e-paper/ePaperImport';
import { PdfNativeBridge } from '@/features/pdf-native/PdfNativeBridge';
import type { EPaperDocument, EPaperElement, EPaperImageElement } from '@/features/e-paper/ePaperTypes';

type Asset = { uri: string; name: string };
const INITIAL_BODY = 'Paste one complete newspaper issue here, or add separate stories one by one. Nexus Plus will classify and flow them automatically without AI.';

function assetImage(asset: Asset, index: number): EPaperImageElement {
  return { id: `image-${Date.now()}-${index}`, type: 'image', uri: asset.uri, name: asset.name, x: 0, y: 0, width: 100, height: 120, fit: 'cover', zIndex: 1 };
}

function sanitizeHeadlineFilename(title: string): string {
  const base = humanOptimizeHeadline(title).replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 90);
  return `${base || 'nexus-plus-e-paper'}.pdf`;
}

export default function EPaperGeneratorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth } = useWindowDimensions();
  const [doc, setDoc] = useState<EPaperDocument>(() => createEmptyDocument());
  const [history, setHistory] = useState<EPaperHistory>({ past: [], future: [] });
  const [title, setTitle] = useState('My E-Paper');
  const [publisher, setPublisher] = useState('Nexus Plus');
  const [intro, setIntro] = useState('');
  const [singlePaste, setSinglePaste] = useState(INITIAL_BODY);
  const [separate, setSeparate] = useState<InputSection[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Ready. Use one paste, separate stories, or import a ZIP e-paper bundle.');
  const [outputUri, setOutputUri] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ pageId: string; elementId: string } | null>(null);

  const preview = useMemo(() => normalizeForPreview(doc, Math.max(280, viewportWidth - 32)), [doc, viewportWidth]);
  const selectedElement = useMemo(() => {
    if (!selected) return null;
    return doc.pages.find((page) => page.id === selected.pageId)?.elements.find((element) => element.id === selected.elementId) ?? null;
  }, [doc, selected]);

  const commit = (next: EPaperDocument) => { setHistory((current) => pushHistory(current, doc)); setDoc(next); setOutputUri(null); };

  async function addAssets() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'text/*', 'application/pdf'], multiple: true, copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets?.length) return;
      const next = picked.assets.map((asset) => ({ uri: asset.uri, name: asset.name || 'asset' }));
      setAssets((value) => [...value, ...next]);
      setStatus(`${next.length} file${next.length === 1 ? '' : 's'} added.`);
    } catch { setStatus('Could not add those files.'); }
  }

  async function importZip() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: ['application/zip', 'application/x-zip-compressed'], copyToCacheDirectory: true });
      if (picked.canceled || !picked.assets?.[0]) return;
      const bundle = await importEPaperZip(picked.assets[0].uri, picked.assets[0].name);
      const combinedText = bundle.textFiles.map((file) => `### ${file.name.replace(/\.[^.]+$/, '')}\n${file.text}`).filter(Boolean).join('\n\n');
      if (combinedText) setSinglePaste(combinedText);
      setAssets((value) => [...value, ...bundle.images]);
      setStatus(`Imported ${bundle.textFiles.length} text file${bundle.textFiles.length === 1 ? '' : 's'} and ${bundle.images.length} image${bundle.images.length === 1 ? '' : 's'} from ${bundle.sourceName}.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'ZIP import failed.'); }
  }

  function addStory() { setSeparate((items) => [...items, { title: `Story ${items.length + 1}`, body: '' }]); }
  function updateStory(index: number, patch: Partial<InputSection>) { setSeparate((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)); }
  function removeStory(index: number) { setSeparate((items) => items.filter((_, itemIndex) => itemIndex !== index)); }

  function generate() {
    const chunks = normalizeContentInputs(singlePaste, separate).filter((chunk) => chunk.body.trim() || chunk.title.trim());
    if (!chunks.length) { setStatus('Add at least one article before generating.'); return; }
    const rawImages = assets.filter((asset) => /\.(png|jpe?g|webp|gif)$/i.test(asset.name)).map(assetImage);
    const matchedImages = autoPlaceImages(rawImages, chunks);
    const byChunk = new Map<string, EPaperImageElement>();
    for (const image of matchedImages) if (image.linkedChunkId && !byChunk.has(image.linkedChunkId)) byChunk.set(image.linkedChunkId, image);
    const generatedSections = chunks.map((chunk) => ({ heading: chunk.title, body: chunk.body, image: byChunk.get(chunk.id) }));
    const generated = generateEPaperLayout({ ...doc, title: humanOptimizeHeadline(title), publisher: publisher.trim() || 'Nexus Plus' }, { title: humanOptimizeHeadline(title), intro: intro.trim(), sections: generatedSections });
    commit(generated);
    setStatus(`${chunks.length} stories classified and ${matchedImages.length} images matched locally. Use Human Optimize before export when polishing imported copy.`);
    setSelected(null);
  }

  function humanOptimize() {
    const optimizedSingle = humanOptimizeStory(title, singlePaste);
    setTitle(optimizedSingle.title);
    setSinglePaste(optimizedSingle.body);
    setSeparate((items) => items.map((story) => { const result = humanOptimizeStory(story.title, story.body); return { ...story, title: result.title, body: result.body }; }));
    if (doc.pages.some((page) => page.elements.some((element) => element.type === 'text' || element.type === 'headline' || element.type === 'subheadline' || element.type === 'body'))) {
      const optimizedPages = doc.pages.map((page) => ({ ...page, elements: page.elements.map((element) => ('text' in element ? { ...element, text: humanOptimizeStory('', element.text).body } : element)) }));
      commit({ ...doc, title: humanOptimizeHeadline(title), pages: optimizedPages });
    }
    setStatus('Human Optimize applied locally: filler cleanup, deterministic condensation and editorial reflow. It does not prove or change authorship.');
  }

  function changeDoc<K extends keyof EPaperDocument>(key: K, value: EPaperDocument[K]) { commit({ ...doc, [key]: value }); }
  function editSelected(patch: Partial<EPaperElement>) { if (selected) commit(updateElement(doc, selected.pageId, selected.elementId, patch)); }
  function deleteSelected() { if (!selected) return; commit(deleteElement(doc, selected.pageId, selected.elementId)); setSelected(null); }
  function duplicateSelected() { if (selected) commit(duplicateElement(doc, selected.pageId, selected.elementId)); }
  function doUndo() { const result = undo(history, doc); setHistory(result.history); setDoc(result.document); setOutputUri(null); setSelected(null); }
  function doRedo() { const result = redo(history, doc); setHistory(result.history); setDoc(result.document); setOutputUri(null); setSelected(null); }
  function addBlankPage() { commit(addPage(doc)); }
  async function saveProject() { try { await saveEPaperProject(doc); setStatus('E-paper project saved locally.'); } catch { setStatus('Could not save this e-paper project.'); } }

  async function exportPdf() {
    setBusy(true);
    try {
      const filename = sanitizeHeadlineFilename(doc.title);
      const outputPath = await PdfNativeBridge.preparePdfToolOutput('E-Paper', filename);
      const path = await PdfNativeBridge.renderEPaperToPdf(JSON.stringify(doc), outputPath, 180);
      setOutputUri(path);
      setStatus(`Generated and saved successfully in Nexus Plus/PDF Tools/E-Paper/${filename}`);
      return path;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not export the e-paper.');
      return null;
    } finally { setBusy(false); }
  }

  async function download() { const path = outputUri || await exportPdf(); if (path) setStatus(`Download ready. Saved in Nexus Plus/PDF Tools/E-Paper as ${path.split('/').pop()}.`); }
  async function share() {
    setBusy(true);
    try {
      const path = outputUri || await exportPdf();
      if (!path) return;
      if (!(await Sharing.isAvailableAsync())) { setStatus('Sharing is unavailable on this device.'); return; }
      await Sharing.shareAsync(path, { mimeType: 'application/pdf', dialogTitle: 'Share e-paper' });
      setStatus('Share sheet opened. You can send the PDF to WhatsApp or another destination. No publish API is used.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not share the e-paper.'); }
    finally { setBusy(false); }
  }
  async function print() {
    setBusy(true);
    try {
      const path = outputUri || await exportPdf();
      if (!path) return;
      await PdfNativeBridge.printPdf(path, doc.title || 'Nexus Plus E-Paper');
      setStatus('Android print dialog opened with the PDF paper size preserved.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not open the print dialog.'); }
    finally { setBusy(false); }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'E-Paper Generator Studio' }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.header}><View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="newspaper-variant-outline" size={29} color={colors.primary} /></View><View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>E-Paper Generator Studio</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Newspaper layout, local optimization, ZIP import and real print-ready PDF output.</Text></View></View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>1. Import and content input</Text>
          <Text style={[styles.label, { color: colors.foreground }]}>Single paste mode</Text>
          <TextInput accessibilityLabel="All newspaper content in one paste" value={singlePaste} onChangeText={setSinglePaste} multiline textAlignVertical="top" style={[styles.input, styles.largeInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
          <View style={styles.orRow}><View style={[styles.rule, { backgroundColor: colors.border }]} /><Text style={[styles.orText, { color: colors.mutedForeground }]}>OR ADD STORIES SEPARATELY</Text><View style={[styles.rule, { backgroundColor: colors.border }]} /></View>
          {separate.map((story, index) => <View key={`story-${index}`} style={[styles.storyBox, { backgroundColor: colors.background, borderColor: colors.border }]}><TextInput accessibilityLabel={`Story ${index + 1} headline`} placeholder="Story headline" placeholderTextColor={colors.mutedForeground} value={story.title} onChangeText={(value) => updateStory(index, { title: value })} style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} /><TextInput accessibilityLabel={`Story ${index + 1} content`} placeholder="Story content" placeholderTextColor={colors.mutedForeground} value={story.body} onChangeText={(value) => updateStory(index, { body: value })} multiline textAlignVertical="top" style={[styles.input, styles.mediumInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} /><Pressable accessibilityRole="button" accessibilityLabel={`Remove story ${index + 1}`} onPress={() => removeStory(index)} style={styles.remove}><Feather name="trash-2" size={16} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Remove story</Text></Pressable></View>)}
          <View style={styles.actionRow}><Pressable accessibilityRole="button" accessibilityLabel="Add another story" onPress={addStory} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.secondary }]}><Feather name="plus" size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Add Story</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Import e-paper ZIP" onPress={() => void importZip()} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.secondary }]}><Feather name="archive" size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Import ZIP</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Add images and PDF content" onPress={() => void addAssets()} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.secondary }]}><Feather name="upload" size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Add Files</Text></Pressable></View>
          <Text style={[styles.label, { color: colors.foreground }]}>E-paper title</Text><TextInput accessibilityLabel="E-paper title" value={title} onChangeText={setTitle} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
          <Text style={[styles.label, { color: colors.foreground }]}>Publisher</Text><TextInput accessibilityLabel="Publisher" value={publisher} onChangeText={setPublisher} style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
          <Text style={[styles.label, { color: colors.foreground }]}>Intro / edition note</Text><TextInput accessibilityLabel="Intro" value={intro} onChangeText={setIntro} multiline style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />
          <View style={styles.actionRow}><Pressable accessibilityRole="button" accessibilityLabel="Human optimize content" onPress={humanOptimize} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="account-edit-outline" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Human Optimize</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Generate e-paper automatically" disabled={busy} onPress={generate} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><MaterialCommunityIcons name="auto-fix" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Generate E-Paper</Text></Pressable></View>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>Human Optimize is local deterministic editing/reflow. It can clean, condense and professionalize copy, but it cannot certify whether a person or AI authored it.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>2. Document controls</Text><View style={styles.historyRow}><Pressable accessibilityRole="button" accessibilityLabel="Undo" disabled={!history.past.length} onPress={doUndo} style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="corner-up-left" size={17} color={colors.primary} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Redo" disabled={!history.future.length} onPress={doRedo} style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="corner-up-right" size={17} color={colors.primary} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Save project locally" onPress={() => void saveProject()} style={[styles.iconButton, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="save" size={17} color={colors.primary} /></Pressable></View></View>
          <Text style={[styles.label, { color: colors.foreground }]}>Columns</Text><View style={styles.pillRow}>{[1,2,3,4,5,6].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.columns === value }} onPress={() => changeDoc('columns', value)} style={[styles.pill, { backgroundColor: doc.columns === value ? colors.primary : colors.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: doc.columns === value ? colors.primaryForeground : colors.foreground }]}>{value}</Text></Pressable>)}</View>
          <Text style={[styles.label, { color: colors.foreground }]}>Paper size</Text><View style={styles.pillRow}>{(['a4','a3','letter','tabloid','custom'] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.paperSize === value }} onPress={() => changeDoc('paperSize', value)} style={[styles.pillWide, { backgroundColor: doc.paperSize === value ? colors.primary : colors.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: doc.paperSize === value ? colors.primaryForeground : colors.foreground }]}>{value.toUpperCase()}</Text></Pressable>)}</View>
          <Text style={[styles.label, { color: colors.foreground }]}>Orientation</Text><View style={styles.pillRow}>{(['portrait','landscape'] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.orientation === value }} onPress={() => changeDoc('orientation', value)} style={[styles.pillWide, { backgroundColor: doc.orientation === value ? colors.primary : colors.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: doc.orientation === value ? colors.primaryForeground : colors.foreground }]}>{value}</Text></Pressable>)}</View>
          <Text style={[styles.label, { color: colors.foreground }]}>Margin: {Math.round(doc.margin)} pt</Text><View style={styles.pillRow}>{[16,24,32,40,48].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.margin === value }} onPress={() => changeDoc('margin', value)} style={[styles.pillWide, { backgroundColor: doc.margin === value ? colors.primary : colors.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: doc.margin === value ? colors.primaryForeground : colors.foreground }]}>{value}</Text></Pressable>)}</View>
          <Text style={[styles.label, { color: colors.foreground }]}>Gutter: {Math.round(doc.gutter)} pt</Text><View style={styles.pillRow}>{[8,12,16,20,24].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.gutter === value }} onPress={() => changeDoc('gutter', value)} style={[styles.pillWide, { backgroundColor: doc.gutter === value ? colors.primary : colors.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: doc.gutter === value ? colors.primaryForeground : colors.foreground }]}>{value}</Text></Pressable>)}</View>
          <View style={styles.actionRow}><Pressable accessibilityRole="button" accessibilityLabel="Add blank page" onPress={addBlankPage} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="file-plus" size={16} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Add Page</Text></Pressable></View>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>A4/A3/Letter/Tabloid/custom stay in physical PDF points; preview scales to the phone without changing the document geometry.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>3. Element editor</Text>
          {selectedElement ? <>
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>Selected: {selectedElement.type}</Text>
            {'text' in selectedElement && <TextInput accessibilityLabel="Selected element text" value={selectedElement.text} onChangeText={(text) => editSelected({ text })} multiline style={[styles.input, styles.mediumInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />}
            {'fontSize' in selectedElement && <View style={styles.pillRow}>{[10,12,14,16,18,24,30,36,48].map((size) => <Pressable key={size} accessibilityRole="radio" accessibilityState={{ selected: selectedElement.fontSize === size }} onPress={() => editSelected({ fontSize: size })} style={[styles.pillWide, { backgroundColor: selectedElement.fontSize === size ? colors.primary : colors.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: selectedElement.fontSize === size ? colors.primaryForeground : colors.foreground }]}>{size} pt</Text></Pressable>)}</View>}
            {'align' in selectedElement && <View style={styles.pillRow}>{(['left','center','right','justify'] as const).map((align) => <Pressable key={align} accessibilityRole="radio" accessibilityState={{ selected: selectedElement.align === align }} onPress={() => editSelected({ align })} style={[styles.pillWide, { backgroundColor: selectedElement.align === align ? colors.primary : colors.background, borderColor: colors.border }]}><Text style={[styles.pillText, { color: selectedElement.align === align ? colors.primaryForeground : colors.foreground }]}>{align}</Text></Pressable>)}</View>}
            <View style={styles.numericRow}>{(['x','y','width','height'] as const).map((key) => <TextInput key={key} accessibilityLabel={`Selected element ${key}`} keyboardType="decimal-pad" value={String(Math.round(selectedElement[key]))} onChangeText={(value) => { const numeric = Number(value); if (Number.isFinite(numeric)) editSelected({ [key]: numeric } as Partial<EPaperElement>); }} style={[styles.smallInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]} />)}</View>
            <View style={styles.actionRow}><Pressable accessibilityRole="button" accessibilityLabel="Duplicate selected element" onPress={duplicateSelected} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="copy" size={16} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Duplicate</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Delete selected element" onPress={deleteSelected} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="trash-2" size={16} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Delete</Text></Pressable></View>
          </> : <Text style={[styles.helper, { color: colors.mutedForeground }]}>Generate first. Element editing supports position, size, typography and history without tying the layout to phone pixels.</Text>}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>4. Output</Text>
          <View style={[styles.previewStage, { backgroundColor: colors.secondary }]}><View style={[styles.paper, { width: preview.width, height: preview.height, backgroundColor: doc.background, borderColor: colors.border }]}><Text numberOfLines={2} style={[styles.paperTitle, { color: doc.ink }]}>{doc.title}</Text><Text style={[styles.paperMeta, { color: doc.ink }]}>{doc.publisher} • {doc.editionDate}</Text><View style={styles.previewColumns}>{Array.from({ length: doc.columns }).map((_, column) => <Pressable key={column} accessibilityRole="button" accessibilityLabel={`Preview column ${column + 1}`} onPress={() => setSelected(doc.pages[0]?.elements[column] ? { pageId: doc.pages[0].id, elementId: doc.pages[0].elements[column].id } : null)} style={styles.previewColumn}><View style={[styles.fakeLine, { backgroundColor: doc.ink }]} /><View style={[styles.fakeLineShort, { backgroundColor: doc.accent }]} /><View style={[styles.fakeImage, { backgroundColor: colors.secondary }]} /><View style={[styles.fakeLine, { backgroundColor: doc.ink }]} /><View style={[styles.fakeLine, { backgroundColor: doc.ink }]} /></Pressable>)}</View></View></View>
          <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text>
          <View style={styles.actionRow}><Pressable accessibilityRole="button" accessibilityLabel="Download e-paper" disabled={busy} onPress={() => void download()} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="download" size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Download</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Print e-paper" disabled={busy} onPress={() => void print()} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="printer" size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Print</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Share e-paper" disabled={busy} onPress={() => void share()} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.background }]}><Feather name="share-2" size={17} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Share</Text></Pressable></View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 16 }, headerIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 12 }, title: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 4 }, subtitle: { fontSize: 11.5, lineHeight: 17 }, card: { marginHorizontal: 16, borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 12 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 12 }, historyRow: { flexDirection: 'row', gap: 7 }, iconButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, label: { fontSize: 11.5, fontFamily: 'Inter_700Bold', marginBottom: 6, marginTop: 4 }, input: { minHeight: 44, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9, fontSize: 12.5, marginBottom: 9 }, largeInput: { minHeight: 160, textAlignVertical: 'top' }, mediumInput: { minHeight: 100, textAlignVertical: 'top' }, orRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 }, rule: { flex: 1, height: 1 }, orText: { fontSize: 8.5, fontFamily: 'Inter_700Bold', letterSpacing: 0.6 }, storyBox: { borderWidth: 1, borderRadius: 13, padding: 10, marginBottom: 9 }, remove: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingVertical: 5 }, secondaryText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, primaryButton: { flex: 1, minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, primaryText: { fontSize: 12.5, fontFamily: 'Inter_700Bold' }, pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }, pill: { minWidth: 38, height: 38, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, pillWide: { minHeight: 38, paddingHorizontal: 10, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, pillText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' }, helper: { fontSize: 10.5, lineHeight: 16, marginTop: 5 }, numericRow: { flexDirection: 'row', gap: 7, marginTop: 8 }, smallInput: { flex: 1, minWidth: 54, height: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, fontSize: 11 }, actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 }, action: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, actionText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' }, previewStage: { alignItems: 'center', justifyContent: 'center', minHeight: 320, borderRadius: 14, padding: 10 }, paper: { borderWidth: 1, padding: 11 }, paperTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', textAlign: 'center' }, paperMeta: { fontSize: 7, textAlign: 'center', marginTop: 3, marginBottom: 7 }, previewColumns: { flexDirection: 'row', gap: 4, flex: 1 }, previewColumn: { flex: 1, paddingTop: 3 }, fakeLine: { height: 3, borderRadius: 2, opacity: 0.5, marginBottom: 4 }, fakeLineShort: { width: '70%', height: 3, borderRadius: 2, marginBottom: 5 }, fakeImage: { width: '100%', height: 44, borderRadius: 3, marginBottom: 6 }, status: { marginTop: 9, fontSize: 10.5, lineHeight: 16 },
});

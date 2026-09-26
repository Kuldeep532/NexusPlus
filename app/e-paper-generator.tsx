import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { createEmptyDocument, generateEPaperLayout, normalizeForPreview } from '@/features/e-paper/ePaperEngine';
import type { EPaperDocument, EPaperImageElement, EPaperTextElement } from '@/features/e-paper/ePaperTypes';
import { getMyPremiumEntitlement, type PremiumEntitlement } from '@/features/premium/premiumRepository';

type Asset = { uri: string; name: string };
function isTextElement(element: EPaperDocument['pages'][number]['elements'][number]): element is EPaperTextElement { return element.type === 'headline' || element.type === 'subheadline' || element.type === 'body' || element.type === 'caption' || element.type === 'quote'; }
const INITIAL_BODY = 'Paste your article, bulletin, announcement or publication copy here. The deterministic layout engine will flow your content through newspaper-style columns without calling an AI service.';
function makeImageElement(asset: Asset, index: number): EPaperImageElement { return { id: `image-${Date.now()}-${index}`, type: 'image', uri: asset.uri, name: asset.name, x: 0, y: 0, width: 100, height: 120, fit: 'cover' }; }
export default function EPaperGeneratorScreen() {
  const colors = useColors(); const insets = useSafeAreaInsets(); const router = useRouter(); const { width: viewportWidth } = useWindowDimensions();
  const [doc, setDoc] = useState<EPaperDocument>(() => createEmptyDocument()); const [title, setTitle] = useState('My E-Paper'); const [publisher, setPublisher] = useState('Nexus Plus'); const [intro, setIntro] = useState(''); const [body, setBody] = useState(INITIAL_BODY); const [sections] = useState<Array<{ heading: string; body: string; image?: EPaperImageElement }>>([]); const [assets, setAssets] = useState<Asset[]>([]); const [busy, setBusy] = useState(false); const [status, setStatus] = useState('Ready. Add content and press Generate E-Paper.'); const [outputUri, setOutputUri] = useState<string | null>(null);
  const preview = useMemo(() => normalizeForPreview(doc, Math.max(280, viewportWidth - 32)), [doc, viewportWidth]);
  const isPremium = Boolean(entitlement?.unlocksPremiumFeatures && entitlement.tierLevel > 1 && (!entitlement.expiresAt || new Date(entitlement.expiresAt).getTime() > Date.now()));
  const requirePremium = () => { if (isPremium) return true; Alert.alert('Premium feature', 'Advanced AI tools are available with Nexus Plus Premium.', [{ text: 'Not now', style: 'cancel' }, { text: 'View Premium', onPress: () => router.push('/buy-premium') }]); return false; };
  useMemo(() => { void getMyPremiumEntitlement().then(setEntitlement).catch(() => setEntitlement(null)).finally(() => setPremiumLoading(false)); }, []);
  async function addAssets() { try { const picked = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'text/*'], multiple: true, copyToCacheDirectory: true }); if (picked.canceled || !picked.assets?.length) return; const next = picked.assets.map((asset) => ({ uri: asset.uri, name: asset.name || 'asset' })); setAssets((value) => [...value, ...next]); setStatus(`${next.length} asset${next.length === 1 ? '' : 's'} added.`); } catch { setStatus('Could not add those files.'); } }
  function generate() { const imageAssets = assets.filter((asset) => /\.(png|jpe?g|webp|gif)$/i.test(asset.name)); const generatedSections = [{ heading: 'Top Story', body: body.trim() || INITIAL_BODY, image: imageAssets[0] ? makeImageElement(imageAssets[0], 0) : undefined }, ...sections, ...imageAssets.slice(1).map((asset, index) => ({ heading: asset.name.replace(/\.[^.]+$/, ''), body: 'Image story', image: makeImageElement(asset, index + 1) }))]; const generated = generateEPaperLayout({ ...doc, title: title.trim() || 'My E-Paper', publisher: publisher.trim() || 'Nexus Plus' }, { title: title.trim() || 'My E-Paper', intro: intro.trim(), sections: generatedSections }); setDoc(generated); setStatus(`Generated ${generated.pages.length} page${generated.pages.length === 1 ? '' : 's'} successfully.`); setOutputUri(null); }
  function updateDoc<K extends keyof EPaperDocument>(key: K, value: EPaperDocument[K]) { setDoc((current) => ({ ...current, [key]: value })); }
  async function exportPdf() { setBusy(true); setOutputUri(null); setStatus('Preparing your e-paper…'); try { const html = buildPrintableHtml(doc); const htmlUri = `${FileSystem.cacheDirectory}nexus-epaper-${Date.now()}.html`; await FileSystem.writeAsStringAsync(htmlUri, html); const svgUris: string[] = []; for (let pageIndex = 0; pageIndex < doc.pages.length; pageIndex += 1) { const svg = buildPageSvg(doc, pageIndex); const svgUri = `${FileSystem.cacheDirectory}nexus-epaper-page-${Date.now()}-${pageIndex}.svg`; await FileSystem.writeAsStringAsync(svgUri, svg); svgUris.push(svgUri); } if (!svgUris.length) throw new Error('No e-paper pages were generated.'); throw new Error('PDF export is not available on this build yet.'); } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not export the e-paper.'); } finally { setBusy(false); } }
  async function shareOutput() { if (!outputUri || !(await Sharing.isAvailableAsync())) { setStatus('Generate and export the e-paper before sharing.'); return; } try { await Sharing.shareAsync(outputUri, { mimeType: 'application/pdf', dialogTitle: 'Share e-paper' }); } catch { Alert.alert('Share unavailable', 'The e-paper could not be shared.'); } }
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'E-Paper Generator' }} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={30} color={colors.primary} />
          </View>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>E-Paper Generator Studio</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create newspaper-style e-papers with free basic AI help and advanced Premium tools.</Text>
          </View>
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
            <TextInput accessibilityLabel="Main article content" value={body} onChangeText={setBody} multiline textAlignVertical="top" style={[styles.input, styles.multiline, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]} />
            <Pressable accessibilityRole="button" accessibilityLabel="Add content and images" onPress={() => void addAssets()} style={styles.secondaryButton}>
              <Feather name="upload" size={18} color={colors.primary} />
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>Add Content / Images</Text>
            </Pressable>
            {assets.length > 0 ? <Text style={[styles.helper, { color: colors.mutedForeground }]}>{assets.length} uploaded asset{assets.length === 1 ? '' : 's'}.</Text> : null}
            <Pressable accessibilityRole="button" accessibilityLabel="Generate e-paper" onPress={generate} disabled={busy} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="auto-fix" size={19} color={colors.primaryForeground} />
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Generate E-Paper</Text>
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>2. AI tools</Text>
                <Text style={[styles.helper, { color: colors.mutedForeground }]}>Basic AI assistance is free. Advanced publishing tools require Premium.</Text>
              </View>
              <View style={[styles.tierBadge, { backgroundColor: isPremium ? colors.secondary : colors.background, borderColor: colors.border }]}>
                <Text style={[styles.tierText, { color: colors.foreground }]}>{premiumLoading ? 'Checking…' : isPremium ? 'Premium' : 'Free'}</Text>
              </View>
            </View>
            <View style={styles.aiGrid}>
              <Pressable accessibilityRole="button" accessibilityLabel="Basic AI summarize" onPress={() => setStatus('Basic AI summary is available for free. Open Nexus Assistant to summarize this article.')} style={[styles.aiButton, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="file-text" size={17} color={colors.primary} />
                <View style={styles.aiCopy}><Text style={[styles.aiTitle, { color: colors.foreground }]}>Basic Summary</Text><Text style={[styles.aiMeta, { color: colors.mutedForeground }]}>Free</Text></View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Basic text improvement" onPress={() => setStatus('Basic text improvement is available for free. Open Nexus Assistant to improve your wording.')} style={[styles.aiButton, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="edit-3" size={17} color={colors.primary} />
                <View style={styles.aiCopy}><Text style={[styles.aiTitle, { color: colors.foreground }]}>Basic Text Improvement</Text><Text style={[styles.aiMeta, { color: colors.mutedForeground }]}>Free</Text></View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Advanced e-paper rewrite" onPress={() => { if (requirePremium()) setStatus('Advanced rewrite is ready for your e-paper workflow.'); }} style={[styles.aiButton, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="star-four-points-outline" size={18} color={colors.primary} />
                <View style={styles.aiCopy}><Text style={[styles.aiTitle, { color: colors.foreground }]}>Advanced Rewrite</Text><Text style={[styles.aiMeta, { color: colors.mutedForeground }]}>Premium</Text></View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Advanced headline and article polish" onPress={() => { if (requirePremium()) setStatus('Advanced headline and article polish is ready.'); }} style={[styles.aiButton, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="auto-fix" size={18} color={colors.primary} />
                <View style={styles.aiCopy}><Text style={[styles.aiTitle, { color: colors.foreground }]}>Headline & Article Polish</Text><Text style={[styles.aiMeta, { color: colors.mutedForeground }]}>Premium</Text></View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Advanced exam paper generation" onPress={() => { if (requirePremium()) setStatus('Advanced exam-paper generation is ready.'); }} style={[styles.aiButton, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="school-outline" size={18} color={colors.primary} />
                <View style={styles.aiCopy}><Text style={[styles.aiTitle, { color: colors.foreground }]}>Exam Paper Assistant</Text><Text style={[styles.aiMeta, { color: colors.mutedForeground }]}>Premium</Text></View>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Advanced news edition generation" onPress={() => { if (requirePremium()) setStatus('Advanced news-edition generation is ready.'); }} style={[styles.aiButton, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="newspaper-variant-outline" size={18} color={colors.primary} />
                <View style={styles.aiCopy}><Text style={[styles.aiTitle, { color: colors.foreground }]}>News Edition Builder</Text><Text style={[styles.aiMeta, { color: colors.mutedForeground }]}>Premium</Text></View>
              </Pressable>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>3. Full customization</Text>
            <View style={styles.row}>
              <View style={styles.flex}><Text style={[styles.label, { color: colors.foreground }]}>Columns</Text></View>
              <View style={styles.pillRow}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.columns === value }} onPress={() => updateDoc('columns', value)} style={styles.pill}><Text>{value}</Text></Pressable>)}</View>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.foreground }]}>Paper</Text>
              <View style={styles.pillRow}>{(['a4', 'letter', 'tabloid', 'a3'] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.paperSize === value }} onPress={() => updateDoc('paperSize', value)} style={styles.pillWide}><Text>{value.toUpperCase()}</Text></Pressable>)}</View>
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.foreground }]}>Orientation</Text>
              <View style={styles.pillRow}>{(['portrait', 'landscape'] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: doc.orientation === value }} onPress={() => updateDoc('orientation', value)} style={styles.pillWide}><Text>{value}</Text></Pressable>)}</View>
            </View>
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>Margins, gutters, colors, typography and element positions are stored in the editable document model.</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>4. Live preview</Text>
            <View style={[styles.previewStage, { backgroundColor: colors.secondary }]}>
              <View style={[styles.paper, { width: preview.width, height: preview.height, backgroundColor: doc.background, borderColor: colors.border }]}>
                <Text numberOfLines={2} style={[styles.paperTitle, { color: doc.ink }]}>{doc.title}</Text>
                <Text style={[styles.paperMeta, { color: doc.ink }]}>{doc.publisher} • {doc.editionDate}</Text>
                <View style={styles.previewColumns}>
                  {Array.from({ length: doc.columns }).map((_, column) => (
                    <View key={column} style={styles.previewColumn}>
                      <View style={styles.fakeLine} />
                      <View style={styles.fakeLineShort} />
                      <View style={styles.fakeImage} />
                    </View>
                  ))}
                </View>
              </View>
            </View>
            <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text>
            <View style={styles.actionRow}>
              <Pressable accessibilityRole="button" accessibilityLabel="Export e-paper as PDF" onPress={() => void exportPdf()}><Text>Download</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Print e-paper" onPress={() => void exportPdf()}><Text>Print</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Share e-paper" onPress={() => void shareOutput()}><Text>Share</Text></Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
function escapeXml(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&apos;'); }
function buildPageSvg(doc: EPaperDocument, pageIndex: number) { const page = doc.pages[pageIndex]; const width = doc.orientation === 'landscape' ? 841.89 : 595.28; const height = doc.orientation === 'landscape' ? 595.28 : 841.89; const elements = page.elements.map((element) => { if (element.type === 'image') return `<rect x="${element.x}" y="${element.y}" width="${element.width}" height="${element.height}" fill="#ddd" />`; if (element.type === 'divider') return `<line x1="${element.x}" y1="${element.y}" x2="${element.x + element.width}" y2="${element.y}" stroke="${doc.ink}" stroke-width="1" />`; if (element.type === 'spacer' || !isTextElement(element)) return ''; const text = escapeXml(element.text).replace(/\n/g, ' '); return `<text x="${element.x}" y="${element.y + element.fontSize}" font-size="${element.fontSize}" font-weight="${element.fontWeight}" fill="${doc.ink}">${text}</text>`; }).join(''); return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}pt" height="${height}pt" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${doc.background}"/>${elements}</svg>`; }
function buildPrintableHtml(doc: EPaperDocument) { const pages = doc.pages.map((page) => `<section>${page.elements.map((element) => isTextElement(element) ? `<div style="font-size:${element.fontSize}px;font-weight:${element.fontWeight};line-height:${element.lineHeight}px;text-align:${element.align}">${escapeXml(element.text)}</div>` : element.type === 'image' ? `<figure><img src="${escapeXml(element.uri)}"/><figcaption>${escapeXml(element.caption || '')}</figcaption></figure>` : '<hr/>').join('')}</section>`).join(''); return `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"/></head><body>${pages}</body></html>`; }
const styles=StyleSheet.create({root:{flex:1},header:{flexDirection:'row',alignItems:'center',paddingHorizontal:18,marginBottom:18},headerIcon:{width:58,height:58,borderRadius:17,alignItems:'center',justifyContent:'center'},headerCopy:{flex:1,marginLeft:13},title:{fontSize:25,fontFamily:'Inter_700Bold',marginBottom:4},subtitle:{fontSize:12,lineHeight:18},cardWrap:{paddingHorizontal:16,gap:12},card:{borderWidth:1,borderRadius:18,padding:14,gap:10},sectionTitle:{fontSize:13,fontFamily:'Inter_700Bold'},label:{fontSize:11,fontFamily:'Inter_700Bold'},input:{minHeight:46,borderWidth:1,borderRadius:12,paddingHorizontal:12,fontSize:13},multilineSmall:{minHeight:70},multiline:{minHeight:160},secondaryButton:{minHeight:46,borderWidth:1,borderRadius:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},secondaryText:{fontSize:12,fontFamily:'Inter_700Bold'},helper:{fontSize:10.5,lineHeight:16},primaryButton:{minHeight:48,borderRadius:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8},primaryText:{fontSize:12,fontFamily:'Inter_700Bold'},row:{flexDirection:'row',alignItems:'center',gap:8},flex:{flex:1},pillRow:{flexDirection:'row',gap:5,flexWrap:'wrap'},pill:{minWidth:32,minHeight:32,paddingHorizontal:8,borderWidth:1,borderRadius:9,alignItems:'center',justifyContent:'center'},pillWide:{minWidth:70,minHeight:32,paddingHorizontal:8,borderWidth:1,borderRadius:9,alignItems:'center',justifyContent:'center'},previewStage:{padding:10,borderRadius:12,alignItems:'center'},paper:{borderWidth:1,padding:12},paperTitle:{fontSize:17,fontFamily:'Inter_700Bold'},paperMeta:{fontSize:8},previewColumns:{flexDirection:'row',gap:5,marginTop:10},previewColumn:{flex:1,minHeight:160,padding:4},fakeLine:{height:5,marginBottom:5,backgroundColor:'#E8E8E8'},fakeLineShort:{width:'70%',height:5,marginBottom:5,backgroundColor:'#E8E8E8'},fakeImage:{height:50,backgroundColor:'#E8E8E8'},status:{fontSize:10,lineHeight:15},actionRow:{flexDirection:'row',justifyContent:'space-between',paddingTop:8},tierBadge:{minHeight:30,paddingHorizontal:9,borderRadius:9,borderWidth:1,alignItems:'center',justifyContent:'center'},tierText:{fontSize:9,fontFamily:'Inter_700Bold'},aiGrid:{gap:8},aiButton:{minHeight:54,borderWidth:1,borderRadius:12,paddingHorizontal:11,flexDirection:'row',alignItems:'center',gap:10},aiCopy:{flex:1},aiTitle:{fontSize:11,fontFamily:'Inter_700Bold'},aiMeta:{fontSize:9,marginTop:2}});
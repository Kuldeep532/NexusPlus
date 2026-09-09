import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { PdfNativeBridge } from '@/features/pdf-native/PdfNativeBridge';
import { buildPageOrder, assertValidPageCount } from '@/features/pdf-native/pdfPageInput';
import { getPdfInfo } from '@uzimandias/react-native-pdf-to-image';

function safeBaseName(name: string): string {
  return name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document';
}

type PdfInput = { uri: string; name: string; pageCount: number };

export default function ReorderPdfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pdf, setPdf] = useState<PdfInput | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<string | null>(null);

  async function pickPdf() {
    setStatus('');
    setResult(null);
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    try {
      const asset = picked.assets[0];
      const info = await getPdfInfo(asset.uri);
      const pageCount = assertValidPageCount(info.pageCount);
      setPdf({ uri: asset.uri, name: asset.name || 'document.pdf', pageCount });
      setPageOrder(Array.from({ length: pageCount }, (_, index) => index + 1));
      setStatus(`${pageCount} pages loaded. Valid page numbers are 1 to ${pageCount}.`);
    } catch (error) {
      setPdf(null);
      setPageOrder([]);
      setStatus(error instanceof Error ? error.message : 'Could not read the PDF page count.');
    }
  }

  function move(index: number, direction: -1 | 1) {
    setPageOrder((current) => {
      const nextIndex = index + direction;
      if (index < 0 || index >= current.length || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
    setResult(null);
    setStatus('Page order updated.');
  }

  function resetOrder() {
    if (!pdf) return;
    setPageOrder(Array.from({ length: pdf.pageCount }, (_, index) => index + 1));
    setResult(null);
    setStatus('Original page order restored.');
  }

  async function saveReorderedPdf() {
    if (!pdf) { setStatus('Select a PDF before reordering pages.'); return; }
    try {
      const safeOrder = buildPageOrder(pdf.pageCount, pageOrder);
      setBusy(true);
      setResult(null);
      setStatus('Reordering PDF pages…');
      const base = FileSystem.cacheDirectory;
      if (!base) throw new Error('App cache storage is unavailable.');
      const output = `${base}nexus-pdf-${Date.now()}-${safeBaseName(pdf.name)}-reordered.pdf`;
      const uri = await PdfNativeBridge.reorder(pdf.uri, output, safeOrder);
      setResult(uri);
      setStatus('PDF reordered successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not reorder this PDF.');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!result) return;
    try {
      if (!(await Sharing.isAvailableAsync())) return;
      await Sharing.shareAsync(result, { mimeType: 'application/pdf', dialogTitle: 'Share reordered PDF' });
    } catch {
      Alert.alert('Share unavailable', 'The reordered PDF could not be shared.');
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'Reorder PDF' }} />
      {busy ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Reordering PDF</Text>
          <Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="swap-vertical" size={29} color={colors.primary} /></View>
            <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Reorder PDF</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Change page order without leaving this dedicated tool.</Text></View>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'} onPress={() => void pickPdf()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <Feather name="file-plus" size={20} color={colors.primary} />
            <View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? `${pdf.pageCount} pages • valid range 1-${pdf.pageCount}` : 'Select a local PDF file'}</Text></View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          {pdf && (
            <>
              <View style={styles.orderHeader}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Page order</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Restore original page order" onPress={resetOrder}><Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text></Pressable>
              </View>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>This PDF has {pdf.pageCount} pages. Every valid page number is 1-{pdf.pageCount}, and each page must appear exactly once.</Text>

              <View style={styles.pages}>
                {pageOrder.map((originalPage, index) => (
                  <View key={`${originalPage}-${index}`} style={[styles.pageRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.positionBadge, { backgroundColor: colors.secondary }]}>
                      <Text accessibilityLabel={`New position ${index + 1}`} style={[styles.positionText, { color: colors.primary }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.pageCopy}>
                      <Text style={[styles.pageTitle, { color: colors.foreground }]}>Original page {originalPage}</Text>
                      <Text style={[styles.pageDetail, { color: colors.mutedForeground }]}>New position {index + 1}</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Move original page ${originalPage} up`} accessibilityHint="Moves this page one position earlier" accessibilityState={{ disabled: index === 0 }} onPress={() => move(index, -1)} style={[styles.arrowButton, { borderColor: colors.border, backgroundColor: colors.background }, index === 0 && styles.disabled]}>
                      <Feather name="chevron-up" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Move original page ${originalPage} down`} accessibilityHint="Moves this page one position later" accessibilityState={{ disabled: index === pageOrder.length - 1 }} onPress={() => move(index, 1)} style={[styles.arrowButton, { borderColor: colors.border, backgroundColor: colors.background }, index === pageOrder.length - 1 && styles.disabled]}>
                      <Feather name="chevron-down" size={20} color={colors.primary} />
                    </Pressable>
                  </View>
                ))}
              </View>

              <Pressable accessibilityRole="button" accessibilityLabel="Save reordered PDF" onPress={() => void saveReorderedPdf()} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="content-save-outline" size={19} color={colors.primaryForeground} />
                <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Save Reordered PDF</Text>
              </Pressable>
            </>
          )}

          {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('successfully') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}
          {result && <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="Share reordered PDF" onPress={() => void share()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="share-2" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Share</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Reorder another PDF" onPress={() => { setResult(null); setPdf(null); setPageOrder([]); setStatus(''); }} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="refresh-cw" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Reorder Another</Text></Pressable></View>}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 13 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 12, lineHeight: 18 },
  pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  pickCopy: { flex: 1, marginHorizontal: 12 },
  pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  pickDetail: { fontSize: 11 },
  orderHeader: { marginHorizontal: 20, marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  resetText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  hint: { marginHorizontal: 20, marginTop: 7, fontSize: 11, lineHeight: 17 },
  pages: { paddingHorizontal: 20, marginTop: 14, gap: 8 },
  pageRow: { minHeight: 68, borderWidth: 1, borderRadius: 14, padding: 9, flexDirection: 'row', alignItems: 'center' },
  positionBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  positionText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  pageCopy: { flex: 1, marginHorizontal: 10 },
  pageTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  pageDetail: { fontSize: 10 },
  arrowButton: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  status: { marginHorizontal: 20, marginTop: 15, fontSize: 11, lineHeight: 17 },
  actions: { paddingHorizontal: 20, marginTop: 14, gap: 10 },
  action: { minHeight: 52, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 },
  loadingText: { textAlign: 'center', fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.74 },
  disabled: { opacity: 0.45 },
});

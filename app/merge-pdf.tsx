import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { PdfNativeBridge } from '@/features/pdf-native/PdfNativeBridge';

type PdfItem = { uri: string; name: string };

export default function MergePdfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<PdfItem[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function pickPdfs() {
    setStatus('');
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: true, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.length) return;
    setResult(null);
    setItems(picked.assets.map((asset) => ({ uri: asset.uri, name: asset.name || 'document.pdf' })));
    setStatus(`${picked.assets.length} PDF${picked.assets.length === 1 ? '' : 's'} selected. The selected order will be used.`);
  }

  async function merge() {
    if (items.length < 2) { setStatus('Select at least two PDF files.'); return; }
    setBusy(true); setResult(null); setStatus('Merging PDFs…');
    try {
      const output = `${FileSystem.cacheDirectory || ''}nexus-merged-${Date.now()}.pdf`;
      const uri = await PdfNativeBridge.merge(items.map((item) => item.uri), output);
      setResult(uri); setStatus('PDFs merged successfully.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not merge these PDFs.'); }
    finally { setBusy(false); }
  }

  async function share() {
    if (!result || !(await Sharing.isAvailableAsync())) return;
    try { await Sharing.shareAsync(result, { mimeType: 'application/pdf', dialogTitle: 'Share merged PDF' }); }
    catch { Alert.alert('Share unavailable', 'The merged PDF could not be shared.'); }
  }

  async function reset() {
    if (result && result.startsWith(FileSystem.cacheDirectory ?? '___never___')) {
      try { await FileSystem.deleteAsync(result, { idempotent: true }); } catch { /* best effort */ }
    }
    setItems([]); setResult(null); setStatus('');
  }

  useEffect(() => () => { if (result && result.startsWith(FileSystem.cacheDirectory ?? '___never___')) void FileSystem.deleteAsync(result, { idempotent: true }).catch(() => undefined); }, [result]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Merge PDF' }} />
      {busy ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Merging PDFs</Text><Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>Combining the selected PDF files into one document.</Text></View> :
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="file-document-multiple-outline" size={28} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Merge PDF</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Combine two or more PDF files into a single PDF.</Text></View></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose PDF files" onPress={() => void pickPdfs()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="file-plus" size={20} color={colors.primary} /><View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>Choose PDF files</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{items.length ? `${items.length} selected` : 'Select multiple PDFs'}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
          {items.length > 0 && <View style={styles.files}>{items.map((item, index) => <View key={`${item.uri}-${index}`} style={[styles.fileRow, { backgroundColor: colors.card, borderColor: colors.border }]}><Text accessibilityLabel={`PDF position ${index + 1}`} style={[styles.index, { color: colors.primary }]}>{index + 1}</Text><Text numberOfLines={1} style={[styles.fileName, { color: colors.foreground }]}>{item.name}</Text></View>)}</View>}
          <Pressable accessibilityRole="button" accessibilityLabel="Merge PDF files" onPress={() => void merge()} disabled={items.length < 2} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (pressed || items.length < 2) && styles.disabled]}><MaterialCommunityIcons name="merge" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Merge PDFs</Text></Pressable>
          {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('successfully') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}
          {result && <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="Share merged PDF" onPress={() => void share()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="share-2" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Share</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Merge more PDFs" onPress={() => void reset()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="refresh-cw" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Merge More</Text></Pressable></View>}
        </ScrollView>}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 22 }, icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 13 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' }, pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }, pickCopy: { flex: 1, marginHorizontal: 12 }, pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 }, pickDetail: { fontSize: 11 }, files: { marginTop: 14, paddingHorizontal: 20, gap: 8 }, fileRow: { minHeight: 48, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }, index: { width: 28, fontFamily: 'Inter_700Bold' }, fileName: { flex: 1, fontSize: 12 }, primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, status: { marginHorizontal: 20, marginTop: 16, fontSize: 11, lineHeight: 17 }, actions: { paddingHorizontal: 20, marginTop: 14, gap: 10 }, action: { minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 }, loadingText: { textAlign: 'center', fontSize: 13, lineHeight: 19 }, pressed: { opacity: 0.75 }, disabled: { opacity: 0.5 } });

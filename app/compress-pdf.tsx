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

type Pdf = { uri: string; name: string };

export default function CompressPdfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pdf, setPdf] = useState<Pdf | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function pickPdf() {
    setStatus('');
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    setPdf({ uri: picked.assets[0].uri, name: picked.assets[0].name || 'document.pdf' });
    setResult(null);
    setStatus('PDF selected.');
  }

  async function compress() {
    if (!pdf) { setStatus('Select a PDF first.'); return; }
    setBusy(true); setResult(null); setStatus('Compressing PDF…');
    try {
      const output = `${FileSystem.cacheDirectory || ''}nexus-compressed-${Date.now()}.pdf`;
      const uri = await PdfNativeBridge.compress(pdf.uri, output, 75);
      setResult(uri); setStatus('PDF compression completed.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not compress this PDF.'); }
    finally { setBusy(false); }
  }

  async function share() {
    if (!result || !(await Sharing.isAvailableAsync())) return;
    try { await Sharing.shareAsync(result, { mimeType: 'application/pdf', dialogTitle: 'Share compressed PDF' }); }
    catch { Alert.alert('Share unavailable', 'The compressed PDF could not be shared.'); }
  }

  async function reset() {
    if (result && result.startsWith(FileSystem.cacheDirectory ?? '___never___')) { try { await FileSystem.deleteAsync(result, { idempotent: true }); } catch { /* best effort */ } }
    setPdf(null); setResult(null); setStatus('');
  }

  useEffect(() => () => { if (result && result.startsWith(FileSystem.cacheDirectory ?? '___never___')) void FileSystem.deleteAsync(result, { idempotent: true }).catch(() => undefined); }, [result]);

  return <View style={[styles.root, { backgroundColor: colors.background }]}><Stack.Screen options={{ title: 'Compress PDF' }} />{busy ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Compressing PDF</Text><Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>Creating a smaller PDF copy.</Text></View> : <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="file-move-outline" size={28} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Compress PDF</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create a smaller copy of a PDF for easier sharing.</Text></View></View>
    <Pressable accessibilityRole="button" accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'} onPress={() => void pickPdf()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="file-plus" size={20} color={colors.primary} /><View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? 'Ready to compress' : 'Select a local PDF file'}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Compress PDF" onPress={() => void compress()} disabled={!pdf} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (pressed || !pdf) && styles.disabled]}><MaterialCommunityIcons name="arrow-collapse" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Compress PDF</Text></Pressable>
    <Text style={[styles.note, { color: colors.mutedForeground }]}>The current native implementation performs a safe PDF rewrite. Additional image downsampling can be added in a later stage without changing this screen.</Text>
    {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('completed') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}
    {result && <View style={styles.actions}><Pressable accessibilityRole="button" accessibilityLabel="Share compressed PDF" onPress={() => void share()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="share-2" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Share</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Compress another PDF" onPress={() => void reset()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="refresh-cw" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Compress Another</Text></Pressable></View>}
  </ScrollView>}</View>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 22 }, icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 13 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' }, pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }, pickCopy: { flex: 1, marginHorizontal: 12 }, pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 }, pickDetail: { fontSize: 11 }, primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, note: { marginHorizontal: 20, marginTop: 12, fontSize: 11, lineHeight: 17 }, status: { marginHorizontal: 20, marginTop: 16, fontSize: 11, lineHeight: 17 }, actions: { paddingHorizontal: 20, marginTop: 14, gap: 10 }, action: { minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 }, loadingText: { textAlign: 'center', fontSize: 13, lineHeight: 19 }, pressed: { opacity: 0.75 }, disabled: { opacity: 0.5 } });

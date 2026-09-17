import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { flattenPdfWithGotenberg } from '@/features/pdf-gotenberg/gotenbergPdfEngine';
import { PdfToolResultPanel } from '@/features/pdf-native/PdfToolResultPanel';

type PickedFile = { uri: string; name: string };

function safeBaseName(name: string): string {
  return name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document';
}

export default function PdfPreflightScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function pickFile() {
    setStatus('');
    setResult(null);
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setFile({ uri: asset.uri, name: asset.name || 'document.pdf' });
    setStatus('PDF selected.');
  }

  async function processPdf() {
    if (!file) { setStatus('Choose a PDF first.'); return; }
    setBusy(true);
    setResult(null);
    setStatus('Running PDF preflight normalization…');
    try {
      const outputName = `${safeBaseName(file.name)}-preflight.pdf`;
      const uri = await flattenPdfWithGotenberg(file.uri, outputName);
      setResult(uri);
      setStatus('PDF normalization completed.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'PDF preflight could not be completed.');
    } finally { setBusy(false); }
  }

  function reset() { setFile(null); setResult(null); setStatus(''); }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'PDF Preflight & Optimize' }} />
      {busy ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Processing PDF</Text><Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status}</Text></View> : <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="tune-variant" size={29} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>PDF Preflight & Optimize</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Normalize a PDF through the existing Gotenberg PDF Engine before sharing or archiving.</Text></View></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose PDF" accessibilityHint="Select the PDF to process." onPress={() => void pickFile()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><Feather name="file-plus" size={20} color={colors.primary} /><View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>Choose PDF</Text><Text numberOfLines={1} style={[styles.pickDetail, { color: colors.mutedForeground }]}>{file?.name || 'Select a PDF document'}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>
        {!!file && !result && <View style={[styles.info, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>WORKFLOW</Text><Text style={[styles.infoValue, { color: colors.foreground }]}>Gotenberg PDF Engine flatten/normalization</Text></View>}
        {!result && <Pressable accessibilityRole="button" accessibilityLabel="Run PDF preflight and optimize" onPress={() => void processPdf()} disabled={!file} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (!file || pressed) && styles.disabled]}><MaterialCommunityIcons name="tune-variant" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Process PDF</Text></Pressable>}
        <Text accessibilityLiveRegion="polite" style={[styles.note, { color: colors.mutedForeground }]}>This tool performs supported PDF normalization. It does not claim to diagnose every PDF/A, print-production, font, image, or accessibility issue.</Text>
        {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('completed') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}
        <PdfToolResultPanel resultUri={result} filename={result ? `${safeBaseName(file?.name || 'document')}-preflight.pdf` : undefined} mimeType="application/pdf" onClose={reset} onReset={reset} title="PDF processing completed" />
      </ScrollView>}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 }, icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 13 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18 }, pick: { marginHorizontal: 20, marginTop: 14, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }, pickCopy: { flex: 1, marginHorizontal: 12 }, pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 }, pickDetail: { fontSize: 11 }, info: { marginHorizontal: 20, marginTop: 14, borderWidth: 1, borderRadius: 14, padding: 12 }, infoLabel: { fontSize: 9, letterSpacing: 1.2, fontFamily: 'Inter_700Bold', marginBottom: 3 }, infoValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' }, primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, note: { marginHorizontal: 20, marginTop: 14, fontSize: 11, lineHeight: 17 }, status: { marginHorizontal: 20, marginTop: 16, fontSize: 11, lineHeight: 17 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 }, loadingText: { fontSize: 13, lineHeight: 19, textAlign: 'center' }, pressed: { opacity: 0.75 }, disabled: { opacity: 0.5 } });

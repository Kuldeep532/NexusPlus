import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { preparePdfOutputPath } from '@/features/pdf-native/pdfPageOperations';
import { convertOfficeDocumentWithExistingGotenberg } from '@/features/pdf-word/pdfWordConversion';
import { PdfToolResultPanel } from '@/features/pdf-native/PdfToolResultPanel';

type PickedFile = { uri: string; name: string };

function safeBaseName(name: string): string {
  return name.replace(/\.[^.]+$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document';
}

export default function PdfGotenbergScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  async function pickFile() {
    setStatus('');
    setResult(null);
    const picked = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'application/vnd.oasis.opendocument.text',
        'text/html',
        'text/markdown',
        'text/plain',
      ],
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setFile({ uri: asset.uri, name: asset.name || 'document' });
    setStatus('Document selected.');
  }

  async function convert() {
    if (!file) {
      setStatus('Choose a document first.');
      return;
    }
    setBusy(true);
    setResult(null);
    setStatus('Converting document to PDF using the existing Gotenberg service…');
    try {
      const outputName = `${safeBaseName(file.name)}.pdf`;
      const outputPath = await preparePdfOutputPath('Gotenberg PDF Tool', outputName);
      const uri = await convertOfficeDocumentWithExistingGotenberg(file.uri, outputName);
      setResult(uri);
      setStatus('Conversion completed. PDF is ready to save/share.');
      void outputPath;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Conversion could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setStatus('');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Gotenberg PDF Tool' }} />
      {busy ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Converting document</Text>
          <Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="file-pdf-box" size={29} color={colors.primary} /></View>
            <View style={styles.copy}>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Gotenberg PDF Tool</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create a PDF with the existing Gotenberg service already configured in Nexus Plus. No new Gotenberg URL is used.</Text>
            </View>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Choose document" accessibilityHint="Select a supported document to convert to PDF." onPress={() => void pickFile()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <Feather name="file-plus" size={20} color={colors.primary} />
            <View style={styles.pickCopy}>
              <Text style={[styles.pickTitle, { color: colors.foreground }]}>Choose document</Text>
              <Text numberOfLines={1} style={[styles.pickDetail, { color: colors.mutedForeground }]}>{file?.name || 'Select a supported document'}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          {!!file && !result && (
            <View style={[styles.info, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>OUTPUT</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>PDF document</Text>
            </View>
          )}

          {!result && (
            <Pressable accessibilityRole="button" accessibilityLabel="Convert document to PDF" onPress={() => void convert()} disabled={!file} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (!file || pressed) && styles.disabled]}>
              <MaterialCommunityIcons name="file-pdf-box" size={19} color={colors.primaryForeground} />
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Create PDF</Text>
            </Pressable>
          )}

          {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('completed') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}

          <PdfToolResultPanel resultUri={result} filename={result ? `${safeBaseName(file?.name || 'document')}.pdf` : undefined} mimeType="application/pdf" onClose={reset} onReset={reset} title="PDF created successfully" />
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
  pick: { marginHorizontal: 20, marginTop: 14, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  pickCopy: { flex: 1, marginHorizontal: 12 },
  pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  pickDetail: { fontSize: 11 },
  info: { marginHorizontal: 20, marginTop: 14, borderWidth: 1, borderRadius: 14, padding: 12 },
  infoLabel: { fontSize: 9, letterSpacing: 1.2, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  infoValue: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  status: { marginHorizontal: 20, marginTop: 16, fontSize: 11, lineHeight: 17 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 },
  loadingText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
});

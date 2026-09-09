import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { splitPdfWithNativeEngine } from '@/features/pdf-native/pdfPageOperations';

type PdfInput = { uri: string; name: string };

export default function SplitPdfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pdf, setPdf] = useState<PdfInput | null>(null);
  const [ranges, setRanges] = useState('1-3');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [outputs, setOutputs] = useState<string[]>([]);

  async function pickPdf() {
    setStatus('');
    setOutputs([]);
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    setPdf({ uri: result.assets[0].uri, name: result.assets[0].name || 'document.pdf' });
    setStatus('PDF selected. Enter one or more page ranges, such as 1-3, 5, 8-10.');
  }

  async function split() {
    if (!pdf) { setStatus('Select a PDF first.'); return; }
    const pageRanges = ranges.split(',').map((item) => item.trim()).filter(Boolean);
    if (!pageRanges.length) { setStatus('Enter at least one page range.'); return; }
    setBusy(true);
    setOutputs([]);
    setStatus('Preparing PDF split…');
    try {
      const directory = `${FileSystem.cacheDirectory || ''}nexus-pdf-split-${Date.now()}/`;
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      const result = await splitPdfWithNativeEngine(pdf.uri, directory, pageRanges);
      setOutputs(result);
      setStatus(`Created ${result.length} split PDF${result.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'PDF split is not available in this build yet.');
    } finally {
      setBusy(false);
    }
  }

  async function shareOutput(uri: string) {
    try {
      if (!(await Sharing.isAvailableAsync())) return;
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share split PDF' });
    } catch {
      Alert.alert('Share unavailable', 'The split PDF could not be shared.');
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Split PDF' }} />
      {busy ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Splitting PDF</Text>
          <Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="content-cut" size={29} color={colors.primary} /></View>
            <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Split PDF</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Cut a PDF into separate documents using page ranges.</Text></View>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'} onPress={() => void pickPdf()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <Feather name="file-plus" size={20} color={colors.primary} />
            <View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? 'Ready to split' : 'Select a local PDF file'}</Text></View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
          <Text style={[styles.label, { color: colors.foreground }]}>Page ranges</Text>
          <TextInput accessibilityLabel="Page ranges" accessibilityHint="Enter ranges separated by commas, for example 1-3, 5, 8-10" value={ranges} onChangeText={setRanges} autoCapitalize="none" autoCorrect={false} placeholder="1-3, 5, 8-10" placeholderTextColor={colors.mutedForeground} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Each range becomes a separate PDF. Example: 1-3, 6-8 creates two output PDFs.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Split PDF" onPress={() => void split()} disabled={!pdf} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (pressed || !pdf) && styles.disabled]}>
            <MaterialCommunityIcons name="content-cut" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Split PDF</Text>
          </Pressable>
          {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('Created') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}
          {outputs.length > 0 && <View style={styles.outputs}>{outputs.map((uri, index) => <View key={uri} style={[styles.output, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.outputTitle, { color: colors.foreground }]}>Part {index + 1}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Share split PDF part ${index + 1}`} onPress={() => void shareOutput(uri)}><Feather name="share-2" size={18} color={colors.primary} /></Pressable></View>)}</View>}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 22 }, icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 13 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18 }, pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }, pickCopy: { flex: 1, marginHorizontal: 12 }, pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 }, pickDetail: { fontSize: 11 }, label: { marginHorizontal: 20, marginTop: 20, marginBottom: 8, fontSize: 12, fontFamily: 'Inter_700Bold' }, input: { marginHorizontal: 20, minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 }, hint: { marginHorizontal: 20, marginTop: 8, fontSize: 11, lineHeight: 17 }, primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, status: { marginHorizontal: 20, marginTop: 15, fontSize: 11, lineHeight: 17 }, outputs: { marginHorizontal: 20, marginTop: 15, gap: 8 }, output: { minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, outputTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 }, loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 }, loadingText: { textAlign: 'center', fontSize: 13, lineHeight: 19 }, pressed: { opacity: 0.74 }, disabled: { opacity: 0.5 } });

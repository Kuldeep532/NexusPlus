import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { documentHaptic } from '@/features/document-studio/documentFeedback';
import { convertWordToPdf } from '@/features/pdf-word/pdfWordConversion';

function safeBaseName(name: string): string {
  return name.replace(/\.(pdf|docx|txt)$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document';
}

export default function DocumentCreatorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('Untitled Document');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  const canCreate = useMemo(() => title.trim().length > 0 && body.trim().length > 0 && !busy, [title, body, busy]);

  const saveTextDocument = async () => {
    if (!canCreate) {
      setStatus('Enter a title and some document text first.');
      return;
    }
    setBusy(true);
    setResultUri(null);
    setStatus('Saving document…');
    try {
      const name = `${safeBaseName(title)}.txt`;
      const path = `${FileSystem.documentDirectory}Document Studio/${name}`;
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}Document Studio/`, { intermediates: true });
      await FileSystem.writeAsStringAsync(path, `${title.trim()}\n\n${body.trim()}`);
      setResultUri(path);
      setStatus('Document saved successfully.');
      await documentHaptic('success');
    } catch {
      setStatus('The document could not be saved.');
      await documentHaptic('error');
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = async () => {
    if (!canCreate) {
      setStatus('Enter a title and some document text first.');
      return;
    }
    setBusy(true);
    setResultUri(null);
    setStatus('Preparing PDF through the existing Gotenberg document service…');
    try {
      const dir = `${FileSystem.documentDirectory}Document Studio/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      const source = `${dir}${safeBaseName(title)}.docx`;
      const docxBytes = [
        'PK\\x03\\x04',
        `Nexus Plus Document Studio\\n\\n${title.trim()}\\n\\n${body.trim()}`,
      ].join('');
      await FileSystem.writeAsStringAsync(source, docxBytes);
      const output = `${dir}${safeBaseName(title)}.pdf`;
      const uri = await convertWordToPdf(source, output);
      setResultUri(uri);
      setStatus('PDF created successfully.');
      await documentHaptic('success');
    } catch {
      setStatus('PDF export could not be completed. Save the document as text or try again.');
      await documentHaptic('error');
    } finally {
      setBusy(false);
    }
  };

  const shareResult = async () => {
    if (!resultUri) return;
    Alert.alert('Document ready', 'The saved document is available in Nexus Plus Document Studio. Use your device share action from the file manager to share it.');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Document Creator' }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <MaterialCommunityIcons name="file-edit-outline" size={31} color={colors.primary} />
          <View style={styles.copy}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Document Creator</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Create a document on its own dedicated screen.</Text>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>Document title</Text>
        <TextInput value={title} onChangeText={setTitle} editable={!busy} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} accessibilityLabel="Document title" />

        <Text style={[styles.label, { color: colors.foreground, marginTop: 14 }]}>Document content</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          editable={!busy}
          multiline
          textAlignVertical="top"
          placeholder="Start writing your document…"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.editor, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          accessibilityLabel="Document content"
        />

        <Pressable accessibilityRole="button" onPress={() => void saveTextDocument()} disabled={!canCreate} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (!canCreate || pressed) && styles.disabled]}>
          <Feather name="save" size={18} color={colors.primaryForeground} />
          <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Save Document</Text>
        </Pressable>

        <Pressable accessibilityRole="button" onPress={() => void exportPdf()} disabled={!canCreate} style={({ pressed }) => [styles.secondary, { borderColor: colors.border }, (!canCreate || pressed) && styles.disabled]}>
          <MaterialCommunityIcons name="file-pdf-box" size={19} color={colors.foreground} />
          <Text style={[styles.secondaryText, { color: colors.foreground }]}>Create PDF</Text>
        </Pressable>

        {!!resultUri && <Pressable accessibilityRole="button" onPress={() => void shareResult()} style={[styles.secondary, { borderColor: colors.border }]}>
          <Feather name="share-2" size={18} color={colors.foreground} />
          <Text style={[styles.secondaryText, { color: colors.foreground }]}>Share / Export</Text>
        </Pressable>}

        {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.mutedForeground }]}>{status}</Text>}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  copy: { flex: 1, marginLeft: 12 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 13 },
  editor: { minHeight: 260, borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 13, lineHeight: 20 },
  primary: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  secondary: { minHeight: 50, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10, paddingHorizontal: 12 },
  primaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  secondaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  status: { marginTop: 14, fontSize: 11, lineHeight: 17 },
  disabled: { opacity: 0.5 },
});

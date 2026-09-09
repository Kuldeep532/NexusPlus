import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { PdfNativeBridge } from '@/features/pdf-native/PdfNativeBridge';
import { unlockPdfWithEngine } from '@/features/protect-pdf/protectPdfEngine';
import type { ProtectPdfInput, ProtectPdfResult } from '@/features/protect-pdf/protectPdfTypes';
import { savePdfPasswordToVault } from '@/features/protect-pdf/protect-pdf-vault';

type Tab = 'lock' | 'unlock';

function safeBaseName(name: string): string {
  return name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document';
}

export default function LockUnlockPdfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('lock');
  const [pdf, setPdf] = useState<ProtectPdfInput | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProtectPdfResult | null>(null);
  const [status, setStatus] = useState('');

  async function cleanup(uri?: string) {
    if (!uri || !uri.startsWith(FileSystem.cacheDirectory ?? '___never___')) return;
    try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch { /* best effort */ }
  }

  useEffect(() => () => { void cleanup(result?.uri); }, [result?.uri]);

  async function pickPdf() {
    await cleanup(result?.uri);
    setResult(null);
    setPassword('');
    setConfirmPassword('');
    setStatus('');
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    setPdf({ uri: asset.uri, name: asset.name || 'document.pdf' });
    setStatus(`Selected ${asset.name || 'PDF'}.`);
  }

  function switchTab(nextTab: Tab) {
    void cleanup(result?.uri);
    setTab(nextTab);
    setPdf(null);
    setPassword('');
    setConfirmPassword('');
    setResult(null);
    setStatus('');
  }

  async function processPdf() {
    if (!pdf) { setStatus('Select a PDF first.'); return; }
    if (tab === 'lock') {
      if (password.length < 8) { setStatus('Password must be at least 8 characters.'); return; }
      if (password !== confirmPassword) { setStatus('Passwords do not match.'); return; }
    } else if (!password) {
      setStatus('Enter the current PDF password.'); return;
    }
    setBusy(true);
    setResult(null);
    setStatus(tab === 'lock' ? 'Locking PDF…' : 'Unlocking PDF…');
    try {
      let output: ProtectPdfResult;
      if (tab === 'lock') {
        const base = FileSystem.cacheDirectory;
        if (!base) throw new Error('App cache storage is unavailable.');
        const outputPath = `${base}nexus-pdf-${Date.now()}-${safeBaseName(pdf.name)}-locked.pdf`;
        await PdfNativeBridge.protect(pdf.uri, outputPath, password);
        output = { uri: outputPath, name: `${safeBaseName(pdf.name)}-locked.pdf` };
        try { await savePdfPasswordToVault(pdf.name, password); } catch { /* best effort */ }
      } else {
        output = await unlockPdfWithEngine(pdf, password);
      }
      setResult(output);
      setPassword('');
      setConfirmPassword('');
      setStatus(tab === 'lock' ? 'PDF locked successfully.' : 'PDF unlocked successfully.');
    } catch (error) {
      setPassword('');
      setConfirmPassword('');
      setStatus(error instanceof Error ? error.message : `Could not ${tab} this PDF.`);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!result) return;
    try {
      if (!(await Sharing.isAvailableAsync())) return;
      await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Share PDF' });
    } catch {
      Alert.alert('Share unavailable', 'The PDF could not be shared.');
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'Lock & Unlock PDF' }} />
      {busy ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>{tab === 'lock' ? 'Locking PDF' : 'Unlocking PDF'}</Text>
          <Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>{status}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="shield-lock-outline" size={29} color={colors.primary} /></View>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Lock & Unlock PDF</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Password-protect a PDF or remove its existing protection.</Text>
            </View>
          </View>
          <View accessibilityRole="tablist" style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'lock' }} accessibilityLabel="Lock PDF tab" onPress={() => switchTab('lock')} style={[styles.tab, { backgroundColor: tab === 'lock' ? colors.primary : 'transparent' }]}>
              <Feather name="lock" size={17} color={tab === 'lock' ? colors.primaryForeground : colors.foreground} /><Text style={[styles.tabText, { color: tab === 'lock' ? colors.primaryForeground : colors.foreground }]}>Lock PDF</Text>
            </Pressable>
            <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'unlock' }} accessibilityLabel="Unlock PDF tab" onPress={() => switchTab('unlock')} style={[styles.tab, { backgroundColor: tab === 'unlock' ? colors.primary : 'transparent' }]}>
              <Feather name="unlock" size={17} color={tab === 'unlock' ? colors.primaryForeground : colors.foreground} /><Text style={[styles.tabText, { color: tab === 'unlock' ? colors.primaryForeground : colors.foreground }]}>Unlock PDF</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'} onPress={() => void pickPdf()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <Feather name="file-plus" size={20} color={colors.primary} />
            <View style={styles.pickCopy}><Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? 'Ready for this operation' : 'Select a local PDF file'}</Text></View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
          {pdf && !result && tab === 'lock' && <>
            <Text style={[styles.label, { color: colors.foreground }]}>New password</Text>
            <TextInput accessibilityLabel="New PDF password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
            <Text style={[styles.label, { color: colors.foreground }]}>Confirm new password</Text>
            <TextInput accessibilityLabel="Confirm new PDF password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>Uses the existing native PDF protection mechanism. Passwords are not logged.</Text>
          </>}
          {pdf && !result && tab === 'unlock' && <>
            <Text style={[styles.label, { color: colors.foreground }]}>Current password</Text>
            <TextInput accessibilityLabel="Current PDF password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>Enter the current password to remove PDF protection. The password is held only in memory for this operation.</Text>
          </>}
          {pdf && !result && <Pressable accessibilityRole="button" accessibilityLabel={tab === 'lock' ? 'Lock PDF' : 'Unlock PDF'} onPress={() => void processPdf()} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
            <Feather name={tab === 'lock' ? 'lock' : 'unlock'} size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{tab === 'lock' ? 'Lock PDF' : 'Unlock PDF'}</Text>
          </Pressable>}
          {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('successfully') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}
          {result && <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Share PDF" onPress={() => void share()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="share-2" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Share</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Start another PDF operation" onPress={() => { void cleanup(result.uri); setPdf(null); setResult(null); setPassword(''); setConfirmPassword(''); setStatus(''); }} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="refresh-cw" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Another PDF</Text></Pressable>
          </View>}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerIcon: { width: 56, height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 14 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 12, lineHeight: 18 },
  tabs: { marginHorizontal: 20, borderWidth: 1, borderRadius: 15, padding: 4, flexDirection: 'row', gap: 4, marginBottom: 18 },
  tab: { flex: 1, minHeight: 48, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  pickCopy: { flex: 1, marginHorizontal: 12 },
  pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  pickDetail: { fontSize: 11 },
  label: { marginHorizontal: 20, marginTop: 19, marginBottom: 8, fontSize: 12, fontFamily: 'Inter_700Bold' },
  input: { marginHorizontal: 20, minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 },
  hint: { marginHorizontal: 20, marginTop: 9, fontSize: 11, lineHeight: 17 },
  primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  status: { marginHorizontal: 20, marginTop: 15, fontSize: 11, lineHeight: 17 },
  actions: { paddingHorizontal: 20, marginTop: 14, gap: 10 },
  action: { minHeight: 52, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 },
  loadingText: { textAlign: 'center', fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.75 },
});

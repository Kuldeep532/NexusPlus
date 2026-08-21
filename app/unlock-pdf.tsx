import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { unlockPdfWithEngine } from '@/features/protect-pdf/protectPdfEngine';
import type { ProtectPdfInput, ProtectPdfResult } from '@/features/protect-pdf/protectPdfTypes';

export default function UnlockPdfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pdf, setPdf] = useState<ProtectPdfInput | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProtectPdfResult | null>(null);
  const [status, setStatus] = useState('');

  const cleanupResult = async (uri?: string) => {
    if (!uri || !uri.startsWith(FileSystem.cacheDirectory ?? '___never___')) return;
    try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch { /* best effort */ }
  };

  useEffect(() => () => { void cleanupResult(result?.uri); setPassword(''); }, [result?.uri]);

  async function pickPdf() {
    setStatus('');
    await cleanupResult(result?.uri);
    setResult(null);
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: false, copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    setPdf({ uri: picked.assets[0].uri, name: picked.assets[0].name || 'document.pdf' });
    setPassword('');
    setStatus('PDF selected. Enter the current password.');
  }

  async function unlock() {
    if (!pdf || !password) {
      setStatus('Select a PDF and enter its password.');
      return;
    }
    setBusy(true);
    await cleanupResult(result?.uri);
    setResult(null);
    setStatus('Removing PDF password protection…');
    try {
      const unlocked = await unlockPdfWithEngine(pdf, password);
      setResult(unlocked);
      setPassword('');
      setStatus('PDF unlocked successfully.');
    } catch {
      setPassword('');
      setStatus('Could not unlock this PDF.');
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!result) return;
    try {
      if (!(await Sharing.isAvailableAsync())) return;
      await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Share unlocked PDF' });
    } catch {
      Alert.alert('Share unavailable', 'The unlocked PDF could not be shared.');
    }
  }

  async function reset() {
    await cleanupResult(result?.uri);
    setPdf(null);
    setPassword('');
    setResult(null);
    setStatus('');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'Unlock PDF' }} />
      {busy ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text accessibilityRole="header" style={[styles.loadingTitle, { color: colors.foreground }]}>Unlocking PDF</Text>
          <Text accessibilityLiveRegion="polite" style={[styles.loadingText, { color: colors.mutedForeground }]}>Validating the password and removing PDF protection.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="lock-open-outline" size={28} color={colors.primary} /></View>
            <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Unlock PDF</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Remove password protection after entering the correct password.</Text></View>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'} onPress={() => void pickPdf()} style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <Feather name="file-plus" size={20} color={colors.primary} />
            <View style={styles.pickText}><Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose password-protected PDF'}</Text><Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? 'Ready to unlock' : 'Select a local PDF file'}</Text></View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          {pdf && !result && (
            <>
              <Text style={[styles.label, { color: colors.foreground }]}>Current password</Text>
              <TextInput accessibilityLabel="Current PDF password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="password" style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>The password is only held in memory for this operation and is not written to logs or ordinary storage.</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Unlock PDF" onPress={() => void unlock()} disabled={!password} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, (pressed || !password) && styles.disabled]}>
                <MaterialCommunityIcons name="lock-open-outline" size={19} color={colors.primaryForeground} /><Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Unlock PDF</Text>
              </Pressable>
            </>
          )}

          {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: status.includes('successfully') ? colors.primary : colors.mutedForeground }]}>{status}</Text>}

          {result && (
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Share unlocked PDF" onPress={() => void share()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="share-2" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Share</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Unlock another PDF" onPress={() => void reset()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="refresh-cw" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Unlock Another</Text></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={() => void reset()} style={[styles.action, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="check" size={18} color={colors.primary} /><Text style={[styles.actionText, { color: colors.foreground }]}>Done</Text></Pressable>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 22 },
  icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 13 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  pick: { marginHorizontal: 20, minHeight: 72, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  pickText: { flex: 1, marginHorizontal: 12 },
  pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  pickDetail: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  label: { marginHorizontal: 20, marginTop: 20, marginBottom: 8, fontSize: 12, fontFamily: 'Inter_700Bold' },
  input: { marginHorizontal: 20, minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 14 },
  hint: { marginHorizontal: 20, marginTop: 8, fontSize: 11, lineHeight: 17 },
  primary: { marginHorizontal: 20, marginTop: 16, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  status: { marginHorizontal: 20, marginTop: 16, fontSize: 11, lineHeight: 17 },
  actions: { paddingHorizontal: 20, marginTop: 14, gap: 10 },
  action: { minHeight: 50, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  loadingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 8 },
  loadingText: { textAlign: 'center', fontSize: 13, lineHeight: 19 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
});

import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { savePdfPasswordToVault } from '@/features/protect-pdf/protectPdfVault';
import type { ProtectPdfInput, ProtectPdfState, ProtectPdfResult } from '@/features/protect-pdf/protectPdfTypes';

/**
 * The actual PDF encryption adapter is intentionally isolated from this screen.
 * It must be implemented with a native-compatible PDF security engine before
 * shipping this workflow. The current project dependency set has no PDF
 * password-encryption engine, so this screen never pretends to create a
 * password-protected PDF when encryption is unavailable.
 */
async function protectPdfWithEngine(_input: ProtectPdfInput, _password: string): Promise<ProtectPdfResult> {
  throw new Error('PDF encryption engine is not configured yet. Add a native-compatible PDF security module before enabling protection.');
}

export default function ProtectPdfScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<ProtectPdfState>('idle');
  const [pdf, setPdf] = useState<ProtectPdfInput | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [result, setResult] = useState<ProtectPdfResult | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    return () => {
      setPassword('');
      setConfirmPassword('');
    };
  }, []);

  const filenameWithoutExtension = useMemo(
    () => pdf?.name.replace(/\.pdf$/i, '') || 'Protected PDF',
    [pdf],
  );

  const pickPdf = async () => {
    setStatus('');
    setResult(null);
    const picked = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      multiple: false,
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return;
    setPdf({ uri: picked.assets[0].uri, name: picked.assets[0].name || 'document.pdf' });
    setPassword('');
    setConfirmPassword('');
    setState('selecting');
    setStatus('PDF selected. Enter a password to protect it.');
  };

  const validatePassword = () => {
    if (password.length < 8) return 'Use at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const protect = async () => {
    if (!pdf) return;
    const validationError = validatePassword();
    if (validationError) {
      setStatus(validationError);
      return;
    }

    setState('processing');
    setStatus('Protecting PDF…');
    setResult(null);

    try {
      const protectedPdf = await protectPdfWithEngine(pdf, password);
      setResult(protectedPdf);
      setState('completed');
      setStatus('PDF protected successfully.');
    } catch (error) {
      setState('error');
      setStatus(error instanceof Error ? error.message : 'Could not protect this PDF.');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const share = async () => {
    if (!result || !(await Sharing.isAvailableAsync())) return;
    await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf', dialogTitle: 'Share protected PDF' });
  };

  const savePassword = async () => {
    if (!password) {
      Alert.alert('Password unavailable', 'For your security, the password is no longer retained after processing failed or the screen was reset.');
      return;
    }

    try {
      await savePdfPasswordToVault(filenameWithoutExtension, password);
      Alert.alert('Saved to Nexus Vault', `${filenameWithoutExtension} password was saved securely in the Nexus Vault.`);
      setPassword('');
      setConfirmPassword('');
    } catch {
      Alert.alert('Could not save password', 'The encrypted Nexus Vault could not be updated. Your PDF was not changed.');
    }
  };

  const clearAndRegenerate = () => {
    setPdf(null);
    setResult(null);
    setPassword('');
    setConfirmPassword('');
    setStatus('');
    setState('idle');
  };

  const onBack = () => {
    clearAndRegenerate();
    router.back();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'Protect PDF' }} />
      {state === 'processing' ? (
        <View style={[styles.processing, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
          <View style={[styles.processingIcon, { backgroundColor: colors.secondary }]}> 
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text accessibilityRole="header" style={[styles.processingTitle, { color: colors.foreground }]}>Protecting PDF</Text>
          <Text accessibilityLiveRegion="polite" style={[styles.processingText, { color: colors.mutedForeground }]}>Encrypting your document. Please wait.</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}> 
              <MaterialCommunityIcons name="shield-lock" size={28} color={colors.primary} />
            </View>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Protect PDF</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Add password protection before you share or save a sensitive document.</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={pdf ? `Selected PDF ${pdf.name}` : 'Choose PDF'}
            onPress={pickPdf}
            disabled={state === 'processing'}
            style={({ pressed }) => [styles.pick, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
          >
            <Feather name="file-plus" size={20} color={colors.primary} />
            <View style={styles.pickCopy}>
              <Text style={[styles.pickTitle, { color: colors.foreground }]}>{pdf ? pdf.name : 'Choose PDF'}</Text>
              <Text style={[styles.pickDetail, { color: colors.mutedForeground }]}>{pdf ? 'Ready to protect' : 'Select a local PDF file'}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>

          {pdf && state !== 'completed' && state !== 'error' && (
            <>
              <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
              <TextInput
                accessibilityLabel="PDF password"
                accessibilityHint="Enter at least 8 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Confirm password</Text>
              <TextInput
                accessibilityLabel="Confirm PDF password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              />

              <Text style={[styles.hint, { color: colors.mutedForeground }]}>The password is kept only in memory for this workflow. It is not written to logs or ordinary app storage.</Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Protect PDF"
                onPress={protect}
                disabled={!password || !confirmPassword}
                style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, (pressed || !password || !confirmPassword) && styles.disabled]}
              >
                <MaterialCommunityIcons name="shield-lock" size={19} color={colors.primaryForeground} />
                <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Protect PDF</Text>
              </Pressable>
            </>
          )}

          {!!status && state !== 'processing' && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: state === 'error' ? colors.destructive : colors.mutedForeground }]}>{status}</Text>}

          {state === 'completed' && result && (
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" accessibilityLabel="Share protected PDF" onPress={share} style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="share-2" size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>Share</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Save password to Nexus Vault" onPress={savePassword} style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="shield-key" size={19} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>Save Password to Nexus Vault</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Protect another PDF" onPress={clearAndRegenerate} style={[styles.actionButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Feather name="refresh-cw" size={18} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.foreground }]}>Protect Another</Text>
              </Pressable>
            </View>
          )}

          {(state === 'error' || state === 'completed') && (
            <Pressable accessibilityRole="button" accessibilityLabel="Go back to PDF tools" onPress={onBack} style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="arrow-left" size={18} color={colors.foreground} />
              <Text style={[styles.actionText, { color: colors.foreground }]}>Back to PDF Tools</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 22 },
  icon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 13 },
  title: { fontSize: 28, lineHeight: 34, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  pick: { marginHorizontal: 20, minHeight: 72, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  pickCopy: { flex: 1, marginHorizontal: 12 },
  pickTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  pickDetail: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  label: { marginHorizontal: 20, fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 8, marginTop: 8 },
  input: { marginHorizontal: 20, minHeight: 48, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  hint: { marginHorizontal: 20, fontSize: 11, lineHeight: 17, marginBottom: 15, fontFamily: 'Inter_400Regular' },
  primaryButton: { marginHorizontal: 20, minHeight: 52, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 8 },
  primaryText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  status: { marginHorizontal: 20, marginTop: 15, fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  actions: { marginTop: 15, gap: 10, paddingHorizontal: 20 },
  actionButton: { minHeight: 52, borderRadius: 15, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  secondaryButton: { marginHorizontal: 20, minHeight: 50, borderRadius: 14, borderWidth: 1, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  processing: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  processingIcon: { width: 92, height: 92, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  processingTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  processingText: { fontSize: 13, lineHeight: 19, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
});

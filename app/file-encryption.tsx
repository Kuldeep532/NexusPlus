import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { FileEncryptionNative } from '@/features/file-encryption/FileEncryptionNative';

export default function FileEncryptionScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<'lock' | 'unlock'>('lock');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const chooseFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (!result.canceled) setFile(result.assets[0]);
  };

  const run = async () => {
    if (!file) return Alert.alert('Select a file', 'Choose a file before continuing.');
    if (password.length < 8) return Alert.alert('Password too short', 'Use at least 8 characters.');
    if (!FileEncryptionNative.isAvailable()) return Alert.alert('Unavailable', 'The native encryption engine is not available in this development build.');

    setBusy(true);
    try {
      const base = FileSystem.cacheDirectory ?? file.uri.substring(0, file.uri.lastIndexOf('/') + 1);
      if (tab === 'lock') {
        const output = `${base}${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}.nexusenc`;
        await FileEncryptionNative.lockFile(file.uri, output, password);
        Alert.alert('File locked', `Encrypted file created as ${output.split('/').pop()}.`);
      } else {
        const output = `${base}unlocked-${file.name.replace(/\.nexusenc$/i, '')}`;
        const result = await FileEncryptionNative.unlockFile(file.uri, output, password);
        if (result.startsWith('ERROR:')) throw new Error('Wrong password or corrupted file.');
        Alert.alert('File unlocked', `Recovered file: ${result.split('/').pop()}`);
      }
    } catch (error) {
      Alert.alert('Operation failed', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="file-lock" size={30} color={colors.primary} /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>File Encryption</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Lock any local file with a password-protected Nexus encrypted container.</Text>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'lock' }} onPress={() => setTab('lock')} style={[styles.tab, tab === 'lock' && { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="lock" size={18} color={tab === 'lock' ? colors.primaryForeground : colors.foreground} />
          <Text style={[styles.tabText, { color: tab === 'lock' ? colors.primaryForeground : colors.foreground }]}>Lock</Text>
        </Pressable>
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === 'unlock' }} onPress={() => setTab('unlock')} style={[styles.tab, tab === 'unlock' && { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="lock-open-variant" size={18} color={tab === 'unlock' ? colors.primaryForeground : colors.foreground} />
          <Text style={[styles.tabText, { color: tab === 'unlock' ? colors.primaryForeground : colors.foreground }]}>Unlock</Text>
        </Pressable>
      </View>

      <Pressable onPress={chooseFile} style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="file-upload-outline" size={25} color={colors.primary} />
        <View style={styles.selectorCopy}>
          <Text style={[styles.selectorTitle, { color: colors.foreground }]}>{file?.name ?? (tab === 'lock' ? 'Select any file' : 'Select .nexusenc file')}</Text>
          <Text style={[styles.selectorHint, { color: colors.mutedForeground }]}>MP3, MP4, PDF, image, document, archive and other local files.</Text>
        </View>
      </Pressable>

      <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
      <TextInput value={password} onChangeText={setPassword} placeholder="Enter at least 8 characters" placeholderTextColor={colors.mutedForeground} secureTextEntry autoCapitalize="none" autoCorrect={false} style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]} />

      <Pressable disabled={busy} onPress={run} style={[styles.action, { backgroundColor: colors.primary }, busy && styles.disabled]}>
        <MaterialCommunityIcons name={tab === 'lock' ? 'lock-check' : 'lock-open-check'} size={20} color={colors.primaryForeground} />
        <Text style={[styles.actionText, { color: colors.primaryForeground }]}>{busy ? 'Processing…' : tab === 'lock' ? 'Lock File' : 'Unlock File'}</Text>
      </Pressable>

      <View style={[styles.security, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.securityTitle, { color: colors.foreground }]}>Security</Text>
        <Text style={[styles.securityText, { color: colors.mutedForeground }]}>AES-256-GCM authenticated encryption, PBKDF2-SHA256 password derivation, random per-file salt and nonce. Passwords are not stored by Nexus Plus.</Text>
        <Text style={[styles.securityText, { color: colors.mutedForeground }]}>Files remain local during encryption/decryption unless you explicitly share or export them.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 36, gap: 14 },
  hero: { borderRadius: 18, borderWidth: 1, padding: 18, gap: 8 },
  heroIcon: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 15, borderWidth: 1, gap: 4 },
  tab: { flex: 1, minHeight: 46, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  selector: { minHeight: 78, borderRadius: 16, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectorCopy: { flex: 1 },
  selectorTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  selectorHint: { fontSize: 10, lineHeight: 15, marginTop: 3, fontFamily: 'Inter_400Regular' },
  label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 2 },
  input: { minHeight: 50, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontSize: 13, fontFamily: 'Inter_400Regular' },
  action: { minHeight: 50, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  disabled: { opacity: 0.55 },
  security: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 7 },
  securityTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  securityText: { fontSize: 10.5, lineHeight: 16, fontFamily: 'Inter_400Regular' },
});

import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { FileManagerEntry } from '../FileManagerTypes';
import { decryptFile, encryptFile } from '../FileManagerSecureService';

export function FileManagerSecurePanel({ onEncrypt, onDecrypt }: { onEncrypt?: (entry: FileManagerEntry) => void; onDecrypt?: (entry: FileManagerEntry) => void }) {
  const colors = useColors();
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [selected, setSelected] = useState<FileManagerEntry | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const chooseViaCallback = () => {
    if (!selected) return Alert.alert('Select a file', 'Choose a file from Browse first.');
    if (mode === 'encrypt') onEncrypt?.(selected); else onDecrypt?.(selected);
  };

  const run = async () => {
    if (!selected) return Alert.alert('Select a file', 'Choose a file before continuing.');
    if (password.length < 8) return Alert.alert('Password too short', 'Use a password of at least 8 characters.');
    setBusy(true);
    try {
      const output = mode === 'encrypt'
        ? await encryptFile(selected.uri, selected.name, password)
        : await decryptFile(selected.uri, selected.name, password);
      Alert.alert(mode === 'encrypt' ? 'File encrypted' : 'File decrypted', output.split('/').pop() ?? output);
      setPassword('');
    } catch (error) {
      Alert.alert('Operation failed', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="shield" size={23} color={colors.primary} /></View>
        <Text style={[styles.title, { color: colors.foreground }]}>Secure files</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>Encryption and decryption now belong to File Manager instead of the generic utility area.</Text>
      </View>

      <View style={styles.modeRow}>
        {(['encrypt', 'decrypt'] as const).map((item) => {
          const active = mode === item;
          return <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => { setMode(item); setSelected(null); }} style={[styles.mode, { borderColor: colors.border }, active && { backgroundColor: colors.primary }]}><Feather name={item === 'encrypt' ? 'lock' : 'unlock'} size={17} color={active ? colors.primaryForeground : colors.primary} /><Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontSize: 11, fontWeight: '700' }}>{item === 'encrypt' ? 'Encrypt' : 'Decrypt'}</Text></Pressable>;
        })}
      </View>

      <Pressable accessibilityRole="button" accessibilityLabel="Choose a file from Browse" onPress={chooseViaCallback} style={[styles.selector, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="file-plus" size={21} color={colors.primary} />
        <View style={styles.selectorCopy}>
          <Text style={[styles.selectorTitle, { color: colors.foreground }]}>{selected?.name ?? 'Select file from Browse'}</Text>
          <Text style={[styles.selectorHint, { color: colors.mutedForeground }]}>Pick a local file, then return here to encrypt or decrypt it.</Text>
        </View>
      </Pressable>

      <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
      <TextInput accessibilityLabel="Encryption password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="At least 8 characters" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
      <Pressable disabled={busy || !selected} accessibilityRole="button" accessibilityLabel={mode === 'encrypt' ? 'Encrypt selected file' : 'Decrypt selected file'} onPress={run} style={[styles.run, { backgroundColor: colors.primary }, (!selected || busy) && styles.disabled]}><Feather name={mode === 'encrypt' ? 'lock' : 'unlock'} size={18} color={colors.primaryForeground} /><Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 12 }}>{busy ? 'Processing…' : mode === 'encrypt' ? 'Encrypt file' : 'Decrypt file'}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  hero: { borderRadius: 18, padding: 16, gap: 5 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 10.5, lineHeight: 16 },
  modeRow: { flexDirection: 'row', gap: 8 },
  mode: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  selector: { minHeight: 72, borderRadius: 14, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectorCopy: { flex: 1 },
  selectorTitle: { fontSize: 11.5, fontWeight: '700' },
  selectorHint: { fontSize: 9.5, lineHeight: 14, marginTop: 3 },
  label: { fontSize: 11, fontWeight: '700' },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 12 },
  run: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  disabled: { opacity: 0.5 },
});

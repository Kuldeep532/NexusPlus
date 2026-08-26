import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { FileManagerEntry } from '../FileManagerTypes';
import { decryptFile, encryptFile } from '../FileManagerSecureService';

export function FileManagerSecurePanel({ entries }: { entries?: FileManagerEntry[] }) {
  const colors = useColors();
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [selected, setSelected] = useState<FileManagerEntry | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!selected) return Alert.alert('Select a file', 'Choose a file before continuing.');
    if (password.length < 8) return Alert.alert('Password too short', 'Use at least 8 characters.');
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

  const candidates = entries ?? [];
  return (
    <View style={styles.root}>
      <View style={styles.modeRow}>
        {(['encrypt', 'decrypt'] as const).map((item) => {
          const active = mode === item;
          return <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={() => { setMode(item); setSelected(null); }} style={[styles.mode, { borderColor: colors.border }, active && { backgroundColor: colors.primary }]}><Feather name={item === 'encrypt' ? 'lock' : 'unlock'} size={17} color={active ? colors.primaryForeground : colors.primary} /><Text style={{ color: active ? colors.primaryForeground : colors.foreground, fontSize: 11, fontWeight: '700' }}>{item === 'encrypt' ? 'Encrypt' : 'Decrypt'}</Text></Pressable>;
        })}
      </View>
      <Text style={[styles.label, { color: colors.foreground }]}>Choose a local file</Text>
      <View style={styles.fileList}>
        {candidates.length ? candidates.filter((item) => mode === 'encrypt' ? !item.name.toLowerCase().endsWith('.nexusenc') : item.name.toLowerCase().endsWith('.nexusenc')).slice(0, 8).map((entry) => (
          <Pressable key={entry.id} accessibilityRole="button" accessibilityState={{ selected: selected?.id === entry.id }} accessibilityLabel={`Select ${entry.name}`} onPress={() => setSelected(entry)} style={[styles.file, { backgroundColor: colors.card, borderColor: selected?.id === entry.id ? colors.primary : colors.border }]}><Feather name="file" size={18} color={colors.primary} /><Text numberOfLines={1} style={[styles.fileName, { color: colors.foreground }]}>{entry.name}</Text>{selected?.id === entry.id && <Feather name="check" size={16} color={colors.primary} />}</Pressable>
        )) : <Text style={[styles.empty, { color: colors.mutedForeground }]}>Use Browse to select or return with a file.</Text>}
      </View>
      <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
      <TextInput accessibilityLabel="Encryption password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="At least 8 characters" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
      <Pressable disabled={busy || !selected} accessibilityRole="button" accessibilityLabel={mode === 'encrypt' ? 'Encrypt selected file' : 'Decrypt selected file'} onPress={run} style={[styles.run, { backgroundColor: colors.primary }, (!selected || busy) && styles.disabled]}><Feather name={mode === 'encrypt' ? 'lock' : 'unlock'} size={18} color={colors.primaryForeground} /><Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 12 }}>{busy ? 'Processing…' : mode === 'encrypt' ? 'Encrypt file' : 'Decrypt file'}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  modeRow: { flexDirection: 'row', gap: 8 },
  mode: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  label: { fontSize: 11, fontWeight: '700' },
  fileList: { gap: 7 },
  file: { minHeight: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  fileName: { flex: 1, fontSize: 11 },
  empty: { fontSize: 10.5, lineHeight: 16 },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, fontSize: 12 },
  run: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  disabled: { opacity: 0.5 },
});

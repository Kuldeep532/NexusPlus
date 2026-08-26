import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { FileManagerEntry } from '../FileManagerTypes';

export function FileManagerRenameSheet({ entry, visible, onClose, onRename }: { entry: FileManagerEntry | null; visible: boolean; onClose: () => void; onRename: (entry: FileManagerEntry, name: string) => Promise<void> }) {
  const colors = useColors();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setName(entry?.name ?? ''); setBusy(false); }, [entry, visible]);
  const submit = async () => {
    if (!entry || !name.trim() || name.trim() === entry.name) return;
    setBusy(true);
    try { await onRename(entry, name.trim()); onClose(); } finally { setBusy(false); }
  };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} accessibilityViewIsModal><View style={styles.backdrop}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close rename" /><View style={[styles.sheet, { backgroundColor: colors.background, borderColor: colors.border }]}><View style={styles.handle} /><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Rename</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{entry?.name ?? ''}</Text><TextInput autoFocus value={name} onChangeText={setName} selectTextOnFocus accessibilityLabel="New file name" style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} /><View style={styles.actions}><Pressable accessibilityRole="button" onPress={onClose} style={[styles.cancel, { borderColor: colors.border }]}><Text style={{ color: colors.foreground, fontWeight: '700' }}>Cancel</Text></Pressable><Pressable disabled={busy || !name.trim() || name.trim() === entry?.name} accessibilityRole="button" onPress={submit} style={[styles.confirm, { backgroundColor: colors.primary }, (busy || !name.trim() || name.trim() === entry?.name) && styles.disabled]}><Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>{busy ? 'Saving…' : 'Rename'}</Text></Pressable></View></View></View></Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }, sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 16, paddingBottom: 26 }, handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#888', opacity: 0.45, marginBottom: 14 }, title: { fontSize: 17, fontWeight: '700' }, subtitle: { fontSize: 10, marginTop: 3, marginBottom: 12 }, input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 12 }, actions: { flexDirection: 'row', gap: 9, marginTop: 13 }, cancel: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, confirm: { flex: 1, minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.5 } });

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { Note, NoteCategory } from '../notepadTypes';
import { NoteCategoryPicker } from './NoteCategoryPicker';

export interface NoteDraft { title: string; description: string; content: string; categoryId: string; saveToSecureVault: boolean; }

export function NoteForm({ categories, initial, saving, onSave }: { categories: NoteCategory[]; initial?: Note; saving: boolean; onSave: (draft: NoteDraft) => void }) {
  const colors = useColors();
  const [title, setTitle] = React.useState(initial?.title ?? '');
  const [description, setDescription] = React.useState(initial?.description ?? '');
  const [content, setContent] = React.useState(initial?.content ?? '');
  const [categoryId, setCategoryId] = React.useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [saveToSecureVault, setSaveToSecureVault] = React.useState(false);
  const canSave = useMemo(() => Boolean(title.trim() && content.trim() && categoryId && !saving), [title, content, categoryId, saving]);
  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
      <NoteCategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
      <Text style={[styles.label, { color: colors.foreground }]}>Title</Text>
      <TextInput accessibilityLabel="Note title" value={title} onChangeText={setTitle} placeholder="Note title" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
      <Text style={[styles.label, { color: colors.foreground }]}>Description</Text>
      <TextInput accessibilityLabel="Note description" value={description} onChangeText={setDescription} placeholder="Short description" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
      <Text style={[styles.label, { color: colors.foreground }]}>Note</Text>
      <TextInput accessibilityLabel="Note text" value={content} onChangeText={setContent} placeholder="Write your note..." placeholderTextColor={colors.mutedForeground} multiline textAlignVertical="top" style={[styles.editor, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: saveToSecureVault }} accessibilityLabel="Save to Secure Vault" onPress={() => setSaveToSecureVault((value) => !value)} style={[styles.vaultRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <MaterialCommunityIcons name={saveToSecureVault ? 'checkbox-marked' : 'checkbox-blank-outline'} size={23} color={saveToSecureVault ? colors.primary : colors.mutedForeground} />
        <View style={styles.vaultCopy}><Text style={[styles.vaultTitle, { color: colors.foreground }]}>Save to Secure Vault</Text><Text style={[styles.vaultHint, { color: colors.mutedForeground }]}>Also create an encrypted Secure Note inside the Vault.</Text></View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={initial ? 'Update note' : 'Save note'} disabled={!canSave} onPress={() => onSave({ title: title.trim(), description: description.trim(), content: content.trim(), categoryId, saveToSecureVault })} style={[styles.save, { backgroundColor: canSave ? colors.primary : colors.secondary }]}>
        <Text style={{ color: canSave ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_700Bold' }}>{saving ? 'Saving…' : initial ? 'Update Note' : 'Save Note'}</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({ root: { padding: 20, gap: 9 }, label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 5 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 13 }, editor: { minHeight: 220, borderWidth: 1, borderRadius: 13, padding: 13, fontSize: 14, lineHeight: 20 }, vaultRow: { minHeight: 68, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', marginTop: 6 }, vaultCopy: { flex: 1, marginLeft: 10 }, vaultTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, vaultHint: { fontSize: 11, lineHeight: 16 }, save: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 } });

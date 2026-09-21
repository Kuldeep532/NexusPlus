import React, { useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { useColors } from '@/hooks/useColors';
import type { Note, NoteAttachment, NoteCategory, NoteKind } from '../notepadTypes';
import { NoteCategoryPicker } from './NoteCategoryPicker';

export interface NoteDraft {
  title: string;
  content: string;
  categoryId: string;
  kind: NoteKind;
  attachments: NoteAttachment[];
  saveToSecureVault: boolean;
}

const NOTE_TYPES: Array<{ kind: NoteKind; label: string; icon: string }> = [
  { kind: 'TEXT', label: 'Text Note', icon: 'file-text' },
  { kind: 'IMAGE', label: 'Image Note', icon: 'image' },
  { kind: 'AUDIO', label: 'Audio Note', icon: 'mic' },
  { kind: 'DRAWING', label: 'Drawing Note', icon: 'edit-3' },
];

export function NoteForm({ categories, initial, saving, onSave, onOpenDrawing }: {
  categories: NoteCategory[];
  initial?: Note;
  saving: boolean;
  onSave: (draft: NoteDraft) => void;
  onOpenDrawing?: () => void;
}) {
  const colors = useColors();
  const [kind, setKind] = useState<NoteKind>(initial?.kind ?? 'TEXT');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '');
  const [attachments, setAttachments] = useState<NoteAttachment[]>(initial?.attachments ?? []);
  const [saveToSecureVault, setSaveToSecureVault] = useState(false);
  const recorder = useRef<Audio.Recording | null>(null);
  const [recording, setRecording] = useState(false);
  const canSave = useMemo(() => Boolean(title.trim() && categoryId && !saving && (content.trim() || attachments.length)), [title, categoryId, saving, content, attachments.length]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9, allowsEditing: false });
    if (result.canceled || !result.assets[0]?.uri) return;
    const asset = result.assets[0];
    setKind(kind === 'TEXT' ? 'IMAGE' : 'MIXED');
    setAttachments((current) => [{ id: Date.now().toString(36), kind: 'IMAGE', uri: asset.uri, mimeType: asset.mimeType, name: asset.fileName ?? 'image', width: asset.width, height: asset.height }, ...current]);
  };

  const toggleRecording = async () => {
    if (recording && recorder.current) {
      await recorder.current.stopAndUnloadAsync();
      const uri = recorder.current.getURI();
      recorder.current = null;
      setRecording(false);
      if (uri) setAttachments((current) => [{ id: Date.now().toString(36), kind: 'AUDIO', uri, mimeType: 'audio/m4a', name: 'audio-note.m4a' }, ...current]);
      return;
    }
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone permission required', 'Allow microphone access to record an audio note.');
      return;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording: active } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    recorder.current = active;
    setKind(kind === 'TEXT' ? 'AUDIO' : 'MIXED');
    setRecording(true);
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: colors.foreground }]}>Note type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
        {NOTE_TYPES.map((item) => {
          const selected = kind === item.kind;
          return <Pressable key={item.kind} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={item.label} onPress={() => setKind(item.kind)} style={[styles.typeButton, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}><Feather name={item.icon as never} size={18} color={selected ? colors.primaryForeground : colors.foreground} /><Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 10 }}>{item.label}</Text></Pressable>;
        })}
      </ScrollView>

      <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
      <NoteCategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />

      <Text style={[styles.label, { color: colors.foreground }]}>Title</Text>
      <TextInput accessibilityLabel="Note title" value={title} onChangeText={setTitle} placeholder="Note title" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />

      {(kind === 'TEXT' || kind === 'AUDIO' || kind === 'MIXED') && <>
        <Text style={[styles.label, { color: colors.foreground }]}>Note text</Text>
        <TextInput accessibilityLabel="Note text" value={content} onChangeText={setContent} placeholder={kind === 'AUDIO' ? 'Add text to this audio note...' : 'Write your note...'} placeholderTextColor={colors.mutedForeground} multiline textAlignVertical="top" style={[styles.editor, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} />
      </>}

      {kind === 'IMAGE' || kind === 'MIXED' ? <Pressable accessibilityRole="button" accessibilityLabel="Add image" onPress={() => void pickImage()} style={[styles.tool, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="image" size={19} color={colors.primary} /><Text style={[styles.toolText, { color: colors.foreground }]}>Add Image</Text></Pressable> : null}

      {kind === 'AUDIO' || kind === 'MIXED' ? <Pressable accessibilityRole="button" accessibilityState={{ selected: recording }} accessibilityLabel={recording ? 'Stop audio recording' : 'Start audio recording'} onPress={() => void toggleRecording()} style={[styles.tool, { backgroundColor: recording ? colors.destructive : colors.card, borderColor: colors.border }]}><Feather name={recording ? 'square' : 'mic'} size={19} color={recording ? colors.primaryForeground : colors.primary} /><Text style={[styles.toolText, { color: recording ? colors.primaryForeground : colors.foreground }]}>{recording ? 'Stop Recording' : 'Record Audio'}</Text></Pressable> : null}

      {kind === 'DRAWING' ? <Pressable accessibilityRole="button" accessibilityLabel="Open drawing canvas" onPress={onOpenDrawing} style={[styles.tool, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="edit-3" size={19} color={colors.primary} /><Text style={[styles.toolText, { color: colors.foreground }]}>Open Drawing Canvas</Text></Pressable> : null}

      {attachments.length ? <View style={[styles.attachmentBox, { backgroundColor: colors.secondary }]}><Text style={[styles.attachmentTitle, { color: colors.foreground }]}>{attachments.length} attachment{attachments.length === 1 ? '' : 's'} attached</Text>{attachments.map((item) => <Text key={item.id} style={[styles.attachmentText, { color: colors.mutedForeground }]}>{item.kind}: {item.name || item.uri.split('/').pop() || 'attachment'}</Text>)}</View> : null}

      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: saveToSecureVault }} accessibilityLabel="Save to Secure Vault" onPress={() => setSaveToSecureVault((value) => !value)} style={[styles.vaultRow, { borderColor: colors.border, backgroundColor: colors.card }]}><MaterialCommunityIcons name={saveToSecureVault ? 'checkbox-marked' : 'checkbox-blank-outline'} size={23} color={saveToSecureVault ? colors.primary : colors.mutedForeground} /><View style={styles.vaultCopy}><Text style={[styles.vaultTitle, { color: colors.foreground }]}>Save to Secure Vault</Text><Text style={[styles.vaultHint, { color: colors.mutedForeground }]}>Create the same note inside Secure Notes without opening Vault manually.</Text></View></Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel={initial ? 'Update note' : 'Save note'} disabled={!canSave} onPress={() => onSave({ title: title.trim(), content: content.trim(), categoryId, kind: attachments.length && kind === 'TEXT' ? 'MIXED' : kind, attachments, saveToSecureVault })} style={[styles.save, { backgroundColor: canSave ? colors.primary : colors.secondary }]}><Text style={{ color: canSave ? colors.primaryForeground : colors.mutedForeground, fontFamily: 'Inter_700Bold' }}>{saving ? 'Saving…' : initial ? 'Update Note' : 'Save Note'}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 20, gap: 9 }, label: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 5 }, typeRow: { gap: 8, paddingVertical: 4 }, typeButton: { minWidth: 92, minHeight: 58, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 8 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 13 }, editor: { minHeight: 180, borderWidth: 1, borderRadius: 13, padding: 13, fontSize: 14, lineHeight: 20 }, tool: { minHeight: 52, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, toolText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, attachmentBox: { borderRadius: 14, padding: 12, marginTop: 3 }, attachmentTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' }, attachmentText: { fontSize: 10, marginTop: 4 }, vaultRow: { minHeight: 68, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', marginTop: 6 }, vaultCopy: { flex: 1, marginLeft: 10 }, vaultTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, vaultHint: { fontSize: 11, lineHeight: 16 }, save: { minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 }
});

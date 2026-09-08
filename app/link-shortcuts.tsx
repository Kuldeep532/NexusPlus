import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { addLinkShortcut, deleteLinkShortcut, listLinkShortcuts, type LinkShortcut } from '@/features/link-shortcuts/linkShortcutsRepository';

export default function LinkShortcutsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [shortcuts, setShortcuts] = useState<LinkShortcut[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => setShortcuts(await listLinkShortcuts()), []);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await addLinkShortcut(title, url);
      setTitle('');
      setUrl('');
      await load();
    } catch (error) {
      Alert.alert('Could not save shortcut', error instanceof Error ? error.message : 'Please check the shortcut details.');
    } finally {
      setSaving(false);
    }
  };

  const open = async (shortcut: LinkShortcut) => {
    try {
      await WebBrowser.openBrowserAsync(shortcut.url);
    } catch {
      Alert.alert('Could not open link', 'The saved link could not be opened on this device.');
    }
  };

  const remove = (shortcut: LinkShortcut) => {
    Alert.alert('Delete shortcut?', shortcut.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteLinkShortcut(shortcut.id).then(load) },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Link Shortcuts' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 28 }]} keyboardShouldPersistTaps="handled">
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Link Shortcuts</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Save your frequently used web links and open them with one tap.</Text>

        <View style={[styles.form, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput accessibilityLabel="Shortcut name" value={title} onChangeText={setTitle} placeholder="Shortcut name" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
          <TextInput accessibilityLabel="Web link" value={url} onChangeText={setUrl} placeholder="example.com or https://example.com" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={[styles.input, { color: colors.foreground, borderColor: colors.border }]} />
          <Pressable accessibilityRole="button" accessibilityLabel="Save link shortcut" disabled={saving} onPress={() => void save()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}>
            <Feather name="bookmark" size={18} color={colors.primaryForeground} />
            <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{saving ? 'Saving…' : 'Save Shortcut'}</Text>
          </Pressable>
        </View>

        {shortcuts.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="link" size={28} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No shortcuts yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Add your first link above. Shortcuts stay stored locally on this device.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {shortcuts.map((shortcut) => (
              <View key={shortcut.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Open ${shortcut.title}`} onPress={() => void open(shortcut)} style={styles.cardMain}>
                  <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="link" size={19} color={colors.primary} /></View>
                  <View style={styles.copy}>
                    <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{shortcut.title}</Text>
                    <Text style={[styles.cardUrl, { color: colors.mutedForeground }]} numberOfLines={1}>{shortcut.url}</Text>
                  </View>
                  <Feather name="external-link" size={18} color={colors.mutedForeground} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${shortcut.title}`} onPress={() => remove(shortcut)} style={styles.deleteButton}>
                  <Feather name="trash-2" size={17} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 14 },
  title: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 11, lineHeight: 17 },
  form: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 13 },
  primaryButton: { minHeight: 48, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  empty: { minHeight: 190, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 8 },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  emptyText: { fontSize: 11, lineHeight: 17, textAlign: 'center', maxWidth: 280 },
  list: { gap: 9 },
  card: { minHeight: 72, borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center' },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  cardTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  cardUrl: { fontSize: 10.5 },
  deleteButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});

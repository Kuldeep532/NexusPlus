import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useColors } from '@/hooks/useColors';
import { FileManagerBrowser } from '@/features/file-manager/components/FileManagerBrowser';
import { DEFAULT_FILE_MANAGER_VIEW, FILE_MANAGER_TABS, SUPPORTED_FILE_GROUPS } from '@/features/file-manager/FileManagerConfig';
import type { FileManagerTab, FileManagerViewMode } from '@/features/file-manager/FileManagerTypes';

const TAB_ICONS: Record<FileManagerTab, keyof typeof Feather.glyphMap> = {
  browse: 'folder',
  categories: 'grid',
  recent: 'clock',
  secure: 'lock',
};

export default function FileManagerScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<FileManagerTab>('browse');
  const [viewMode] = useState<FileManagerViewMode>(DEFAULT_FILE_MANAGER_VIEW);
  const categoryCount = Object.values(SUPPORTED_FILE_GROUPS).reduce((sum, items) => sum + items.length, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        accessibilityLabel="Nexus Plus File Manager"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 26 }]}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>File Manager</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Browse, organize, share and secure your files from one dedicated workspace.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View accessibilityRole="tablist" style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FILE_MANAGER_TABS.map((item) => {
            const selected = item.id === tab;
            return (
              <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={`${item.title}. ${item.description}`} accessibilityState={{ selected }} onPress={() => setTab(item.id)} style={[styles.tab, selected && { backgroundColor: colors.primary }]}>
                <Feather name={TAB_ICONS[item.id]} size={17} color={selected ? colors.primaryForeground : colors.foreground} />
                <Text style={[styles.tabText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{item.title}</Text>
              </Pressable>
            );
          })}
        </View>

        {tab === 'browse' ? (
          <FileManagerBrowser onFileAction={(action, entry) => {
            if (action === 'encrypt') router.push({ pathname: '/file-encryption', params: { uri: entry.uri, name: entry.name } });
            else if (action === 'open') {
              // Stage 3 wires preview/open pipelines and contextual bottom sheets.
            }
          }} />
        ) : (
          <View style={[styles.workspaceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.workspaceIcon, { backgroundColor: colors.secondary }]}><Feather name={TAB_ICONS[tab]} size={24} color={colors.primary} /></View>
            <Text style={[styles.workspaceTitle, { color: colors.foreground }]}>{FILE_MANAGER_TABS.find((item) => item.id === tab)?.title} workspace</Text>
            <Text style={[styles.workspaceDescription, { color: colors.mutedForeground }]}>{FILE_MANAGER_TABS.find((item) => item.id === tab)?.description}</Text>
            {tab === 'categories' && <Text style={[styles.categoryCount, { color: colors.primary }]}>{categoryCount} supported file extensions</Text>}
            {tab === 'recent' && <Text style={[styles.workspaceNote, { color: colors.mutedForeground }]}>Recent indexing and activity aggregation are scheduled for Stage 3.</Text>}
            {tab === 'secure' && <Text style={[styles.workspaceNote, { color: colors.mutedForeground }]}>Encrypted-container browsing and migrated lock/unlock UI are scheduled for Stage 3.</Text>}
          </View>
        )}

        <View style={[styles.note, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name={viewMode === 'list' ? 'list' : 'grid'} size={17} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.mutedForeground }]}>Stage 2 adds the reusable filesystem browser layer. File operations, previews, recent indexing, secure-container management and migration cleanup continue in later commits on this same PR.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 13 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 14 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  iconButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { borderRadius: 16, borderWidth: 1, padding: 4, gap: 4, flexDirection: 'row' },
  tab: { minHeight: 44, borderRadius: 12, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, flex: 1 },
  tabText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  workspaceCard: { borderRadius: 18, borderWidth: 1, padding: 17 },
  workspaceIcon: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  workspaceTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  workspaceDescription: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  workspaceNote: { fontSize: 10.5, lineHeight: 16, marginTop: 10 },
  categoryCount: { fontSize: 10.5, fontFamily: 'Inter_700Bold', marginTop: 10 },
  note: { borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  noteText: { flex: 1, fontSize: 10.5, lineHeight: 16 },
});

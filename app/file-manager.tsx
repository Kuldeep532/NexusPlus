import { Feather } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { FileManagerBrowser } from '@/features/file-manager/components/FileManagerBrowser';
import { FileManagerActionHost } from '@/features/file-manager/components/FileManagerActionHost';
import { FileManagerPreviewSheet } from '@/features/file-manager/components/FileManagerPreviewSheet';
import { FileManagerCategoriesPanel } from '@/features/file-manager/components/FileManagerCategoriesPanel';
import { FileManagerRecentPanel } from '@/features/file-manager/components/FileManagerRecentPanel';
import { FileManagerSecurePanel } from '@/features/file-manager/components/FileManagerSecurePanel';
import { FILE_MANAGER_TABS } from '@/features/file-manager/FileManagerConfig';
import type { FileManagerEntry, FileManagerSelectionAction, FileManagerTab } from '@/features/file-manager/FileManagerTypes';
import { resolveFileOpenTarget } from '@/features/file-manager/FileManagerOpenService';

const TAB_ICONS: Record<FileManagerTab, keyof typeof Feather.glyphMap> = {
  browse: 'folder', categories: 'grid', recent: 'clock', secure: 'lock',
};

export default function FileManagerScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<FileManagerTab>('browse');
  const [previewEntry, setPreviewEntry] = useState<FileManagerEntry | null>(null);
  const [actionSheetEntry, setActionSheetEntry] = useState<FileManagerEntry | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(async () => setRefreshToken((value) => value + 1), []);

  const handleAction = (action: FileManagerSelectionAction, entry: FileManagerEntry) => {
    if (action === 'open') setPreviewEntry(entry);
    else setActionSheetEntry(entry);
  };

  const openSpecialized = (entry: FileManagerEntry) => {
    const target = resolveFileOpenTarget(entry);
    if (target.kind === 'media') {
      setPreviewEntry(null);
      router.push({ pathname: '/media-player', params: { fileUri: entry.uri, fileName: entry.name } });
    } else if (target.kind === 'document') {
      setPreviewEntry(null);
      router.push({ pathname: '/reader', params: { fileUri: entry.uri, fileName: entry.name } });
    }
  };

  const openExternal = async (_entry: FileManagerEntry) => {
    Alert.alert('Open with system app', 'A platform-specific external viewer bridge is kept outside the File Manager permission scope. No additional broad storage permission is requested here.');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>File Manager</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Browse, organize, preview and secure local files.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

      <View style={styles.workspace} key={`${tab}-${refreshToken}`}>
        {tab === 'browse' && <FileManagerBrowser onFileAction={handleAction} />}
        {tab === 'categories' && <FileManagerCategoriesPanel />}
        {tab === 'recent' && <FileManagerRecentPanel onOpen={(entry) => setPreviewEntry(entry)} />}
        {tab === 'secure' && <FileManagerSecurePanel />}
      </View>

      {actionSheetEntry && (
        <FileManagerActionHost
          refresh={refresh}
          onEncrypt={(entry) => { setActionSheetEntry(null); setTab('secure'); setPreviewEntry(entry); }}
          onOpen={(entry) => { setActionSheetEntry(null); setPreviewEntry(entry); }}
        />
      )}

      <FileManagerPreviewSheet
        entry={previewEntry}
        visible={previewEntry !== null}
        onClose={() => setPreviewEntry(null)}
        onOpenSpecialized={openSpecialized}
        onOpenExternal={openExternal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start' }, headerCopy: { flex: 1, paddingRight: 14 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold' }, subtitle: { fontSize: 11.5, lineHeight: 17, marginTop: 4 }, iconButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, tabBar: { marginHorizontal: 18, borderRadius: 16, borderWidth: 1, padding: 4, gap: 4, flexDirection: 'row' }, tab: { minHeight: 44, borderRadius: 12, paddingHorizontal: 8, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, tabText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' }, workspace: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
});

import { Feather } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
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
  const [activeEntry, setActiveEntry] = useState<FileManagerEntry | null>(null);
  const [previewEntry, setPreviewEntry] = useState<FileManagerEntry | null>(null);
  const [actionSheetEntry, setActionSheetEntry] = useState<FileManagerEntry | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(async () => {
    setRefreshToken((value) => value + 1);
  }, []);

  const handleAction = (action: FileManagerSelectionAction, entry: FileManagerEntry) => {
    setActiveEntry(entry);
    if (action === 'open') setPreviewEntry(entry);
    else setActionSheetEntry(entry);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerCopy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>File Manager</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Browse, organize, share and secure files in focused workspaces.</Text>
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
        {tab === 'browse' && (
          <FileManagerBrowser
            onFileAction={handleAction}
          />
        )}
        {tab === 'categories' && <FileManagerCategoriesPanel />}
        {tab === 'recent' && <FileManagerRecentPanel onOpen={(entry) => setPreviewEntry(entry)} />}
        {tab === 'secure' && (
          <FileManagerSecurePanel
            onEncrypt={(entry) => {
              setActiveEntry(entry);
              setTab('secure');
            }}
            onDecrypt={(entry) => setActiveEntry(entry)}
          />
        )}
      </View>

      {tab === 'browse' && actionSheetEntry && (
        <FileManagerActionHost
          refresh={refresh}
          onEncrypt={(entry) => {
            setActionSheetEntry(null);
            setActiveEntry(entry);
            setTab('secure');
          }}
          onOpen={(entry) => {
            setActionSheetEntry(null);
            setPreviewEntry(entry);
          }}
        />
      )}

      <FileManagerPreviewSheet
        entry={previewEntry}
        visible={previewEntry !== null}
        onClose={() => setPreviewEntry(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 18, paddingBottom: 12, flexDirection: 'row', alignItems: 'flex-start' },
  headerCopy: { flex: 1, paddingRight: 14 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  iconButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { marginHorizontal: 18, borderRadius: 16, borderWidth: 1, padding: 4, gap: 4, flexDirection: 'row' },
  tab: { minHeight: 44, borderRadius: 12, paddingHorizontal: 8, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabText: { fontSize: 10.5, fontFamily: 'Inter_700Bold' },
  workspace: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
});

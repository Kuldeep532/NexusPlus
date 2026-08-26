import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
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

  const categoryCount = useMemo(() => Object.values(SUPPORTED_FILE_GROUPS).reduce((sum, items) => sum + items.length, 0), []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        accessibilityLabel="Nexus Plus File Manager"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>File Manager</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>A dedicated workspace for browsing, organizing, sharing and securing local files.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View accessibilityRole="tablist" style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {FILE_MANAGER_TABS.map((item) => {
            const selected = item.id === tab;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityLabel={`${item.title}. ${item.description}`}
                accessibilityState={{ selected }}
                onPress={() => setTab(item.id)}
                style={[styles.tab, selected && { backgroundColor: colors.primary }]}
              >
                <Feather name={TAB_ICONS[item.id]} size={17} color={selected ? colors.primaryForeground : colors.foreground} />
                <Text style={[styles.tabText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{item.title}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.workspaceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.workspaceIcon, { backgroundColor: colors.secondary }]}>
            <Feather name={TAB_ICONS[tab]} size={24} color={colors.primary} />
          </View>
          <Text style={[styles.workspaceTitle, { color: colors.foreground }]}>
            {FILE_MANAGER_TABS.find((item) => item.id === tab)?.title} workspace
          </Text>
          <Text style={[styles.workspaceDescription, { color: colors.mutedForeground }]}>
            {FILE_MANAGER_TABS.find((item) => item.id === tab)?.description}
          </Text>
        </View>

        <View style={styles.grid}>
          {[
            ['browse', 'Browse storage', 'folder', 'Navigate folders and files.'],
            ['categories', 'File categories', 'grid', `${categoryCount} supported file extensions.`],
            ['recent', 'Recent files', 'clock', 'Keep recent activity separate from browsing.'],
            ['secure', 'Secure files', 'lock', 'Encryption lives inside File Manager.'],
          ].map(([key, title, icon, description]) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`${title}. ${description}`}
              onPress={() => setTab(key as FileManagerTab)}
              style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name={icon as keyof typeof Feather.glyphMap} size={19} color={colors.primary} />
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>{title}</Text>
              <Text style={[styles.actionDescription, { color: colors.mutedForeground }]}>{description}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Planned modular areas</Text>
        <View style={styles.list}>
          {[
            'Storage navigation with breadcrumbs, sorting, hidden files and list/grid views',
            'File operations in contextual bottom sheets: rename, move, copy, share, compress and delete',
            'Preview/open pipelines for images, media and documents',
            'Secure area with lock/unlock, password workflow and encrypted-container management',
            'Properties and storage insights without overloading the main browser screen',
          ].map((label) => (
            <View key={label} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="check-circle" size={18} color={colors.primary} />
              <Text style={[styles.rowText, { color: colors.foreground }]}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.footerNote, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name={viewMode === 'list' ? 'list' : 'grid'} size={17} color={colors.primary} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Stage 1 establishes the modular File Manager boundary. The following stages will progressively replace this shell with the full native filesystem experience and migrate all related entries.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerCopy: { flex: 1, paddingRight: 14 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  iconButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { borderRadius: 16, borderWidth: 1, padding: 4, gap: 4 },
  tab: { minHeight: 44, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, flex: 1 },
  tabText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  workspaceCard: { borderRadius: 18, borderWidth: 1, padding: 17, alignItems: 'flex-start' },
  workspaceIcon: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  workspaceTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  workspaceDescription: { fontSize: 11, lineHeight: 17, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '48.3%', minHeight: 118, borderRadius: 16, borderWidth: 1, padding: 13 },
  actionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginTop: 9 },
  actionDescription: { fontSize: 10, lineHeight: 15, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 6 },
  list: { gap: 9 },
  row: { minHeight: 58, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { flex: 1, fontSize: 11, lineHeight: 16 },
  footerNote: { borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  footerText: { flex: 1, fontSize: 10.5, lineHeight: 16 },
});

import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Tool = { key: string; title: string; description: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; route: string };

const tools: Tool[] = [
  { key: 'merge-pdf', title: 'Merge PDF', description: 'Combine multiple PDF files into one PDF.', icon: 'file-document-multiple-outline', route: '/merge-pdf' },
  { key: 'split-pdf', title: 'Split PDF', description: 'Cut a PDF into separate files using page ranges.', icon: 'content-cut', route: '/split-pdf' },
  { key: 'rotate-pdf', title: 'Rotate PDF', description: 'Rotate selected PDF pages by 90°, 180°, or 270°.', icon: 'rotate-right', route: '/rotate-pdf' },
  { key: 'pdf-image', title: 'PDF ⇄ Image', description: 'Convert PDF pages to images or images to PDF.', icon: 'file-swap-outline', route: '/pdf-image' },
  { key: 'compress-pdf', title: 'Compress PDF', description: 'Reduce PDF file size for easier sharing.', icon: 'file-minus-outline', route: '/compress-pdf' },
  { key: 'lock-unlock-pdf', title: 'Lock & Unlock PDF', description: 'Password-protect a PDF or remove its existing protection.', icon: 'shield-lock-outline', route: '/lock-unlock-pdf' },
  { key: 'reorder-pdf', title: 'Reorder PDF', description: 'Change the order of pages and save a new PDF.', icon: 'swap-vertical', route: '/reorder-pdf' },
  { key: 'delete-pages', title: 'Delete PDF Pages', description: 'Remove unwanted pages from a PDF.', icon: 'file-remove-outline', route: '/delete-pdf-pages' },
  { key: 'extract-pages', title: 'Cut & Extract Pages', description: 'Cut selected pages and save them as a new PDF.', icon: 'file-export-outline', route: '/extract-pdf-pages' },
];

export default function PdfToolsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <Stack.Screen options={{ title: 'PDF Tools' }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="file-pdf-box" size={30} color={colors.primary} /></View>
          <View style={styles.headerCopy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>PDF Tools</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Separate screens for common PDF operations.</Text></View>
        </View>
        <View style={styles.list}>
          {tools.map((tool) => <Pressable key={tool.key} accessibilityRole="button" accessibilityLabel={`Open ${tool.title}`} accessibilityHint={tool.description} onPress={() => router.push(tool.route as never)} style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={tool.icon} size={24} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{tool.title}</Text><Text style={[styles.rowDescription, { color: colors.mutedForeground }]}>{tool.description}</Text></View>
            <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
          </Pressable>)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 24 }, headerIcon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, marginLeft: 14 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' }, list: { paddingHorizontal: 20, gap: 10 }, row: { minHeight: 82, borderRadius: 17, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' }, icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginHorizontal: 13 }, rowTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 }, rowDescription: { fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' }, pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] } });

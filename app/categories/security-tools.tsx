import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getCategoryTools } from '@/features/app-shell/featureRegistry';

export default function SecurityToolsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tools = getCategoryTools('security');
  return <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
    <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Security Tools</Text>
    <Text style={[styles.body, { color: colors.mutedForeground }]}>Additional security and privacy utilities. Primary security features remain on Home.</Text>
    <View style={styles.list}>{tools.map((tool) => <Pressable key={tool.id} accessibilityRole="button" accessibilityLabel={`${tool.title}. ${tool.description}`} onPress={() => router.push(tool.route as never)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={tool.icon as never} size={20} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{tool.title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{tool.description}</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground} accessibilityElementsHidden /></Pressable>)}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, title: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 6 }, body: { fontSize: 11, lineHeight: 17 }, list: { marginTop: 18, gap: 10 }, card: { minHeight: 74, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center' }, icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, marginLeft: 12, marginRight: 8 }, cardTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 } });

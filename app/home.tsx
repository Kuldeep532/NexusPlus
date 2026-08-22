import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getDailySpiritualMessage } from '@/features/spiritual/spiritualMessageLibrary';
import { FEATURE_CATEGORY_META, getFeaturesByCategory, getFeaturedHomeFeatures, type FeatureCategory } from '@/features/app-shell/featureRegistry';

const CATEGORY_ORDER: FeatureCategory[] = ['utility', 'pdf', 'media', 'security', 'productivity'];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const featuredTools = useMemo(() => getFeaturedHomeFeatures(), []);
  const categorySections = useMemo(() => CATEGORY_ORDER.map((category) => ({ category, meta: FEATURE_CATEGORY_META[category], features: getFeaturesByCategory(category) })).filter((section) => section.features.length > 0), []);
  const dailyMessage = getDailySpiritualMessage();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView accessibilityLabel="Nexus Plus home screen" contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.brand, { color: colors.foreground }]}>Nexus Plus</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Home</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Your major features first. Smaller tools stay inside their dedicated sections.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={[styles.profileButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]} accessible accessibilityRole="summary">
          <Feather name="sunrise" size={21} color={colors.primary} />
          <View style={styles.messageCopy}>
            <Text style={[styles.messageLabel, { color: colors.primary }]}>SPIRITUAL SUNDAYS</Text>
            <Text style={[styles.message, { color: colors.foreground }]}>{dailyMessage.text}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Main features</Text>
        <View style={styles.list}>
          {featuredTools.map((tool) => (
            <Pressable key={tool.id} accessibilityRole="button" accessibilityLabel={`${tool.title}. ${tool.description}`} onPress={() => router.push(tool.route as never)} style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.toolIcon, { backgroundColor: colors.secondary }]}><Feather name={tool.icon as never} size={20} color={colors.primary} /></View>
              <View style={styles.toolCopy}><Text style={[styles.toolTitle, { color: colors.foreground }]}>{tool.title}</Text><Text style={[styles.toolDescription, { color: colors.mutedForeground }]}>{tool.description}</Text></View>
              <Feather name="chevron-right" size={19} color={colors.mutedForeground} accessibilityElementsHidden />
            </Pressable>
          ))}
        </View>

        <Text style={[styles.categorySectionTitle, { color: colors.foreground }]}>Tool categories</Text>
        <Text style={[styles.categoryIntro, { color: colors.mutedForeground }]}>Open a category to access its individual tools. Utility and PDF tools are not duplicated on Home.</Text>
        <View style={styles.list}>
          {categorySections.map(({ category, meta, features }) => (
            <Pressable key={category} accessibilityRole="button" accessibilityLabel={`${meta.title}. ${meta.description}. ${features.length} tools available.`} onPress={() => router.push(meta.route as never)} style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.categoryIcon, { backgroundColor: colors.secondary }]}><Feather name={meta.icon as never} size={20} color={colors.primary} /></View>
              <View style={styles.toolCopy}><Text style={[styles.toolTitle, { color: colors.foreground }]}>{meta.title}</Text><Text style={[styles.toolDescription, { color: colors.mutedForeground }]}>{meta.description}</Text><Text style={[styles.count, { color: colors.primary }]}>{features.length} tools</Text></View>
              <Feather name="chevron-right" size={19} color={colors.mutedForeground} accessibilityElementsHidden />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 18 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }, headerCopy: { flex: 1, paddingRight: 16 }, brand: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 5 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold' }, subtitle: { fontSize: 12, lineHeight: 18, marginTop: 5 }, profileButton: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, messageCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 }, messageCopy: { flex: 1, marginLeft: 10 }, messageLabel: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 5 }, message: { fontSize: 12.5, lineHeight: 18, fontFamily: 'Inter_600SemiBold' }, sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 10 }, categorySectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 24, marginBottom: 4 }, categoryIntro: { fontSize: 11, lineHeight: 17, marginBottom: 10 }, list: { gap: 10 }, toolCard: { minHeight: 76, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center' }, categoryCard: { minHeight: 78, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center' }, toolIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, categoryIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, toolCopy: { flex: 1, marginLeft: 12, marginRight: 8 }, toolTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, toolDescription: { fontSize: 11, lineHeight: 16 }, count: { fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 4 },
});

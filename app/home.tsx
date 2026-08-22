import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getDailySpiritualMessage } from '@/features/spiritual/spiritualMessageLibrary';
import { readLaunchPreferences } from '@/features/app-shell/launchPreferences';
import { FEATURE_CATEGORY_META, getFeaturesByCategory, getFeaturedHomeFeatures, type FeatureCategory } from '@/features/app-shell/featureRegistry';

const CATEGORY_ORDER: FeatureCategory[] = ['utility', 'pdf', 'media', 'security', 'productivity'];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showGeetaNexusOnHome, setShowGeetaNexusOnHome] = useState(true);

  useEffect(() => {
    void readLaunchPreferences().then((preferences) => setShowGeetaNexusOnHome(preferences.showGeetaNexusOnHome));
  }, []);

  const featuredTools = useMemo(() => getFeaturedHomeFeatures().filter((feature) => showGeetaNexusOnHome || feature.id !== 'geeta-nexus'), [showGeetaNexusOnHome]);
  const categorySections = useMemo(() => CATEGORY_ORDER.map((category) => ({ category, meta: FEATURE_CATEGORY_META[category], features: getFeaturesByCategory(category) })).filter((section) => section.features.length > 0), []);
  const dailyMessage = getDailySpiritualMessage();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView accessibilityLabel="Nexus Plus home screen" contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.brand, { color: colors.foreground }]}>Nexus Plus</Text>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Home</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Your major features and tools, organised by purpose.</Text>
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

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Featured features</Text>
        <View style={styles.list}>
          {featuredTools.map((tool) => (
            <Pressable key={tool.id} accessibilityRole="button" accessibilityLabel={`${tool.title}. ${tool.description}`} onPress={() => router.push(tool.route as never)} style={[styles.toolCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.toolIcon, { backgroundColor: colors.secondary }]}><Feather name={tool.icon as never} size={20} color={colors.primary} /></View>
              <View style={styles.toolCopy}><Text style={[styles.toolTitle, { color: colors.foreground }]}>{tool.title}</Text><Text style={[styles.toolDescription, { color: colors.mutedForeground }]}>{tool.description}</Text></View>
              <Feather name="chevron-right" size={19} color={colors.mutedForeground} accessibilityElementsHidden />
            </Pressable>
          ))}
        </View>

        {categorySections.map(({ category, meta, features }) => (
          <View key={category} style={styles.categorySection}>
            <View style={styles.categoryHeading}>
              <View style={styles.categoryCopy}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{meta.title}</Text>
                <Text style={[styles.categoryDescription, { color: colors.mutedForeground }]}>{meta.description}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Open ${meta.title}`} onPress={() => router.push(meta.route as never)} style={[styles.categoryButton, { backgroundColor: colors.secondary }]}>
                <Feather name="arrow-up-right" size={18} color={colors.primary} accessibilityElementsHidden />
              </Pressable>
            </View>
            <View style={styles.list}>
              {features.map((tool) => (
                <Pressable key={tool.id} accessibilityRole="button" accessibilityLabel={`${tool.title}. ${tool.description}`} onPress={() => router.push(tool.route as never)} style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.toolIcon, { backgroundColor: colors.secondary }]}><Feather name={tool.icon as never} size={20} color={colors.primary} /></View>
                  <View style={styles.toolCopy}><Text style={[styles.toolTitle, { color: colors.foreground }]}>{tool.title}</Text><Text style={[styles.toolDescription, { color: colors.mutedForeground }]}>{tool.description}</Text></View>
                  <Feather name="chevron-right" size={19} color={colors.mutedForeground} accessibilityElementsHidden />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerCopy: { flex: 1, paddingRight: 16 },
  brand: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  title: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  profileButton: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  messageCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  messageCopy: { flex: 1, marginLeft: 10 },
  messageLabel: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  message: { fontSize: 12.5, lineHeight: 18, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  categorySection: { marginTop: 22 },
  categoryHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  categoryCopy: { flex: 1, paddingRight: 10 },
  categoryDescription: { fontSize: 11, lineHeight: 16 },
  categoryButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 10 },
  toolCard: { minHeight: 76, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center' },
  categoryCard: { minHeight: 70, borderWidth: 1, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center' },
  toolIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  toolCopy: { flex: 1, marginLeft: 12, marginRight: 8 },
  toolTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  toolDescription: { fontSize: 11, lineHeight: 16 },
});

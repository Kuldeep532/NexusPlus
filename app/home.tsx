import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/features/auth/useAuth';
import { getDailySpiritualMessage } from '@/features/spiritual/spiritualMessageLibrary';
import { FEATURE_CATEGORY_META, getCategoryTools, getFeaturedHomeFeatures, type FeatureCategory } from '@/features/app-shell/featureRegistry';
import { NexusBrandMark } from '@/features/branding/NexusBrandMark';

const CATEGORY_ORDER: FeatureCategory[] = ['utility', 'pdf', 'media', 'security', 'productivity'];
const PDF_TOOL_COUNT = 3;

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const featuredTools = useMemo(() => getFeaturedHomeFeatures(), []);
  const categorySections = useMemo(() => CATEGORY_ORDER.map((category) => ({
    category,
    meta: FEATURE_CATEGORY_META[category],
    count: category === 'pdf' ? PDF_TOOL_COUNT : getCategoryTools(category).length,
  })).filter((section) => section.count > 0), []);
  const dailyMessage = getDailySpiritualMessage();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView accessibilityLabel="Nexus Plus home screen" contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <View style={styles.brandRow}>
              <NexusBrandMark size={42} />
              <View>
                <Text style={[styles.brand, { color: colors.foreground }]}>Nexus Plus</Text>
                <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Home</Text>
              </View>
            </View>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Major features first. Smaller tools stay inside dedicated screens.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={auth.session ? 'Open profile' : 'Login or register'} onPress={() => router.push(auth.session ? '/profile' : '/login-plus-register')} style={[styles.profileButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={auth.session ? 'user' : 'log-in'} size={22} color={colors.foreground} />
          </Pressable>
        </View>

        {!auth.session && (
          <View accessible accessibilityRole="summary" style={[styles.accountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.accountCopy}>
              <Text style={[styles.accountTitle, { color: colors.foreground }]}>Nexus Plus Account</Text>
              <Text style={[styles.accountMessage, { color: colors.mutedForeground }]}>Login or create your account to sync your Nexus Plus experience and receive notifications.</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Login or create account" onPress={() => router.push('/login-plus-register')} style={[styles.accountButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.accountButtonText, { color: colors.primaryForeground }]}>Login / Register</Text>
            </Pressable>
          </View>
        )}

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
        <Text style={[styles.categoryIntro, { color: colors.mutedForeground }]}>Open a dedicated screen for individual tools. Utility and PDF tools are never duplicated on Home.</Text>
        <View style={styles.list}>
          {categorySections.map(({ category, meta, count }) => (
            <Pressable key={category} accessibilityRole="button" accessibilityLabel={`${meta.title}. ${meta.description}. ${count} tools available.`} onPress={() => router.push(meta.route as never)} style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.categoryIcon, { backgroundColor: colors.secondary }]}><Feather name={meta.icon as never} size={20} color={colors.primary} /></View>
              <View style={styles.toolCopy}><Text style={[styles.toolTitle, { color: colors.foreground }]}>{meta.title}</Text><Text style={[styles.toolDescription, { color: colors.mutedForeground }]}>{meta.description}</Text><Text style={[styles.count, { color: colors.primary }]}>{count} tools</Text></View>
              <Feather name="chevron-right" size={19} color={colors.mutedForeground} accessibilityElementsHidden />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  headerCopy: { flex: 1, paddingRight: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brand: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  profileButton: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  accountCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 14 },
  accountCopy: { marginBottom: 11 },
  accountTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  accountMessage: { fontSize: 11, lineHeight: 17 },
  accountButton: { minHeight: 45, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  accountButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  messageCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  messageCopy: { flex: 1, marginLeft: 10 },
  messageLabel: { fontSize: 9, letterSpacing: 1.4, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  message: { fontSize: 12.5, lineHeight: 18, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  categorySectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 24, marginBottom: 4 },
  categoryIntro: { fontSize: 11, lineHeight: 17, marginBottom: 10 },
  list: { gap: 10 },
  toolCard: { minHeight: 76, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center' },
  categoryCard: { minHeight: 78, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center' },
  toolIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  categoryIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolCopy: { flex: 1, marginLeft: 12, marginRight: 8 },
  toolTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  toolDescription: { fontSize: 11, lineHeight: 16 },
  count: { fontSize: 10, fontFamily: 'Inter_700Bold', marginTop: 4 },
});

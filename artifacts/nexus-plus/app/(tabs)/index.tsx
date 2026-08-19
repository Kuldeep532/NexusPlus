import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const primaryActions = [
  { key: 'reader', title: 'Book Reader', detail: 'Read, listen and manage your eBooks', icon: 'book-open-page-variant' as const, route: '/reader' },
  { key: 'media', title: 'Media Player', detail: 'Play audio, video and spoken content', icon: 'play-box-multiple' as const, route: '/media-player' },
  { key: 'features', title: 'All Features', detail: 'Open every Nexus Plus feature in one place', icon: 'view-grid-outline' as const, route: '/features' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 36 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: colors.primary }]}>NEXUS PLUS</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Home</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Your reading, media and tools in one place.</Text>
        </View>
        <View accessible accessibilityLabel="Nexus Plus" style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoText, { color: colors.primaryForeground }]}>N</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Start here</Text>
        <Text style={[styles.sectionDetail, { color: colors.mutedForeground }]}>Choose an app area.</Text>
      </View>

      <View style={styles.actionList}>
        {primaryActions.map((action) => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={`${action.title}. ${action.detail}`}
            onPress={() => router.push(action.route as never)}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name={action.icon} size={26} color={colors.primary} />
            </View>
            <View style={styles.actionCopy}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>{action.title}</Text>
              <Text style={[styles.actionDetail, { color: colors.mutedForeground }]}>{action.detail}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.infoIcon, { backgroundColor: colors.card }]}>
          <Feather name="sun" size={18} color={colors.primary} />
        </View>
        <View style={styles.infoCopy}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>Automatic appearance</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>Every feature reads the shared theme tokens, so new screens can inherit light and dark mode automatically.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  kicker: { fontSize: 10, letterSpacing: 2, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 32, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { maxWidth: 285, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  logo: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 21, fontFamily: 'Inter_700Bold' },
  section: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  sectionDetail: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  actionList: { paddingHorizontal: 20, gap: 10 },
  action: { minHeight: 82, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  actionCopy: { flex: 1, marginHorizontal: 13 },
  actionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  actionDetail: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  infoCard: { marginHorizontal: 20, marginTop: 22, borderRadius: 17, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1, marginLeft: 11 },
  infoTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  infoText: { fontSize: 10.5, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});

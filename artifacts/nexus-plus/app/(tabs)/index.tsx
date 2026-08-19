import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Feature = {
  key: string;
  title: string;
  detail: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  route: string;
};

const features: Feature[] = [
  { key: 'reader', title: 'Book Reader', detail: 'Read, listen to, import and manage eBooks', icon: 'book-open-page-variant', route: '/reader' },
  { key: 'media', title: 'Media Player', detail: 'Play audio and video with accessible controls', icon: 'play-box-multiple', route: '/media-player' },
  { key: 'vault', title: 'Biometric Vault', detail: 'Protect passwords, cards, notes and documents', icon: 'shield-lock', route: '/biometric-vault' },
  { key: 'voices', title: 'Voice Library', detail: 'Manage downloaded reading voices', icon: 'account-voice', route: '/voices' },
  { key: 'cleaner', title: 'Storage Cleaner', detail: 'Find large files and reclaim device storage safely', icon: 'broom', route: '/storage-cleaner' },
  { key: 'about', title: 'About Nexus Plus', detail: 'Version, privacy and support information', icon: 'information-outline', route: '/about' },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.kicker, { color: colors.primary }]}>NEXUS PLUS</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Home</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Reading, media, privacy and everyday tools in one place.</Text>
        </View>
        <View accessible accessibilityLabel="Nexus Plus" style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoText, { color: colors.primaryForeground }]}>N</Text>
        </View>
      </View>

      <View style={styles.heroActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Book Reader" onPress={() => router.push('/reader')} style={({ pressed }) => [styles.heroAction, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="book-open-page-variant" size={25} color={colors.primaryForeground} />
          <View style={styles.heroCopy}><Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>Book Reader</Text><Text style={[styles.heroDetail, { color: colors.primaryForeground }]}>Read and listen to your books</Text></View>
          <Feather name="arrow-right" size={19} color={colors.primaryForeground} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Media Player" onPress={() => router.push('/media-player')} style={({ pressed }) => [styles.heroAction, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="play-box-multiple" size={25} color={colors.primary} />
          <View style={styles.heroCopy}><Text style={[styles.heroTitle, { color: colors.foreground }]}>Media Player</Text><Text style={[styles.heroDetail, { color: colors.mutedForeground }]}>Play audio and video content</Text></View>
          <Feather name="arrow-right" size={19} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>All Features</Text><Text style={[styles.sectionDetail, { color: colors.mutedForeground }]}>Everything available in Nexus Plus.</Text></View>
      </View>

      <View style={styles.list}>
        {features.map((feature) => (
          <Pressable key={feature.key} accessibilityRole="button" accessibilityLabel={`${feature.title}. ${feature.detail}`} onPress={() => router.push(feature.route as never)} style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={feature.icon} size={23} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{feature.title}</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{feature.detail}</Text></View>
            <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>

      <View style={[styles.infoCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <View style={[styles.infoIcon, { backgroundColor: colors.card }]}><Feather name="sun" size={18} color={colors.primary} /></View>
        <View style={styles.infoCopy}><Text style={[styles.infoTitle, { color: colors.foreground }]}>Automatic appearance</Text><Text style={[styles.infoText, { color: colors.mutedForeground }]}>All screens use shared semantic theme tokens, so new features can inherit light and dark mode automatically.</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 },
  kicker: { fontSize: 10, letterSpacing: 2, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 32, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { maxWidth: 285, fontSize: 13, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  logo: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 21, fontFamily: 'Inter_700Bold' },
  heroActions: { paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  heroAction: { minHeight: 76, borderRadius: 18, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  heroCopy: { flex: 1, marginHorizontal: 12 },
  heroTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  heroDetail: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  sectionDetail: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  list: { paddingHorizontal: 20, gap: 9 },
  row: { minHeight: 74, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginHorizontal: 11 },
  rowTitle: { fontSize: 13.5, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  rowDetail: { fontSize: 10.5, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  infoCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 16, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1, marginLeft: 11 },
  infoTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  infoText: { fontSize: 10.5, lineHeight: 15, fontFamily: 'Inter_400Regular' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});

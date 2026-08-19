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
  { key: 'reader', title: 'Book Reader', detail: 'Accessible PDF reading, OCR and speech', icon: 'book-open-page-variant', route: '/reader' },
  { key: 'media', title: 'Nexus Media', detail: 'Audio and video playback with subtitles', icon: 'play-box-multiple', route: '/media-player' },
  { key: 'vault', title: 'Biometric Vault', detail: 'Encrypted passwords, cards, notes and documents', icon: 'shield-lock', route: '/biometric-vault' },
  { key: 'voices', title: 'Voice Library', detail: 'Manage available offline reading voices', icon: 'account-voice', route: '/voices' },
  { key: 'settings', title: 'Settings', detail: 'Reading, speech and app preferences', icon: 'cog-outline', route: '/settings' },
  { key: 'about', title: 'About Nexus Plus', detail: 'Version, privacy and support information', icon: 'information-outline', route: '/about' },
];

export default function FeaturesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={[styles.kicker, { color: colors.primary }]}>NEXUS PLUS</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Features</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Everything in one accessible navigation space.</Text>
      </View>

      <View style={styles.list}>
        {features.map((feature) => (
          <Pressable
            key={feature.key}
            accessibilityRole="button"
            accessibilityLabel={`${feature.title}. ${feature.detail}`}
            onPress={() => router.push(feature.route as never)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name={feature.icon} size={23} color={colors.primary} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>{feature.title}</Text>
              <Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{feature.detail}</Text>
            </View>
            <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heading: { paddingHorizontal: 20, marginBottom: 24 },
  kicker: { fontSize: 10, letterSpacing: 2, fontFamily: 'Inter_700Bold', marginBottom: 9 },
  title: { fontSize: 30, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  list: { paddingHorizontal: 20, gap: 10 },
  row: { minHeight: 78, borderRadius: 17, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginHorizontal: 12 },
  rowTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  rowDetail: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
});

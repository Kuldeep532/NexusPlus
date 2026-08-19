import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Feature = {
  key: string;
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  route: string;
};

const features: Feature[] = [
  { key: 'reader', title: 'Book Reader', icon: 'book-open-page-variant', route: '/reader' },
  { key: 'media', title: 'Media Player', icon: 'play-box-multiple', route: '/media-player' },
  { key: 'vault', title: 'Biometric Vault', icon: 'shield-lock', route: '/biometric-vault' },
  { key: 'cleaner', title: 'Storage Cleaner', icon: 'broom', route: '/storage-cleaner' },
  { key: 'pdf-images', title: 'PDF to Images', icon: 'file-pdf-box', route: '/pdf-to-images' },
  { key: 'protect-pdf', title: 'Protect PDF', icon: 'shield-key', route: '/protect-pdf' },
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
        </View>
        <View accessible accessibilityLabel="Nexus Plus" style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoText, { color: colors.primaryForeground }]}>N</Text>
        </View>
      </View>

      <View style={styles.list}>
        {features.map((feature) => (
          <Pressable
            key={feature.key}
            accessibilityRole="button"
            accessibilityLabel={`Open ${feature.title}`}
            onPress={() => router.push(feature.route as never)}
            style={({ pressed }) => [styles.row, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
          >
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
              <MaterialCommunityIcons name={feature.icon} size={23} color={colors.primary} />
            </View>
            <Text style={[styles.rowTitle, { color: colors.foreground }]}>{feature.title}</Text>
            <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 22 },
  kicker: { fontSize: 10, letterSpacing: 2, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  logo: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 21, fontFamily: 'Inter_700Bold' },
  list: { paddingHorizontal: 20, gap: 10 },
  row: { minHeight: 70, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { flex: 1, marginHorizontal: 13, fontSize: 14, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});

import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const settings = [
  { href: '/language-and-preference', title: 'Language and Preferences', detail: 'Manage feature announcements and Book Reader language.', icon: 'globe' as const },
  { href: '/legal', title: 'Legal', detail: 'View legal information.', icon: 'file-text' as const },
  { href: '/privacy-policy', title: 'Privacy Policy', detail: 'Read the privacy policy.', icon: 'shield' as const },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      accessibilityLabel="Nexus Plus settings screen"
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Configure Nexus Plus and review app information.</Text>
      </View>

      <View style={styles.list} accessibilityRole="list">
        {settings.map((item) => (
          <Link key={item.href} href={item.href as any} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityHint={item.detail}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.secondary }]} accessible={false}>
                <Feather name={item.icon} size={22} color={colors.primary} accessibilityElementsHidden />
              </View>
              <View style={styles.copy} accessible={false}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.detail, { color: colors.mutedForeground }]}>{item.detail}</Text>
              </View>
              <Feather name="chevron-right" size={22} color={colors.mutedForeground} accessibilityElementsHidden />
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 24 },
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: { minHeight: 76, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  detail: { marginTop: 4, fontSize: 12, lineHeight: 17 },
});

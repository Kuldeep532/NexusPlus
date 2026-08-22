import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const actions = [
  { href: '/reader', title: 'Book Reader', detail: 'Open the Book Reader.', icon: 'book-open' as const },
  { href: '/pdf-tools', title: 'PDF Tools', detail: 'Open PDF utilities.', icon: 'file-text' as const },
  { href: '/language-and-preference', title: 'Language and Preferences', detail: 'Choose feature and reader languages.', icon: 'globe' as const },
  { href: '/settings', title: 'Settings', detail: 'Open Nexus Plus settings.', icon: 'settings' as const },
];

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      accessibilityLabel="Nexus Plus home screen"
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
    >
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.secondary }]} accessible accessibilityLabel="Nexus Plus">
          <Feather name="radio" size={30} color={colors.primary} />
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Plus</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Accessible tools, reading and utilities.</Text>
      </View>

      <View style={styles.list} accessibilityRole="list">
        {actions.map((action) => (
          <Link key={action.href} href={action.href as any} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={action.title}
              accessibilityHint={action.detail}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: colors.secondary }]} accessible={false}>
                <Feather name={action.icon} size={22} color={colors.primary} accessibilityElementsHidden />
              </View>
              <View style={styles.copy} accessible={false}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{action.title}</Text>
                <Text style={[styles.detail, { color: colors.mutedForeground }]}>{action.detail}</Text>
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
  logo: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 30, fontWeight: '700' },
  subtitle: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: { minHeight: 76, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  detail: { marginTop: 4, fontSize: 12, lineHeight: 17 },
});

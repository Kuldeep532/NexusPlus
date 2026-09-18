import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const CONTACT_EMAIL = 'info@nexusweb.co.in';
const OFFICIAL_WEBSITE = 'https://nexusweb.co.in';

const ITEMS = [
  { title: 'Settings', description: 'Control Nexus Plus behavior, appearance and feature preferences.', route: '/settings', icon: 'settings' as const },
  { title: 'About Us', description: 'About Nexus Wave Technologies and Nexus Plus.', route: '/about-us', icon: 'info' as const },
  { title: 'Privacy Policy', description: 'Data handling, permissions, security, retention and deletion.', route: '/privacy-policy', icon: 'lock' as const },
  { title: 'Terms & Conditions', description: 'Rules for safe, lawful and responsible use.', route: '/terms-and-conditions', icon: 'file-text' as const },
];

export default function MoreScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openWebsite = () => void Linking.openURL(OFFICIAL_WEBSITE);
  const openEmail = () => void Linking.openURL('mailto:' + CONTACT_EMAIL);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>More</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Nexus Plus settings, information and support.</Text>
        <View style={styles.list}>
          {ITEMS.map((item) => <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={item.title + '. ' + item.description} onPress={() => router.push(item.route as never)} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={item.icon} size={20} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{item.description}</Text></View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>)}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Connect with Nexus</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Visit Official Website" onPress={openWebsite} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="globe" size={20} color={colors.primary} /></View>
          <View style={styles.copy}><Text style={[styles.itemTitle, { color: colors.foreground }]}>Visit Official Website</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{OFFICIAL_WEBSITE.replace('https://', '')}</Text></View>
          <Feather name="external-link" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Contact Email" onPress={openEmail} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="mail" size={20} color={colors.primary} /></View>
          <View style={styles.copy}><Text style={[styles.itemTitle, { color: colors.foreground }]}>Contact Email</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{CONTACT_EMAIL}</Text></View>
          <Feather name="send" size={18} color={colors.mutedForeground} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold' }, subtitle: { fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 18 },
  list: { gap: 10 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 22, marginBottom: 10 },
  item: { minHeight: 70, borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center' }, icon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginHorizontal: 12 }, itemTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, body: { fontSize: 11, lineHeight: 16 },
});

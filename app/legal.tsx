import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const links = [
  ['Privacy Policy', '/privacy-policy'],
  ['Terms & Conditions', '/terms-and-conditions'],
];

const externalLinks = [
  ['Official Website', 'https://nexusweb.co.in'],
  ['Email Support', 'mailto:info@nexusweb.co.in'],
  ['Instagram', 'https://www.instagram.com/nexuswave_technologies?igsi=MTBia3ZxODcwOTFrNg=='],
  ['Facebook', 'https://www.facebook.com/profile.php?id=61590971301245'],
  ['WhatsApp Channel', 'https://whatsapp.com/channel/0029VbDI2cL42Dcc9m6nfm3T'],
  ['LinkedIn', 'https://www.linkedin.com/company/nexus-wave-technologies/'],
];

export default function LegalAndSupport() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const open = async (url: string) => {
    try { await Linking.openURL(url); } catch { /* keep the page usable if no handler exists */ }
  };

  return (
    <ScrollView
      accessible
      accessibilityLabel="Nexus Plus legal and support"
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Legal & Support</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Privacy, terms, company information and support</Text>
      </View>

      <View style={styles.group}>
        <Text accessibilityRole="header" style={[styles.groupTitle, { color: colors.foreground }]}>Legal</Text>
        {links.map(([label, route]) => (
          <TouchableOpacity
            key={route}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityHint={`Open ${label}`}
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => {
              // Expo Router handles these app routes when the user activates the row.
              void open(`nexusplus://${route.replace(/^\//, '')}`);
            }}
          >
            <Text style={[styles.rowText, { color: colors.foreground }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.group}>
        <Text accessibilityRole="header" style={[styles.groupTitle, { color: colors.foreground }]}>Nexus Wave Technologies</Text>
        {externalLinks.map(([label, url]) => (
          <TouchableOpacity
            key={label}
            accessibilityRole="link"
            accessibilityLabel={label}
            accessibilityHint={`Open ${label}`}
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => void open(url)}
          >
            <Text style={[styles.rowText, { color: colors.foreground }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 18 },
  title: { fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 19 },
  group: { marginHorizontal: 20, marginBottom: 24 },
  groupTitle: { fontSize: 18, fontWeight: '750', marginBottom: 4 },
  row: { minHeight: 56, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { fontSize: 16, lineHeight: 22 },
});

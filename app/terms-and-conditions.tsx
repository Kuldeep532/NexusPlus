import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const sections: Array<[string, string]> = [
  ['Acceptance', 'By using Nexus Plus, you agree to these Terms & Conditions. If you do not agree, do not use the app or its optional services.'],
  ['Features and availability', 'Nexus Plus includes accessibility-focused features such as Geeta Nexus, Book Reader, Media Player, Utility Tools, Voice Payment Announcer, Expense Tracker, document tools and Remote Computer. Features may change, be improved, limited or discontinued.'],
  ['Remote Computer', 'Remote Computer requires a compatible desktop agent and an explicit user pairing process. The Android app does not provide a general password-bypass mechanism. Protected operations require the configured protection and authorization controls.'],
  ['Voice commands', 'Voice commands are interpreted to provide supported actions. The service may reject ambiguous, unsupported or unsafe requests. Dynamic voice commands must not be treated as permission to execute arbitrary shell commands or bypass operating-system security.'],
  ['User responsibility', 'You are responsible for the devices, accounts, applications and content that you connect to Nexus Plus. You must keep your phone, desktop agent, protection credentials and operating-system accounts secure and must not authorize access for people who should not control your computer.'],
  ['Third-party services', 'Some features may interact with third-party applications or services, including browsers, meeting applications, messaging applications, media services, payment notifications and operating-system accessibility APIs. Their own terms, permissions and privacy policies also apply. Nexus Plus does not control third-party availability or behavior.'],
  ['Payments and expenses', 'Voice Payment Announcer and Expense Tracker are convenience and accessibility features. They do not provide banking, financial, tax, accounting or investment advice and should not be relied on as the sole source of financial records.'],
  ['Intellectual property', 'Nexus Plus software, branding and original content remain the property of their respective owners. You may use the app only as permitted by applicable law and these terms.'],
  ['Security', 'Nexus Plus is designed with least-privilege and zero-trust principles, but no network or software system can be guaranteed absolutely secure. Keep the app and desktop agent updated and use official releases.'],
  ['Changes', 'These terms may be updated as Nexus Plus features, integrations and legal requirements change. The app will publish the current version of these terms.'],
  ['Contact', 'For support or questions about these terms, contact info@nexusweb.co.in.'],
];

export default function TermsAndConditions() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Terms & Conditions</Text>
        <Text style={[styles.updated, { color: colors.mutedForeground }]}>Nexus Plus terms of use</Text>
      </View>
      {sections.map(([title, body]) => (
        <View key={title} style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text accessibilityRole="header" style={[styles.heading, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 30, fontWeight: '800' },
  updated: { marginTop: 6, fontSize: 12, lineHeight: 18 },
  section: { marginHorizontal: 20, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  heading: { fontSize: 17, fontWeight: '750' },
  body: { marginTop: 8, fontSize: 13, lineHeight: 20 },
});

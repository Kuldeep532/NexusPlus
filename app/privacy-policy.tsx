import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const sections: Array<[string, string]> = [
  ['Nexus Plus features', 'Nexus Plus provides accessibility-focused tools including Geeta Nexus, Book Reader, Media Player, Utility Tools, Voice Payment Announcer, Expense Tracker, document and PDF tools, time tools, radio and Remote Computer. Each feature is designed to process only the data needed for the feature the user enables.'],
  ['Computer Control', 'Computer Control connects the Android app to a user-paired desktop agent. Pairing uses a unique setup code and device-bound cryptographic identity. Protected commands require a fresh challenge and phone authentication. The Protection Password is local to the Android app and is never sent to the desktop.'],
  ['Remote screen, keyboard, mouse and audio', 'When explicitly enabled, the desktop agent can receive authorized keyboard, pointer, clipboard, voice and accessibility commands. Screen, microphone and audio streaming are capability-controlled and must be enabled by the user. Remote commands are not arbitrary shell commands.'],
  ['Voice commands', 'Voice commands are converted into natural-language transcripts and sent only through the authenticated remote command lane when Remote Computer voice input is enabled. Dynamic commands are routed through authorized application or accessibility adapters. Unsupported requests are rejected rather than executed as arbitrary system commands.'],
  ['Voice Payment Announcer', 'The payment announcement feature processes payment notification information needed to announce an incoming payment. Payment information is not sold. Remote Computer does not receive payment data as part of ordinary operation.'],
  ['Expense Tracker', 'Expense records are user-provided financial content. They are used to provide expense tracking and related summaries. They are not shared with the desktop agent as part of ordinary Remote Computer operation.'],
  ['Geeta Nexus, Book Reader and Media Player', 'Content used by Geeta Nexus, Book Reader and Media Player is processed to provide reading, playback and accessibility features. Playback state may be stored locally when required for continuity.'],
  ['Utility and document tools', 'PDF, file, time, radio, voice and other utility features process the files, text, audio or settings required for the requested operation. Private files are not automatically sent to the desktop agent.'],
  ['Security and zero trust', 'Remote Computer uses a zero-trust boundary: the phone does not receive computer passwords, the desktop agent does not receive the phone private key, and sensitive operations require fresh authorization. The app does not use a cloud database as the authority for device pairing or remote-control authentication. Production transports must use authenticated TLS/relay and OS-specific permission controls.'],
  ['Data minimization', 'Nexus Plus does not intentionally place Protection Passwords, password hashes, private signing keys, biometric templates, desktop passwords/PINs, pairing secrets or remote session credentials into its public content service. Sensitive authentication material remains on the device or within the secure operating-system storage used for that purpose.'],
  ['Third-party services', 'Some features can interact with third-party applications or services such as browsers, meeting applications, messaging applications, media services, payment notifications and operating-system accessibility APIs. Those services have their own privacy policies and permissions.'],
  ['User control and deletion', 'Users can disable Remote Computer voice input, disconnect a paired computer and remove locally stored protection and pairing data. You can contact support for questions about personal data handled by Nexus Plus.'],
  ['Contact', 'For privacy questions or support, contact info@nexusweb.co.in. Official company information and support links are available in the in-app Legal & Support page.'],
];

export default function PrivacyPolicy() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Privacy Policy</Text>
        <Text style={[styles.updated, { color: colors.mutedForeground }]}>Nexus Plus privacy and data practices</Text>
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

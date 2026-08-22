import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getFeatureContent } from '@/src/content/contentRepository';

const fallbackSections: Array<[string, string]> = [
  ['Nexus Plus features', 'Nexus Plus provides accessibility-focused tools including Geeta Nexus, Book Reader, Media Player, Utility Tools, Voice Payment Announcer, Expense Tracker, document/PDF tools, time tools, radio and Remote Computer. Each feature is designed to process only the data needed for the feature the user enables.'],
  ['Computer Control', 'Computer Control connects the Android app to a user-paired desktop agent. Pairing uses a unique setup code and device-bound cryptographic identity. Protected commands require a fresh challenge and phone authentication. The Protection Password is local to the Android app and is never sent to the desktop.'],
  ['Remote screen, keyboard, mouse and audio', 'When explicitly enabled, the desktop agent can receive authorized keyboard, pointer, clipboard, voice and accessibility commands. Screen, microphone and audio streaming are capability-controlled and must be enabled by the user. Remote commands are not arbitrary shell commands.'],
  ['Voice commands', 'Voice commands are converted into natural-language transcripts and sent only through the authenticated remote command lane when Remote Computer voice input is enabled. Dynamic commands are routed through authorized application or accessibility adapters. Unsupported requests are rejected rather than executed as arbitrary system commands.'],
  ['Voice Payment Announcer', 'The payment announcement feature processes payment notification information needed to announce an incoming payment. Payment information is not sold. Remote Computer does not receive payment data unless a future feature explicitly requests it and the user authorizes that transfer.'],
  ['Expense Tracker', 'Expense records are user-provided financial content. They are used to provide expense tracking and related summaries. They are not shared with the desktop agent as part of ordinary Remote Computer operation.'],
  ['Geeta Nexus, Book Reader and Media Player', 'Content used by Geeta Nexus, Book Reader and Media Player is processed to provide reading, playback and accessibility features. Playback state may be stored locally when required for continuity.'],
  ['Utility and document tools', 'PDF, file, time, radio, voice and other utility features process the files, text, audio or settings required for the requested operation. Private files are not automatically sent to the desktop agent.'],
  ['Supabase content service', 'Nexus Plus may read public, enabled application content and desktop-agent release metadata from Supabase. The mobile client has read-only access through the publishable/anonymous key. Supabase tables must never contain passwords, private keys, biometric templates, pairing secrets or other authentication credentials. Publishing is restricted to a trusted administrative/server context.'],
  ['Security', 'Remote Computer uses a zero-trust boundary: the phone does not receive computer passwords, the desktop agent does not receive the phone private key, and sensitive operations require fresh authorization. Development transports must not be exposed directly to the public internet; production deployment requires authenticated TLS/relay, signed installers and OS-specific permission controls.'],
  ['User control and deletion', 'Users can disable Remote Computer voice input, disconnect a paired computer and remove locally stored protection/pairing data. Content controlled through Supabase should be removed or updated from the trusted administrative environment.'],
];

export default function PrivacyPolicy() {
  const colors = useColors(); const insets = useSafeAreaInsets();
  const [sections, setSections] = useState(fallbackSections);
  useEffect(() => { let active = true; void getFeatureContent('privacy', 'en').then((rows) => { if (!active || rows.length === 0) return; const dynamic = rows.flatMap((row) => { const value = row.value as { title?: unknown; body?: unknown }; return typeof value?.title === 'string' && typeof value?.body === 'string' ? [[value.title, value.body] as [string, string]] : []; }); if (dynamic.length) setSections(dynamic); }).catch(() => undefined); return () => { active = false; }; }, []);
  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Privacy Policy</Text><Text style={[styles.updated, { color: colors.mutedForeground }]}>Nexus Plus feature and Remote Computer privacy</Text></View>
    {sections.map(([title, body]) => <View key={title} style={[styles.section, { borderBottomColor: colors.border }]}><Text accessibilityRole="header" style={[styles.heading, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{body}</Text></View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, header: { paddingHorizontal: 20, marginBottom: 12 }, title: { fontSize: 30, fontWeight: '800' }, updated: { marginTop: 6, fontSize: 12, lineHeight: 18 }, section: { marginHorizontal: 20, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth }, heading: { fontSize: 17, fontWeight: '750' }, body: { marginTop: 8, fontSize: 13, lineHeight: 20 } });

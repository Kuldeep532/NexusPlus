import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const SETTINGS = [
  { title: 'Language & preferences', description: 'Language, accessibility and general preferences.', route: '/language-and-preference', icon: 'globe' as const },
  { title: 'Biometric Vault', description: 'Manage secure biometric protection.', route: '/biometric-vault', icon: 'shield' as const },
  { title: 'Payment Announcer', description: 'Configure secure payment announcements.', route: '/payment-announcer', icon: 'volume-2' as const },
  { title: 'Expense Tracker', description: 'Manage expense detection and financial privacy.', route: '/expense-tracker', icon: 'credit-card' as const },
  { title: 'Security', description: 'Review privacy and app security controls.', route: '/security', icon: 'lock' as const },
];

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 88 }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Control how Nexus Plus behaves and protect your data.</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>App behavior</Text>
          <View style={styles.row}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Haptic feedback</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Use touch feedback for important actions.</Text></View><Switch value onValueChange={() => undefined} accessibilityLabel="Haptic feedback" /></View>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>Feature settings</Text>
        <View style={styles.list}>
          {SETTINGS.map((item) => <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.description}`} onPress={() => router.push(item.route as never)} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={item.icon} size={19} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{item.description}</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground} /></Pressable>)}
        </View>
      </ScrollView>
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Home" style={styles.tab} onPress={() => router.replace('/home' as never)}><Feather name="home" size={20} color={colors.foreground} /><Text style={[styles.tabText, { color: colors.foreground }]}>Home</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" style={styles.tab} onPress={() => router.replace('/settings' as never)}><Feather name="settings" size={20} color={colors.primary} /><Text style={[styles.tabText, { color: colors.primary }]}>Settings</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, content: { paddingHorizontal: 18 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 6 }, subtitle: { fontSize: 12, lineHeight: 18 }, card: { marginTop: 18, borderRadius: 18, borderWidth: 1, padding: 16 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 10 }, row: { flexDirection: 'row', alignItems: 'center' }, copy: { flex: 1, marginRight: 12 }, rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, body: { fontSize: 11, lineHeight: 16 }, list: { gap: 10 }, item: { minHeight: 70, borderRadius: 17, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center' }, icon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 64, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }, tab: { minWidth: 90, alignItems: 'center', gap: 3 }, tabText: { fontSize: 10, fontFamily: 'Inter_700Bold' }, });

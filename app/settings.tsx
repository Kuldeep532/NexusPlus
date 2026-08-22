import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getLaunchRoute, readLaunchPreferences, writeLaunchPreferences, type LaunchTarget } from '@/features/app-shell/launchPreferences';

const SETTINGS = [
  { title: 'Language & preferences', description: 'Language, accessibility and general preferences.', route: '/language-and-preference', icon: 'globe' as const },
  { title: 'Biometric Vault', description: 'Manage secure biometric protection.', route: '/biometric-vault', icon: 'shield' as const },
  { title: 'Payment Announcer', description: 'Configure secure payment announcements.', route: '/payment-announcer', icon: 'volume-2' as const },
  { title: 'Expense Tracker', description: 'Manage expense detection and financial privacy.', route: '/expense-tracker', icon: 'credit-card' as const },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [launchTarget, setLaunchTarget] = useState<LaunchTarget>('nexus-plus');
  const [showGeetaNexusOnHome, setShowGeetaNexusOnHome] = useState(true);

  useEffect(() => {
    void readLaunchPreferences().then((preferences) => {
      setLaunchTarget(preferences.launchTarget);
      setShowGeetaNexusOnHome(preferences.showGeetaNexusOnHome);
    });
  }, []);

  const updateLaunchTarget = async (target: LaunchTarget) => {
    setLaunchTarget(target);
    await writeLaunchPreferences({ launchTarget: target, showGeetaNexusOnHome });
  };

  const updateHomeVisibility = async (value: boolean) => {
    setShowGeetaNexusOnHome(value);
    await writeLaunchPreferences({ launchTarget, showGeetaNexusOnHome: value });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 88 }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Control how Nexus Plus and Geeta Nexus behave.</Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select One to Open</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Choose which experience opens after the splash screen when you already have an active login.</Text>
          <View style={styles.modeList}>
            {([
              ['nexus-plus', 'Nexus Plus', 'Opens the main Nexus Plus Home screen.'],
              ['geeta-nexus', 'Geeta Nexus', 'Opens the Bhagavad Gita experience directly.'],
            ] as const).map(([value, title, description]) => (
              <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: launchTarget === value }} accessibilityLabel={`${title}. ${description}`} onPress={() => void updateLaunchTarget(value)} style={[styles.modeItem, { borderColor: launchTarget === value ? colors.primary : colors.border, backgroundColor: launchTarget === value ? colors.secondary : colors.card }]}>
                <View style={[styles.radio, { borderColor: launchTarget === value ? colors.primary : colors.mutedForeground }]}>{launchTarget === value ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
                <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{description}</Text></View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Home Screen</Text>
          <View style={styles.row}>
            <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Show Geeta Nexus on Home</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Keep Geeta Nexus available as a top-level Home feature even when Nexus Plus is selected as the launch experience.</Text></View>
            <Switch value={showGeetaNexusOnHome} onValueChange={(value) => { void updateHomeVisibility(value); }} accessibilityLabel="Show Geeta Nexus on Home" />
          </View>
        </View>

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

const styles = StyleSheet.create({ root: { flex: 1 }, content: { paddingHorizontal: 18 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 6 }, subtitle: { fontSize: 12, lineHeight: 18 }, card: { marginTop: 18, borderRadius: 18, borderWidth: 1, padding: 16 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 8 }, row: { flexDirection: 'row', alignItems: 'center' }, copy: { flex: 1, marginRight: 12 }, rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, body: { fontSize: 11, lineHeight: 16 }, list: { gap: 10 }, modeList: { gap: 10, marginTop: 8 }, modeItem: { minHeight: 72, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center' }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, radioDot: { width: 10, height: 10, borderRadius: 5 }, item: { minHeight: 70, borderRadius: 17, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center' }, icon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 64, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 }, tab: { minWidth: 90, alignItems: 'center', gap: 3 }, tabText: { fontSize: 10, fontFamily: 'Inter_700Bold' }, });

import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, refreshThemeColor } from '@/hooks/useColors';
import { readThemeColor, writeThemeColor, type ThemeColor } from '@/features/app-shell/themePreferences';
import { readLaunchPreferences, writeLaunchPreferences, type LaunchTarget } from '@/features/app-shell/launchPreferences';

type LauncherState = 'setup' | 'open-settings';

const SETTINGS = [
  { title: 'Nexus Launcher', description: 'Set up Nexus Launcher, choose its home layout and manage launcher preferences.', action: 'launcher' as const, icon: 'grid' as const },
  { title: 'Language & preferences', description: 'Language, accessibility and general preferences.', route: '/language-and-preference', icon: 'globe' as const },
  { title: 'Biometric Vault', description: 'Manage secure biometric protection.', route: '/biometric-vault', icon: 'shield' as const },
  { title: 'Payment Announcer', description: 'Configure secure payment announcements.', route: '/payment-announcer', icon: 'volume-2' as const },
  { title: 'Expense Tracker', description: 'Manage expense detection and financial privacy.', route: '/expense-tracker', icon: 'credit-card' as const },
];

const LEGAL_SETTINGS = [
  { title: 'Privacy Policy', description: 'How Nexus Plus handles data, permissions, analytics, APIs and security.', route: '/privacy-policy', icon: 'lock' as const },
  { title: 'Terms & Conditions', description: 'Rules for safe, lawful and responsible use of Nexus Plus.', route: '/terms-and-conditions', icon: 'file-text' as const },
  { title: 'About Nexus Wave Technologies', description: 'Our mission, accessibility vision and the story behind Nexus Plus.', route: '/about-us', icon: 'info' as const },
];

const THEME_OPTIONS: Array<{ value: ThemeColor; title: string; description: string }> = [
  { value: 'ocean-blue', title: 'Ocean Blue', description: 'Ocean blue with devotional gold accents, following Light or Dark appearance.' },
  { value: 'classic', title: 'Classic', description: 'The original Nexus Plus green palette, following Light or Dark appearance.' },
  { value: 'light', title: 'Light Mode', description: 'Always use a clean light palette.' },
  { value: 'dark', title: 'Dark Mode', description: 'Always use a comfortable dark palette.' },
  { value: 'system', title: 'System Color', description: 'Automatically follows your device Light or Dark appearance.' },
];

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [launchTarget, setLaunchTarget] = useState<LaunchTarget>('nexus-plus');
  const [showGeetaNexusOnHome, setShowGeetaNexusOnHome] = useState(true);
  const [themeColor, setThemeColor] = useState<ThemeColor>('ocean-blue');
  const [launcherState, setLauncherState] = useState<LauncherState>('setup');

  useEffect(() => {
    void Promise.all([readLaunchPreferences(), readThemeColor()]).then(([preferences, theme]) => {
      setLaunchTarget(preferences.launchTarget);
      setShowGeetaNexusOnHome(preferences.showGeetaNexusOnHome);
      setThemeColor(theme);
    });
    // The native launcher is deliberately selected by the user through Android's Home role.
    // We persist the setup/opening state only after the native launcher confirms it is enabled.
    void Linking.getInitialURL().then(() => undefined);
  }, []);

  const updateLaunchTarget = async (target: LaunchTarget) => {
    setLaunchTarget(target);
    await writeLaunchPreferences({ launchTarget: target, showGeetaNexusOnHome });
  };

  const updateHomeVisibility = async (value: boolean) => {
    setShowGeetaNexusOnHome(value);
    await writeLaunchPreferences({ launchTarget, showGeetaNexusOnHome: value });
  };

  const updateThemeColor = async (theme: ThemeColor) => {
    setThemeColor(theme);
    refreshThemeColor(theme);
    await writeThemeColor(theme);
  };

  const openLauncherSettings = () => {
    router.push({ pathname: '/nexus-launcher-settings', params: { source: launcherState } });
  };

  const launcherTitle = launcherState === 'open-settings' ? 'Open Nexus Launcher Settings' : 'Set up Nexus Launcher';
  const launcherDescription = launcherState === 'open-settings'
    ? 'Open the dedicated Nexus Launcher settings screen.'
    : 'Set up Nexus Launcher, choose its Home layout and manage launcher preferences.';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.headerRow}>
          <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Settings</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Control Nexus Plus appearance and behavior.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={[styles.profileButton, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name="user" size={21} color={colors.foreground} /></Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 12 }]}>Launcher</Text>
        <View style={styles.list}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Nexus Launcher. ${launcherDescription}`} onPress={openLauncherSettings} style={[styles.item, styles.featuredItem, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="grid" size={19} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{launcherTitle}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{launcherDescription}</Text></View>
            <Feather name="chevron-right" size={19} color={colors.mutedForeground} accessibilityElementsHidden />
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose Theme Color</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>One semantic palette is shared across every feature, so new screens inherit the selected colors automatically.</Text>
          <View style={styles.modeList}>
            {THEME_OPTIONS.map((option) => (
              <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: themeColor === option.value }} accessibilityLabel={`${option.title}. ${option.description}`} onPress={() => void updateThemeColor(option.value)} style={[styles.modeItem, { borderColor: themeColor === option.value ? colors.primary : colors.border, backgroundColor: themeColor === option.value ? colors.secondary : colors.card }]}>
                <View style={[styles.radio, { borderColor: themeColor === option.value ? colors.primary : colors.mutedForeground }]}>{themeColor === option.value ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
                <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{option.title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{option.description}</Text></View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select One to Open</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Choose which experience opens after the splash screen when you already have an active login.</Text>
          <View style={styles.modeList}>
            {([
              ['nexus-plus', 'Nexus Plus', 'Opens the main Nexus Plus Home experience.'],
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
            <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Show Geeta Nexus on Home</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Keep Geeta Nexus available as a top-level feature when Nexus Plus is selected.</Text></View>
            <Switch value={showGeetaNexusOnHome} onValueChange={(value) => { void updateHomeVisibility(value); }} accessibilityLabel="Show Geeta Nexus on Home" />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>App behavior</Text>
          <View style={styles.row}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Haptic feedback</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Use touch feedback for important actions.</Text></View><Switch value onValueChange={() => undefined} accessibilityLabel="Haptic feedback" /></View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 20 }]}>Feature settings</Text>
        <View style={styles.list}>
          {SETTINGS.slice(1).map((item) => <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.description}`} onPress={() => router.push(item.route as never)} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={item.icon} size={19} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{item.description}</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground} accessibilityElementsHidden /></Pressable>)}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 22 }]}>Privacy & About</Text>
        <View style={styles.list}>
          {LEGAL_SETTINGS.map((item) => <Pressable key={item.route} accessibilityRole="button" accessibilityLabel={`${item.title}. ${item.description}`} onPress={() => router.push(item.route as never)} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name={item.icon} size={19} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{item.description}</Text></View><Feather name="chevron-right" size={19} color={colors.mutedForeground} accessibilityElementsHidden /></Pressable>)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 18 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 }, copy: { flex: 1, marginRight: 12 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold', marginBottom: 6 }, subtitle: { fontSize: 12, lineHeight: 18 }, card: { marginTop: 18, borderRadius: 18, borderWidth: 1, padding: 16 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 8 }, row: { flexDirection: 'row', alignItems: 'center' }, rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, body: { fontSize: 11, lineHeight: 16 }, list: { gap: 10 }, modeList: { gap: 10, marginTop: 8 }, modeItem: { minHeight: 72, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center' }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, radioDot: { width: 10, height: 10, borderRadius: 5 }, item: { minHeight: 70, borderRadius: 17, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center' }, featuredItem: { borderWidth: 1.5 }, icon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});

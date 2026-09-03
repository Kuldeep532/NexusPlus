import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type LauncherMode = 'APP_DRAWER_PLUS_HOME' | 'HOME_ONLY';

type LauncherPrefs = {
  mode: LauncherMode;
  weather: boolean;
  googleSearch: boolean;
};

export default function NexusLauncherSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<LauncherPrefs>({ mode: 'APP_DRAWER_PLUS_HOME', weather: true, googleSearch: true });

  const updatePrefs = (patch: Partial<LauncherPrefs>) => setPrefs((current) => ({ ...current, ...patch }));
  const openSystemHomeSettings = async () => { await Linking.openSettings(); };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Settings" onPress={() => router.back()} style={[styles.back, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="arrow-left" size={19} color={colors.foreground} /></Pressable>
          <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Launcher</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Simple, private, focused.</Text></View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="grid" size={24} color={colors.primary} /></View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Set up Nexus Launcher</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Nexus Launcher is never selected automatically. Android must explicitly grant it the Home role.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose Nexus Launcher as the default home app" onPress={() => void openSystemHomeSettings()} style={[styles.primaryButton, { backgroundColor: colors.foreground }]}><Text style={[styles.primaryButtonText, { color: colors.background }]}>Choose Default Launcher</Text></Pressable>
          <Text style={[styles.helper, { color: colors.mutedForeground }]}>This opens the Android system Home/default-app settings. Nexus Plus does not silently change your choice.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Home layout</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Choose the clean launcher layout you prefer.</Text>
          {([
            ['APP_DRAWER_PLUS_HOME', 'App Drawer + Home Screen', 'Show the intelligent Home surface and full App Drawer.'],
            ['HOME_ONLY', 'Home Screen Only', 'Keep the Home screen minimal and hide the App Drawer entry.'],
          ] as const).map(([value, title, description]) => (
            <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: prefs.mode === value }} accessibilityLabel={`${title}. ${description}`} onPress={() => updatePrefs({ mode: value })} style={[styles.option, { borderColor: prefs.mode === value ? colors.primary : colors.border, backgroundColor: prefs.mode === value ? colors.secondary : colors.card }]}>
              <View style={[styles.radio, { borderColor: prefs.mode === value ? colors.primary : colors.mutedForeground }]}>{prefs.mode === value ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
              <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>{description}</Text></View>
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Optional Home features</Text>
          <View style={styles.row}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Weather</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Show weather when the launcher has a supported local source.</Text></View><Switch value={prefs.weather} onValueChange={(value) => updatePrefs({ weather: value })} accessibilityLabel="Show weather" /></View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.row}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Google Search</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Show Google Search and voice search controls.</Text></View><Switch value={prefs.googleSearch} onValueChange={(value) => updatePrefs({ googleSearch: value })} accessibilityLabel="Show Google Search" /></View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Privacy-first behavior</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>The launcher does not need an external API for its core Home, App Drawer, default-launcher or local recommendation features.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 18 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, copy: { flex: 1, marginRight: 10 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18 }, hero: { borderRadius: 20, borderWidth: 1.5, padding: 18 }, heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 7 }, body: { fontSize: 11, lineHeight: 17 }, helper: { fontSize: 10, lineHeight: 15, marginTop: 9 }, primaryButton: { minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 14 }, primaryButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, card: { marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 16 }, option: { minHeight: 70, borderRadius: 15, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', marginTop: 10 }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, radioDot: { width: 10, height: 10, borderRadius: 5 }, row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }, rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, divider: { height: 1, marginVertical: 8 },
});

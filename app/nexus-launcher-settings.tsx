import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type LauncherMode = 'APP_DRAWER_PLUS_HOME' | 'HOME_ONLY';
type FocusWindow = { start: number; end: number };
type FocusGateState = { enabled: boolean; cooldownMinutes: number; blockedPackages: string[]; windows: FocusWindow[] };
type NativeFocusGate = {
  getState?: () => Promise<FocusGateState>;
  setEnabled?: (enabled: boolean) => Promise<boolean>;
  setCooldownMinutes?: (minutes: number) => Promise<boolean>;
  setFocusWindow?: (startHour: number, endHour: number) => Promise<boolean>;
};
const nativeModules = (globalThis as { __nexusNativeModules?: { NexusLauncherFocusGate?: NativeFocusGate } }).__nexusNativeModules;
const NativeFocusGateModule = nativeModules?.NexusLauncherFocusGate;
const DEFAULT_FOCUS: FocusGateState = { enabled: false, cooldownMinutes: 10, blockedPackages: [], windows: [{ start: 9, end: 13 }] };

export default function NexusLauncherSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [focus, setFocus] = useState(DEFAULT_FOCUS);

  useEffect(() => {
    void NativeFocusGateModule?.getState?.().then((value) => {
      if (value) setFocus({ ...DEFAULT_FOCUS, ...value });
    });
  }, []);

  const openSystemHomeSettings = async () => { await Linking.openSettings(); };
  const toggleFocus = (value: boolean) => { setFocus((state) => ({ ...state, enabled: value })); void NativeFocusGateModule?.setEnabled?.(value); };
  const adjustCooldown = (delta: number) => {
    const next = Math.min(60, Math.max(1, focus.cooldownMinutes + delta));
    setFocus((state) => ({ ...state, cooldownMinutes: next }));
    void NativeFocusGateModule?.setCooldownMinutes?.(next);
  };
  const cycleWindow = () => {
    const current = focus.windows[0] ?? DEFAULT_FOCUS.windows[0];
    const windows: FocusWindow[] = [{ start: 9, end: 13 }, { start: 9, end: 17 }, { start: 18, end: 22 }, { start: 22, end: 7 }];
    const index = windows.findIndex((item) => item.start === current.start && item.end === current.end);
    const next = windows[(index + 1) % windows.length];
    setFocus((state) => ({ ...state, windows: [next] }));
    void NativeFocusGateModule?.setFocusWindow?.(next.start, next.end);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.headerRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={[styles.back, { borderColor: colors.border, backgroundColor: colors.card }]}><Feather name="arrow-left" size={19} color={colors.foreground} /></Pressable>
          <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Launcher Settings</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Launcher-only controls</Text></View>
        </View>
        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}><Feather name="grid" size={24} color={colors.primary} /></View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Default launcher</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Use Android’s Home settings to choose Nexus Launcher. It is never selected automatically.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose Nexus Launcher as default" onPress={() => void openSystemHomeSettings()} style={[styles.primaryButton, { backgroundColor: colors.foreground }]}><Text style={[styles.primaryButtonText, { color: colors.background }]}>Choose Default Launcher</Text></Pressable>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Focus Gate</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Launcher-only opening protection for apps you choose. The state remains local to this device.</Text>
          <View style={styles.row}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Enable Focus Gate</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Protected apps pause during your focus window.</Text></View><Switch value={focus.enabled} onValueChange={toggleFocus} accessibilityLabel="Enable Focus Gate" /></View>
          <View style={[styles.control, { borderColor: colors.border }]}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Focus window</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Current: {formatWindow(focus.windows[0] ?? DEFAULT_FOCUS.windows[0])}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Change Focus window" onPress={cycleWindow} style={[styles.smallButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>Change</Text></Pressable></View>
          <View style={[styles.control, { borderColor: colors.border }]}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Temporary pause</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Allow one protected app for a short local cooldown.</Text></View><View style={styles.stepper}><Pressable accessibilityRole="button" accessibilityLabel="Decrease cooldown" onPress={() => adjustCooldown(-5)} style={[styles.stepButton, { borderColor: colors.border }]}><Text style={[styles.stepText, { color: colors.foreground }]}>−</Text></Pressable><Text accessibilityLabel={`${focus.cooldownMinutes} minute cooldown`} style={[styles.stepValue, { color: colors.foreground }]}>{focus.cooldownMinutes}m</Text><Pressable accessibilityRole="button" accessibilityLabel="Increase cooldown" onPress={() => adjustCooldown(5)} style={[styles.stepButton, { borderColor: colors.border }]}><Text style={[styles.stepText, { color: colors.foreground }]}>+</Text></Pressable></View></View>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Home & App Drawer</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Nexus Launcher Settings is available from both the launcher Home screen and App Drawer. This screen controls only launcher behavior.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function formatWindow(window: FocusWindow): string { const pad = (value: number) => String(value).padStart(2, '0'); return `${pad(window.start)}:00–${pad(window.end)}:00`; }
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 18 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, copy: { flex: 1, marginRight: 10 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18 }, hero: { borderRadius: 20, borderWidth: 1.5, padding: 18 }, heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 7 }, body: { fontSize: 11, lineHeight: 17 }, card: { marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }, rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, control: { marginTop: 12, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center' }, smallButton: { minWidth: 78, minHeight: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, smallButtonText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 }, stepButton: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, stepText: { fontSize: 20 }, stepValue: { minWidth: 34, textAlign: 'center', fontSize: 12, fontFamily: 'Inter_700Bold' }, primaryButton: { minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 14 }, primaryButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});

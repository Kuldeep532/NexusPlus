import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type LauncherMode = 'APP_DRAWER_PLUS_HOME' | 'HOME_ONLY';

type FocusWindow = { start: number; end: number };

type FocusGateState = {
  enabled: boolean;
  cooldownMinutes: number;
  blockedPackages: string[];
  windows: FocusWindow[];
};

type NativeFocusGate = {
  getState?: (callback?: unknown) => Promise<FocusGateState>;
  setEnabled?: (enabled: boolean) => Promise<boolean>;
  setCooldownMinutes?: (minutes: number) => Promise<boolean>;
  setFocusWindow?: (startHour: number, endHour: number) => Promise<boolean>;
};

const NativeModulesAny = (globalThis as { __nexusNativeModules?: { NexusLauncherFocusGate?: NativeFocusGate } }).__nexusNativeModules;
const NativeFocusGateModule = NativeModulesAny?.NexusLauncherFocusGate;

const DEFAULT_FOCUS: FocusGateState = { enabled: false, cooldownMinutes: 10, blockedPackages: [], windows: [{ start: 9, end: 13 }] };

function applyNative(module: NativeFocusGate | undefined, method: keyof NativeFocusGate, args: unknown[] = []) {
  const fn = module?.[method];
  return typeof fn === 'function' ? Promise.resolve(fn(...args as never[])) : Promise.resolve(null);
}

export default function NexusLauncherSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [focus, setFocus] = useState<FocusGateState>(DEFAULT_FOCUS);

  useEffect(() => {
    void applyNative(NativeFocusGateModule, 'getState').then((value) => {
      if (value && typeof value === 'object') setFocus({ ...DEFAULT_FOCUS, ...(value as FocusGateState) });
    });
  }, []);

  const openSystemHomeSettings = async () => { await Linking.openSettings(); };
  const toggleFocus = (value: boolean) => {
    setFocus((current) => ({ ...current, enabled: value }));
    void applyNative(NativeFocusGateModule, 'setEnabled', [value]);
  };
  const adjustCooldown = (delta: number) => {
    const next = Math.min(60, Math.max(1, focus.cooldownMinutes + delta));
    setFocus((current) => ({ ...current, cooldownMinutes: next }));
    void applyNative(NativeFocusGateModule, 'setCooldownMinutes', [next]);
  };
  const cycleWindow = () => {
    const current = focus.windows[0] ?? DEFAULT_FOCUS.windows[0];
    const windows: FocusWindow[] = [
      { start: 9, end: 13 },
      { start: 9, end: 17 },
      { start: 18, end: 22 },
      { start: 22, end: 7 },
    ];
    const index = windows.findIndex((item) => item.start === current.start && item.end === current.end);
    const next = windows[(index + 1) % windows.length];
    setFocus((state) => ({ ...state, windows: [next] }));
    void applyNative(NativeFocusGateModule, 'setFocusWindow', [next.start, next.end]);
  };

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
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Focus Gate</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Nexus-specific app-opening friction. It works locally in the launcher instead of depending on Digital Wellbeing or a cloud service.</Text>
          <View style={[styles.row, { marginTop: 8 }]}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Enable Focus Gate</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Selected apps are paused during your focus window.</Text></View><Switch value={focus.enabled} onValueChange={toggleFocus} accessibilityLabel="Enable Nexus Focus Gate" /></View>

          <View style={[styles.control, { borderColor: colors.border }]}>
            <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Focus window</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Current: {formatWindow(focus.windows[0] ?? DEFAULT_FOCUS.windows[0])}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Change Focus Gate window" onPress={cycleWindow} style={[styles.smallButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}><Text style={[styles.smallButtonText, { color: colors.foreground }]}>Change</Text></Pressable>
          </View>

          <View style={[styles.control, { borderColor: colors.border }]}>
            <View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Temporary pause</Text><Text style={[styles.body, { color: colors.mutedForeground }]}>Pause one protected app for a short, local cooldown.</Text></View>
            <View style={styles.stepper}><Pressable accessibilityRole="button" accessibilityLabel="Reduce pause time" onPress={() => adjustCooldown(-5)} style={[styles.stepButton, { borderColor: colors.border }]}><Text style={[styles.stepText, { color: colors.foreground }]}>−</Text></Pressable><Text accessibilityLabel={`${focus.cooldownMinutes} minute pause`} style={[styles.stepValue, { color: colors.foreground }]}>{focus.cooldownMinutes}m</Text><Pressable accessibilityRole="button" accessibilityLabel="Increase pause time" onPress={() => adjustCooldown(5)} style={[styles.stepButton, { borderColor: colors.border }]}><Text style={[styles.stepText, { color: colors.foreground }]}>+</Text></Pressable></View>
          </View>

          <Text style={[styles.helper, { color: colors.mutedForeground }]}>App selection is configured directly from the launcher so the privacy-sensitive package list stays on-device.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Optional Home features</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Weather, Google Search and voice search remain optional launcher elements.</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Privacy-first behavior</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Focus Gate stores its settings locally on this phone. No external API is required for the launcher’s protection logic.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function formatWindow(window: FocusWindow): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(window.start)}:00–${pad(window.end)}:00`;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 18 }, headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 }, back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, copy: { flex: 1, marginRight: 10 }, title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 }, subtitle: { fontSize: 12, lineHeight: 18 }, hero: { borderRadius: 20, borderWidth: 1.5, padding: 18 }, heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 7 }, body: { fontSize: 11, lineHeight: 17 }, helper: { fontSize: 10, lineHeight: 15, marginTop: 9 }, primaryButton: { minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 14 }, primaryButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' }, card: { marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 16 }, row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }, rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, control: { marginTop: 12, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center' }, smallButton: { minWidth: 78, minHeight: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, smallButtonText: { fontSize: 12, fontFamily: 'Inter_700Bold' }, stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 }, stepButton: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, stepText: { fontSize: 20 }, stepValue: { minWidth: 34, textAlign: 'center', fontSize: 12, fontFamily: 'Inter_700Bold' },
});

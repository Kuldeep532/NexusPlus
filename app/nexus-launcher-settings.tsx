import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, NativeModules, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type FocusWindow = { start: number; end: number };
type FocusGateState = {
  enabled: boolean;
  launcherDefault: boolean;
  cooldownMinutes: number;
  blockedPackages: string[];
  focusWindows: FocusWindow[];
  savedToday: number;
};
type NativeFocusGate = {
  getState: () => Promise<FocusGateState>;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  setCooldownMinutes: (minutes: number) => Promise<boolean>;
  setFocusWindow: (startHour: number, endHour: number) => Promise<boolean>;
};

const NativeFocusGateModule = NativeModules.NexusLauncherFocusGate as NativeFocusGate | undefined;
const DEFAULT_FOCUS: FocusGateState = {
  enabled: false,
  launcherDefault: false,
  cooldownMinutes: 10,
  blockedPackages: [],
  focusWindows: [{ start: 9, end: 13 }],
  savedToday: 0,
};

export default function NexusLauncherSettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [focus, setFocus] = useState(DEFAULT_FOCUS);

  useEffect(() => {
    let active = true;
    void NativeFocusGateModule?.getState().then((value) => {
      if (active && value) setFocus({ ...DEFAULT_FOCUS, ...value });
    });
    return () => {
      active = false;
    };
  }, []);

  const openSystemHomeSettings = async () => {
    await Linking.openSettings();
  };

  const toggleFocus = (value: boolean) => {
    setFocus((state) => ({ ...state, enabled: value }));
    void NativeFocusGateModule?.setEnabled(value);
  };

  const adjustCooldown = (delta: number) => {
    const next = Math.min(60, Math.max(1, focus.cooldownMinutes + delta));
    setFocus((state) => ({ ...state, cooldownMinutes: next }));
    void NativeFocusGateModule?.setCooldownMinutes(next);
  };

  const cycleWindow = () => {
    const current = focus.focusWindows[0] ?? DEFAULT_FOCUS.focusWindows[0];
    const windows: FocusWindow[] = [
      { start: 9, end: 13 },
      { start: 9, end: 17 },
      { start: 18, end: 22 },
      { start: 22, end: 7 },
    ];
    const index = windows.findIndex(
      (item) => item.start === current.start && item.end === current.end,
    );
    const next = windows[(index + 1) % windows.length];
    setFocus((state) => ({ ...state, focusWindows: [next] }));
    void NativeFocusGateModule?.setFocusWindow(next.start, next.end);
  };

  const launcherTitle = focus.launcherDefault
    ? 'Open Nexus Launcher Settings'
    : 'Set up Nexus Launcher';
  const launcherDescription = focus.launcherDefault
    ? 'Nexus Launcher is your current Home app. These controls are separate from normal Nexus Plus settings.'
    : 'Choose Nexus Launcher from Android Home settings. Nexus Plus never changes the default automatically.';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 28,
        }}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={[styles.back, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Feather name="arrow-left" size={19} color={colors.foreground} />
          </Pressable>
          <View style={styles.copy}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>
              Nexus Launcher Settings
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Launcher and protection controls</Text>
          </View>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="shield" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{launcherTitle}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{launcherDescription}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Android Home settings"
            onPress={() => void openSystemHomeSettings()}
            style={[styles.primaryButton, { backgroundColor: colors.foreground }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.background }]}>Open Android Home Settings</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nexus Focus Gate</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            This local policy can protect selected distracting apps inside Nexus Plus even when Nexus Launcher is not the current Home app.
          </Text>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Enable protection</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>Use the same local Gate policy from Nexus Plus.</Text>
            </View>
            <Switch value={focus.enabled} onValueChange={toggleFocus} accessibilityLabel="Enable Nexus Focus Gate" />
          </View>
          <View style={styles.progressBox}>
            <Text style={[styles.progressTitle, { color: colors.foreground }]}>Saved distractions today</Text>
            <Text style={[styles.progressValue, { color: colors.primary }]}>{focus.savedToday}</Text>
          </View>
          <View style={[styles.control, { borderColor: colors.border }]}>
            <View style={styles.copy}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Focus window</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>Current: {formatWindow(focus.focusWindows[0] ?? DEFAULT_FOCUS.focusWindows[0])}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change Focus window"
              onPress={cycleWindow}
              style={[styles.smallButton, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Text style={[styles.smallButtonText, { color: colors.foreground }]}>Change</Text>
            </Pressable>
          </View>
          <View style={[styles.control, { borderColor: colors.border }]}>
            <View style={styles.copy}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Temporary pause</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>A short local cooldown can be granted after an explicit interruption.</Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Decrease cooldown"
                onPress={() => adjustCooldown(-5)}
                style={[styles.stepButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.stepText, { color: colors.foreground }]}>−</Text>
              </Pressable>
              <Text accessibilityLabel={`${focus.cooldownMinutes} minute cooldown`} style={[styles.stepValue, { color: colors.foreground }]}>
                {focus.cooldownMinutes}m
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Increase cooldown"
                onPress={() => adjustCooldown(5)}
                style={[styles.stepButton, { borderColor: colors.border }]}
              >
                <Text style={[styles.stepText, { color: colors.foreground }]}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>How protection is applied</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Launcher mode: protected apps can be intercepted before launch. Nexus Plus mode: the same local policy can be consulted by Nexus Plus screens that start external apps.</Text>
          <Text style={[styles.body, { color: colors.mutedForeground, marginTop: 8 }]}>This stage does not silently install an accessibility service or force-stop other apps. Those Android capabilities require explicit system-level user permission and are being kept as a separate later stage.</Text>
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
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  copy: { flex: 1, marginRight: 10 },
  title: { fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  subtitle: { fontSize: 12, lineHeight: 18 },
  hero: { borderRadius: 20, borderWidth: 1.5, padding: 18 },
  heroIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  body: { fontSize: 11, lineHeight: 17 },
  card: { marginTop: 16, borderRadius: 18, borderWidth: 1, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingTop: 10 },
  rowTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  control: { marginTop: 12, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center' },
  progressBox: { marginTop: 12, borderRadius: 14, padding: 13, borderWidth: 1 },
  progressTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  progressValue: { fontSize: 26, fontFamily: 'Inter_700Bold', marginTop: 4 },
  smallButton: { minWidth: 78, minHeight: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  smallButtonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepButton: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 20 },
  stepValue: { minWidth: 34, textAlign: 'center', fontSize: 12, fontFamily: 'Inter_700Bold' },
  primaryButton: { minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});

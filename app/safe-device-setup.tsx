import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { NativeModules } from 'react-native';

const SafetyGate = NativeModules.NexusSafetyGate as {
  getState: () => Promise<{ acknowledged: boolean; accessibilityEnabled: boolean; ready: boolean }>;
  acknowledge: () => Promise<boolean>;
  openAccessibilitySettings: () => Promise<boolean>;
} | undefined;

export default function SafeDeviceSetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const state = await SafetyGate?.getState();
    if (state) setAccessibilityEnabled(state.accessibilityEnabled);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const allowProtection = async () => {
    setBusy(true);
    try {
      await SafetyGate?.acknowledge();
      await SafetyGate?.openAccessibilitySettings();
    } finally {
      setBusy(false);
    }
  };

  const continueToApp = async () => {
    const state = await SafetyGate?.getState();
    if (!state?.ready) return;
    router.replace('/login-plus-register');
  };

  const uninstall = async () => {
    await Linking.openURL('package:com.nexuswavetech.nexusplus').catch(() => undefined);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 }]}>
      <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
        <Feather name="shield" size={30} color={colors.primary} />
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Safe Environment</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Protection setup is required before Nexus Plus account access.</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <Text style={[styles.heading, { color: colors.foreground }]}>Why this permission is needed</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Nexus Plus includes a safety layer designed to help create a safer digital environment. With your explicit permission, the Nexus Safety Accessibility Service can inspect supported on-screen context and apply the local protection rules you have chosen.</Text>
        <Text style={[styles.body, { color: colors.mutedForeground, marginTop: 10 }]}>Nexus Wave Technologies builds Nexus Plus with a strong focus on personal privacy, safer digital habits, and protection against unwanted or explicit digital content.</Text>
        <Text style={[styles.body, { color: colors.mutedForeground, marginTop: 10 }]}>The service is permission-based. Nexus Plus cannot turn it on silently, and the app does not receive the ability to grant this Android permission itself.</Text>
      </View>

      <View style={[styles.status, { backgroundColor: accessibilityEnabled ? colors.secondary : colors.card, borderColor: colors.border }]}>
        <Feather name={accessibilityEnabled ? 'check-circle' : 'alert-circle'} size={20} color={accessibilityEnabled ? colors.primary : colors.mutedForeground} />
        <View style={styles.copy}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>{accessibilityEnabled ? 'Protection permission enabled' : 'Protection permission required'}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{accessibilityEnabled ? 'You can continue to the Nexus Plus login screen.' : 'Open Android Accessibility Settings and enable Nexus Safety Accessibility Service.'}</Text>
        </View>
      </View>

      {!accessibilityEnabled && (
        <Pressable accessibilityRole="button" accessibilityLabel="Allow Nexus Safety Accessibility Service" disabled={busy} onPress={() => void allowProtection()} style={[styles.primary, { backgroundColor: colors.primary, opacity: busy ? 0.6 : 1 }]}>
          <Feather name="shield" size={18} color={colors.primaryForeground} />
          <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Please allow Nexus Safety Protection</Text>
        </Pressable>
      )}

      <Pressable accessibilityRole="button" accessibilityLabel="I have enabled protection, continue" disabled={!accessibilityEnabled} onPress={() => void continueToApp()} style={[styles.secondary, { backgroundColor: colors.card, borderColor: colors.border, opacity: accessibilityEnabled ? 1 : 0.45 }]}>
        <Text style={[styles.secondaryText, { color: colors.foreground }]}>Continue to Nexus Plus</Text>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="Uninstall Nexus Plus" onPress={() => void uninstall()} style={styles.uninstall}>
        <Text style={[styles.uninstallText, { color: colors.destructive }]}>Do not enable protection • Uninstall Nexus Plus</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20 }, icon: { width: 62, height: 62, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }, title: { fontSize: 30, fontFamily: 'Inter_700Bold', marginBottom: 7 }, subtitle: { fontSize: 12, lineHeight: 18, marginBottom: 18 }, card: { borderRadius: 18, borderWidth: 1.5, padding: 16 }, heading: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 8 }, body: { fontSize: 12, lineHeight: 18 }, status: { marginTop: 14, padding: 13, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 }, copy: { flex: 1 }, statusTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 }, primary: { minHeight: 54, borderRadius: 15, marginTop: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9 }, primaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, secondary: { minHeight: 52, borderRadius: 15, marginTop: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' }, secondaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' }, uninstall: { alignItems: 'center', paddingVertical: 18 }, uninstallText: { fontSize: 11, fontFamily: 'Inter_700Bold', textAlign: 'center' },
});

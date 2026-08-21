import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Battery from 'expo-battery';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { loadLanguagePreferences, type LanguagePreferences } from '@/features/language-preferences/languagePreferences';
import { DEFAULT_BATTERY_ANNOUNCER_SETTINGS, type BatteryAnnouncementSettings } from '@/features/battery-announcer/batteryAnnouncerTypes';
import { getBatteryPhrase, getBatteryStatus, readCurrentBattery } from '@/features/battery-announcer/batteryAnnouncer';
import { loadBatteryAnnouncementSettings, saveBatteryAnnouncementSettings } from '@/features/battery-announcer/batteryAnnouncerSettings';
import { speakFeatureText } from '@/features/language-preferences/speakFeatureText';

export default function BatteryAnnouncerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [level, setLevel] = useState(0);
  const [state, setState] = useState<Battery.BatteryState>(Battery.BatteryState.UNKNOWN);
  const [settings, setSettings] = useState<BatteryAnnouncementSettings>(DEFAULT_BATTERY_ANNOUNCER_SETTINGS);
  const [language, setLanguage] = useState<LanguagePreferences['featureTtsLanguage']>('en-IN');
  const levelRef = useRef(0);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const updateSettings = async (patch: Partial<BatteryAnnouncementSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    setSettings(next);
    settingsRef.current = next;
    try {
      await saveBatteryAnnouncementSettings(next);
    } catch {
      AccessibilityInfo.announceForAccessibility('Battery setting could not be saved.');
    }
  };

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const [nextLevel, nextState, prefs, savedSettings] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
        loadLanguagePreferences(),
        loadBatteryAnnouncementSettings(),
      ]);
      if (!mounted) return;
      levelRef.current = nextLevel;
      setLevel(nextLevel);
      setState(nextState);
      setLanguage(prefs.featureTtsLanguage);
      setSettings(savedSettings);
      settingsRef.current = savedSettings;
    };
    void refresh();

    const levelSub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      levelRef.current = batteryLevel;
      setLevel(batteryLevel);
    });

    const stateSub = Battery.addBatteryStateListener(async ({ batteryState }) => {
      if (!mounted) return;
      setState(batteryState);
      const current = settingsRef.current;
      if (!current.enabled || !current.announceStatusChanges) return;
      try {
        const prefs = await loadLanguagePreferences();
        const phrase = getBatteryPhrase(
          levelRef.current,
          getBatteryStatus(batteryState),
          prefs.featureTtsLanguage,
          current,
        );
        await speakFeatureText(phrase, prefs.featureTtsLanguage);
        AccessibilityInfo.announceForAccessibility(phrase);
      } catch {
        // Battery announcements are optional and must not interrupt the listener.
      }
    });

    return () => {
      mounted = false;
      levelSub.remove();
      stateSub.remove();
    };
  }, []);

  const announceNow = async () => {
    try {
      const prefs = await loadLanguagePreferences();
      setLanguage(prefs.featureTtsLanguage);
      await readCurrentBattery(prefs.featureTtsLanguage, speakFeatureText, settingsRef.current);
      AccessibilityInfo.announceForAccessibility('Current battery status announced.');
    } catch {
      AccessibilityInfo.announceForAccessibility('Unable to announce current battery status.');
    }
  };

  const status = getBatteryStatus(state);
  const label = status === 'charging' ? 'Charging' : status === 'full' ? 'Fully charged' : status === 'discharging' ? 'Discharging' : 'Battery status unknown';

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="battery-charging" size={30} color={colors.primary} /></View>
        <View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Battery Announcer</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Hear battery level and charging or discharging changes.</Text></View>
      </View>
      <View accessible accessibilityRole="text" accessibilityLabel={`Battery ${Math.round(level * 100)} percent. ${label}.`} style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.percent, { color: colors.foreground }]}>{Math.round(level * 100)}%</Text>
        <Text style={[styles.state, { color: colors.mutedForeground }]}>{label}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Announce current battery status" onPress={() => void announceNow()} style={[styles.button, { backgroundColor: colors.primary }]}><Feather name="volume-2" size={17} color={colors.primaryForeground} /><Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_700Bold' }}>Announce now</Text></Pressable>
      </View>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Automatic announcements</Text>
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Battery Announcer</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>Announce when charging state changes.</Text></View><Switch accessibilityRole="switch" accessibilityLabel="Enable Battery Announcer" value={settings.enabled} onValueChange={(enabled) => void updateSettings({ enabled })} trackColor={{ false: colors.secondary, true: colors.primary }} thumbColor={settings.enabled ? colors.primaryForeground : colors.mutedForeground} /></View>
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Status changes</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>Speak when charging or discharging starts.</Text></View><Switch accessibilityRole="switch" accessibilityLabel="Announce battery status changes" value={settings.announceStatusChanges} onValueChange={(announceStatusChanges) => void updateSettings({ announceStatusChanges })} trackColor={{ false: colors.secondary, true: colors.primary }} thumbColor={settings.announceStatusChanges ? colors.primaryForeground : colors.mutedForeground} /></View>
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.copy}><Text style={[styles.rowTitle, { color: colors.foreground }]}>Battery percentage</Text><Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>Include the exact percentage in announcements.</Text></View><Switch accessibilityRole="switch" accessibilityLabel="Include battery percentage" value={settings.announcePercentage} onValueChange={(announcePercentage) => void updateSettings({ announcePercentage })} trackColor={{ false: colors.secondary, true: colors.primary }} thumbColor={settings.announcePercentage ? colors.primaryForeground : colors.mutedForeground} /></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }, icon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, title: { fontSize: 28, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 4, fontSize: 12, lineHeight: 18 }, hero: { marginHorizontal: 20, borderRadius: 22, borderWidth: 1, alignItems: 'center', padding: 26 }, percent: { fontSize: 46, fontFamily: 'Inter_700Bold' }, state: { marginTop: 4, fontSize: 13 }, button: { marginTop: 18, minHeight: 46, borderRadius: 14, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 7 }, section: { marginTop: 28, paddingHorizontal: 20, gap: 10 }, sectionTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' }, row: { minHeight: 76, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' }, rowTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' }, rowDetail: { marginTop: 3, fontSize: 11, lineHeight: 16 } });

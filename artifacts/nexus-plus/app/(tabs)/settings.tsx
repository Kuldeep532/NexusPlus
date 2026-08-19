import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type SettingRowProps = {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  detail: string;
  testID: string;
  onPress?: () => void;
  right?: React.ReactNode;
};

function SettingRow({ icon, title, detail, testID, onPress, right }: SettingRowProps) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `${title}. ${detail}` : undefined}
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.border }, pressed && onPress && styles.pressed]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rowDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
      {right ?? <Feather name="chevron-right" size={18} color={colors.mutedForeground} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [skipSymbols, setSkipSymbols] = useState(true);
  const [autoOcr, setAutoOcr] = useState(true);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 112 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={[styles.kicker, { color: colors.primary }]}>PREFERENCES</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>Set up reading and speech the way you work.</Text>
      </View>

      <Text style={[styles.group, { color: colors.mutedForeground }]}>READING & SPEECH</Text>
      <View style={[styles.groupBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow
          icon="globe"
          title="Language and Preference"
          detail="Choose languages separately for feature TTS and Book Reader"
          testID="settings-language-preference"
          onPress={() => router.push('/language-and-preference')}
        />
        <SettingRow
          icon="volume-2"
          title="Voice Library"
          detail="Manage reading voices"
          testID="settings-voice-library"
          onPress={() => router.push('/voices')}
        />
        <SettingRow
          icon="repeat"
          title="Auto language switching"
          detail="Switch between detected languages"
          testID="settings-language-switch"
          right={
            <Switch
              testID="settings-language-switch-toggle"
              accessibilityLabel="Auto language switching"
              accessibilityRole="switch"
              value={autoSwitch}
              onValueChange={setAutoSwitch}
              trackColor={{ false: colors.secondary, true: colors.primary }}
              thumbColor={autoSwitch ? colors.primaryForeground : colors.mutedForeground}
            />
          }
        />
        <SettingRow
          icon="slash"
          title="Skip symbols and URLs"
          detail="Keep spoken output focused"
          testID="settings-skip-symbols"
          right={
            <Switch
              testID="settings-skip-symbols-toggle"
              accessibilityLabel="Skip symbols and URLs"
              accessibilityRole="switch"
              value={skipSymbols}
              onValueChange={setSkipSymbols}
              trackColor={{ false: colors.secondary, true: colors.primary }}
              thumbColor={skipSymbols ? colors.primaryForeground : colors.mutedForeground}
            />
          }
        />
        <SettingRow
          icon="search"
          title="Automatic OCR in Reader"
          detail="Recognize scanned pages as they open"
          testID="settings-auto-ocr"
          right={
            <Switch
              testID="settings-auto-ocr-toggle"
              accessibilityLabel="Automatic OCR in Reader"
              accessibilityRole="switch"
              value={autoOcr}
              onValueChange={setAutoOcr}
              trackColor={{ false: colors.secondary, true: colors.primary }}
              thumbColor={autoOcr ? colors.primaryForeground : colors.mutedForeground}
            />
          }
        />
      </View>

      <Text style={[styles.group, { color: colors.mutedForeground }]}>APP INFORMATION</Text>
      <View style={[styles.groupBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="shield" title="Privacy Policy" detail="Read how Nexus Plus handles information" testID="settings-privacy-policy" onPress={() => router.push('/privacy-policy')} />
        <SettingRow icon="file-text" title="Terms and Conditions" detail="Review the terms for using Nexus Plus" testID="settings-terms" onPress={() => router.push('/terms-and-conditions')} />
        <SettingRow icon="info" title="About Us" detail="Learn about Nexus Plus and its developer" testID="settings-about-us" onPress={() => router.push('/about-us')} />
      </View>

      <View style={[styles.footer, { borderColor: colors.border }]}>
        <View style={[styles.footerMark, { backgroundColor: colors.primary }]}>
          <Text style={[styles.footerMarkText, { color: colors.primaryForeground }]}>N</Text>
        </View>
        <View style={styles.footerCopy}>
          <Text style={[styles.footerTitle, { color: colors.foreground }]}>Nexus Plus</Text>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Developed by Kuldeep Kumar Yadav.</Text>
        </View>
        <Text style={[styles.version, { color: colors.mutedForeground }]}>1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: { paddingHorizontal: 20, marginBottom: 29 },
  kicker: { fontSize: 11, letterSpacing: 2, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  title: { fontSize: 30, lineHeight: 35, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  sub: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  group: { paddingHorizontal: 20, fontSize: 10, letterSpacing: 1.7, fontFamily: 'Inter_700Bold', marginBottom: 9 },
  groupBox: { marginHorizontal: 20, borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 26 },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1 },
  rowIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, marginLeft: 12, marginRight: 10 },
  rowTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  rowDetail: { fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  footer: { marginHorizontal: 20, paddingTop: 17, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center' },
  footerMark: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  footerMarkText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  footerCopy: { flex: 1, marginLeft: 10 },
  footerTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 3 },
  footerText: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  version: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  pressed: { opacity: 0.72 },
});

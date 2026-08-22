import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getProtectedComputer, isRemoteComputerProtectionConfigured, isRemoteComputerSessionUnlocked, setRemoteComputerSessionUnlocked } from '@/src/remote-computer/remoteComputerProtection';

const cards = [
  { route: '/remote-computer/connector', icon: 'lan-connect', title: 'Connect a computer', detail: 'Pair Nexus Plus with your Windows, Ubuntu, or macOS desktop.' },
  { route: '/remote-computer/control', icon: 'remote-desktop', title: 'Control computer', detail: 'Use touch controls, screen-reader actions, and protected remote commands.' },
];

export default function RemoteComputerHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [protectedComputer, setProtectedComputer] = useState<{ computerId: string; computerName: string } | null>(null);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const ready = await isRemoteComputerProtectionConfigured();
      const computer = await getProtectedComputer();
      if (active) { setConfigured(ready); setProtectedComputer(computer); }
    })();
    return () => { active = false; };
  }, []);

  const open = (route: string, title: string) => {
    AccessibilityInfo.announceForAccessibility(title);
    router.push(route as never);
  };

  const openProtected = () => {
    if (!configured || !isRemoteComputerSessionUnlocked()) {
      setRemoteComputerSessionUnlocked(false);
      router.push('/remote-computer/protection');
      return;
    }
    open('/remote-computer/control', 'Control computer');
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}>
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: colors.secondary }]} accessible accessibilityLabel="Remote computer">
          <MaterialCommunityIcons name="remote-desktop" size={30} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Remote Computer</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Securely connect to and control your computer from Nexus Plus.</Text>
        </View>
      </View>

      <View accessible accessibilityRole="text" style={[styles.status, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.dot, { backgroundColor: protectedComputer ? colors.primary : colors.mutedForeground }]} />
        <View style={styles.copy}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>{protectedComputer ? protectedComputer.computerName : 'No protected computer'}</Text>
          <Text style={[styles.statusDetail, { color: colors.mutedForeground }]}>{protectedComputer ? 'Paired and protected on this phone.' : 'Pair a desktop agent to activate Remote Computer.'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Remote access</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Protection Password" accessibilityHint="Set up or enter the Protection Password. A paired computer agent is required for first-time setup." onPress={() => open('/remote-computer/protection', 'Protection Password')} style={[styles.protectionCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View style={[styles.cardIcon, { backgroundColor: colors.card }]}><MaterialCommunityIcons name="shield-lock" size={25} color={colors.primary} /></View>
          <View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>Protection Password</Text><Text style={[styles.cardDetail, { color: colors.mutedForeground }]}>{configured ? 'Unlock Remote Computer access.' : 'Required before this feature can be used.'}</Text></View>
        </Pressable>
        {cards.map((card) => (
          <Pressable key={card.route} accessibilityRole="button" accessibilityLabel={card.title} accessibilityHint={card.detail} onPress={() => card.route.endsWith('/control') ? openProtected() : open(card.route, card.title)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.cardIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={card.icon as never} size={25} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{card.title}</Text><Text style={[styles.cardDetail, { color: colors.mutedForeground }]}>{card.detail}</Text></View>
            <MaterialCommunityIcons name="chevron-right" size={25} color={colors.mutedForeground} accessibilityElementsHidden />
          </Pressable>
        ))}
      </View>

      <View style={[styles.security, { backgroundColor: colors.secondary }]} accessible accessibilityRole="text">
        <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.primary} />
        <Text style={[styles.securityText, { color: colors.secondaryForeground }]}>The phone keeps only a password verifier and paired-agent identity in secure storage. The Protection Password is never sent to the computer.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  icon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700' }, subtitle: { marginTop: 4, fontSize: 13, lineHeight: 19 },
  status: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, dot: { width: 11, height: 11, borderRadius: 6 },
  statusTitle: { fontSize: 15, fontWeight: '700' }, statusDetail: { marginTop: 3, fontSize: 12 }, section: { marginTop: 28, paddingHorizontal: 20, gap: 10 }, sectionTitle: { fontSize: 19, fontWeight: '700', marginBottom: 2 },
  card: { minHeight: 92, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, protectionCard: { minHeight: 92, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, cardTitle: { fontSize: 15, fontWeight: '700' }, cardDetail: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  security: { margin: 20, marginTop: 28, borderRadius: 16, padding: 15, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, securityText: { flex: 1, fontSize: 12, lineHeight: 18 },
});

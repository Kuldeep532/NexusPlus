import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const cards = [
  { route: '/remote-computer/connector', icon: 'lan-connect', title: 'Connect a computer', detail: 'Pair Nexus Plus with your Windows, Ubuntu, or macOS desktop.' },
  { route: '/remote-computer/control', icon: 'remote-desktop', title: 'Control computer', detail: 'Use touch controls, screen-reader actions, and protected remote commands.' },
];

export default function RemoteComputerHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const open = (route: string, title: string) => {
    AccessibilityInfo.announceForAccessibility(title);
    router.push(route as never);
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
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
        <View style={styles.copy}>
          <Text style={[styles.statusTitle, { color: colors.foreground }]}>No active computer</Text>
          <Text style={[styles.statusDetail, { color: colors.mutedForeground }]}>Connect a desktop to begin.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Remote access</Text>
        {cards.map((card) => (
          <Pressable key={card.route} accessibilityRole="button" accessibilityLabel={card.title} accessibilityHint={card.detail} onPress={() => open(card.route, card.title)} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.cardIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={card.icon as never} size={25} color={colors.primary} /></View>
            <View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{card.title}</Text><Text style={[styles.cardDetail, { color: colors.mutedForeground }]}>{card.detail}</Text></View>
            <MaterialCommunityIcons name="chevron-right" size={25} color={colors.mutedForeground} accessibilityElementsHidden />
          </Pressable>
        ))}
      </View>

      <View style={[styles.security, { backgroundColor: colors.secondary }]} accessible accessibilityRole="text">
        <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.primary} />
        <Text style={[styles.securityText, { color: colors.secondaryForeground }]}>Every protected command uses a fresh challenge and phone biometric authorization. Your computer password is never sent to the phone.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  icon: { width: 58, height: 58, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { marginTop: 4, fontSize: 13, lineHeight: 19 },
  status: { marginHorizontal: 20, borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 11, height: 11, borderRadius: 6 },
  statusTitle: { fontSize: 15, fontWeight: '700' },
  statusDetail: { marginTop: 3, fontSize: 12 },
  section: { marginTop: 28, paddingHorizontal: 20, gap: 10 },
  sectionTitle: { fontSize: 19, fontWeight: '700', marginBottom: 2 },
  card: { minHeight: 92, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardDetail: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  security: { margin: 20, marginTop: 28, borderRadius: 16, padding: 15, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  securityText: { flex: 1, fontSize: 12, lineHeight: 18 },
});

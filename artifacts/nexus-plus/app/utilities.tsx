import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type Utility = { key: string; title: string; detail: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; route: string };
const utilities: Utility[] = [
  { key: 'qr', title: 'QR Code Generator', detail: 'Create Text/URL, WiFi, UPI and WhatsApp QR codes', icon: 'qrcode', route: '/utilities/qr-generator' },
  { key: 'battery', title: 'Battery Announcer', detail: 'Hear battery level and charging state', icon: 'battery-charging', route: '/battery-announcer' },
];

export default function UtilitiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="tools" size={28} color={colors.primary} /></View><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Utilities</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Useful tools grouped in one clean place.</Text></View></View>
    <View style={styles.list}>{utilities.map((utility) => <Pressable key={utility.key} accessibilityRole="button" accessibilityLabel={`Open ${utility.title}. ${utility.detail}`} onPress={() => router.push(utility.route as never)} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.utilityIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name={utility.icon} size={23} color={colors.primary} /></View><View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{utility.title}</Text><Text style={[styles.cardDetail, { color: colors.mutedForeground }]}>{utility.detail}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></Pressable>)}</View>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 }, icon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, utilityIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 }, title: { fontSize: 29, fontFamily: 'Inter_700Bold' }, subtitle: { marginTop: 4, fontSize: 12, lineHeight: 18 }, list: { paddingHorizontal: 20, gap: 10 }, card: { minHeight: 82, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }, cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' }, cardDetail: { marginTop: 3, fontSize: 11, lineHeight: 16 }, pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] } });

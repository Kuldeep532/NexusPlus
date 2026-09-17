import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function BuyPremiumScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }} accessibilityLabel="Premium archive">
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.foreground }]}>Premium</Text>
          <View style={styles.iconButton} />
        </View>
        <View style={styles.hero}>
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="archive" size={25} color={colors.primary} /></View>
          <Text style={[styles.title, { color: colors.foreground }]}>Premium is temporarily archived</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Premium memberships and payment integration are not currently shown in the app. The backend foundation remains preserved for a later release.</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Billing paused</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>No payment gateway, checkout, or UPI payment action is active in this release.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close Premium archive" onPress={() => router.back()} style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={styles.buttonText}>Back to Nexus Plus</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontFamily: 'Inter_700Bold' },
  hero: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 28, paddingBottom: 24 },
  icon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 24, lineHeight: 30, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  body: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 9 },
  card: { marginHorizontal: 16, borderWidth: 1, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  button: { marginHorizontal: 16, marginTop: 16, minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_700Bold' },
});

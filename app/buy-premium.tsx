import { useCallback, useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getActiveAiCreditPlans, getActivePremiumPlans, getMyPremiumEntitlement, type AiCreditPlan, type PremiumCatalogPlan, type PremiumEntitlement } from '@/features/premium/premiumRepository';
import { getUserFriendlyMessage } from '@/features/ui/userFriendlyError';

export default function BuyPremiumScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<PremiumCatalogPlan[]>([]);
  const [creditPlans, setCreditPlans] = useState<AiCreditPlan[]>([]);
  const [entitlement, setEntitlement] = useState<PremiumEntitlement | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [premium, credits, current] = await Promise.all([
        getActivePremiumPlans(),
        getActiveAiCreditPlans(),
        getMyPremiumEntitlement().catch(() => null),
      ]);
      setPlans(premium);
      setCreditPlans(credits);
      setEntitlement(current);
    } catch (error) {
      Alert.alert('Premium', getUserFriendlyMessage(error, 'Premium plans could not be loaded right now.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }} accessibilityLabel="Nexus Plus Premium">
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.foreground }]}>Nexus Plus Premium</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh Premium plans" onPress={() => void load()} style={styles.iconButton}>
            <Feather name="refresh-cw" size={19} color={colors.foreground} />
          </Pressable>
        </View>

        {entitlement?.unlocksPremiumFeatures && (
          <View style={[styles.activeCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Premium is active</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>
              {entitlement.planName ?? 'Premium'} • Tier {entitlement.tierLevel} • Expires {entitlement.expiresAt ? new Date(entitlement.expiresAt).toLocaleDateString() : 'soon'}
            </Text>
          </View>
        )}

        <View style={styles.hero}>
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="zap" size={25} color={colors.primary} /></View>
          <Text style={[styles.title, { color: colors.foreground }]}>Premium tools for Nexus Plus</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Premium access applies only to Nexus Plus premium tools. Free tools and spiritual features are not part of Premium entitlement.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Membership</Text>
        {plans.map((plan) => (
          <View key={plan.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{plan.name}</Text>
                <Text style={[styles.body, { color: colors.mutedForeground }]}>{plan.description}</Text>
              </View>
              <Text style={[styles.price, { color: colors.primary }]}>₹{plan.amount}</Text>
            </View>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{plan.durationDays} days • Tier {plan.tierLevel} • {plan.unlocksPremiumFeatures ? 'Premium tools included' : 'Membership benefits'}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Select ${plan.name} membership`}
              onPress={() => Alert.alert('Premium', 'Checkout is not enabled yet. The selected plan is ready in Supabase for the payment integration stage.')}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.buttonText}>Select {plan.name}</Text>
            </Pressable>
          </View>
        ))}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Credits</Text>
        {creditPlans.map((plan) => (
          <View key={plan.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{plan.name}</Text>
                <Text style={[styles.body, { color: colors.mutedForeground }]}>{plan.tagline}</Text>
              </View>
              <Text style={[styles.price, { color: colors.primary }]}>₹{plan.amount}</Text>
            </View>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{plan.credits} AI credits</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Select ${plan.name}`}
              onPress={() => Alert.alert('AI Credits', 'Checkout is not enabled yet. The credit plan is ready in Supabase for the payment integration stage.')}
              style={[styles.button, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1 }]}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>Select {plan.name}</Text>
            </Pressable>
          </View>
        ))}

        {loading && <Text style={[styles.loading, { color: colors.mutedForeground }]}>Loading Premium plans…</Text>}
        {!loading && plans.length === 0 && creditPlans.length === 0 && (
          <Text style={[styles.loading, { color: colors.mutedForeground }]}>Premium plans are unavailable right now. Please try again later.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  hero: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 24, paddingBottom: 18 },
  icon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 23, lineHeight: 30, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  body: { fontSize: 12, lineHeight: 18, marginTop: 7 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginHorizontal: 16, marginTop: 12, marginBottom: 9 },
  card: { marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderRadius: 16, padding: 15 },
  activeCard: { marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderRadius: 16, padding: 15 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  price: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 11, marginTop: 8 },
  button: { minHeight: 46, borderRadius: 13, marginTop: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  buttonText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter_700Bold' },
  loading: { textAlign: 'center', marginHorizontal: 18, marginTop: 18, fontSize: 12 },
});

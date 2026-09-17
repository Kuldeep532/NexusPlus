import { Feather } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { createPremiumCheckout } from '@/features/premium/premiumApi';
import type { PremiumPlanCode } from '@/features/premium/premiumPlans';

const PLANS: Array<{
  id: PremiumPlanCode;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  popular?: boolean;
}> = [
  {
    id: 'lifeline_monthly',
    name: 'Lifeline',
    price: '₹49',
    cadence: '/month',
    description: 'Ad-free Nexus Plus with a lighter membership layer.',
    features: ['Remove ads across Nexus Plus', 'Member-only settings & perks', 'Cancel anytime'],
  },
  {
    id: 'super_monthly',
    name: 'Super',
    price: '₹149',
    cadence: '/month',
    description: 'Premium toolkit access for everyday creators and power users.',
    features: ['Everything in Lifeline', 'Unlock Premium-only features', 'Priority access to new Premium tools'],
    popular: true,
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: '₹399',
    cadence: '/month',
    description: 'Full Premium access for intensive media and AI workflows.',
    features: ['Everything in Super', 'Highest Premium access tier', 'Early access to selected advanced tools'],
  },
];

export default function BuyPremiumScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<PremiumPlanCode>('super_monthly');
  const [busy, setBusy] = useState(false);
  const selectedPlan = useMemo(() => PLANS.find((plan) => plan.id === selectedId) ?? PLANS[1], [selectedId]);

  const beginCheckout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const session = await createPremiumCheckout(selectedPlan.id);
      if (session.checkoutUrl) {
        // Hosted checkout is intentionally opened only when the trusted backend supplies it.
        const { Linking } = await import('react-native');
        const canOpen = await Linking.canOpenURL(session.checkoutUrl);
        if (!canOpen) throw new Error('PAYMENT_CHECKOUT_URL_UNAVAILABLE');
        await Linking.openURL(session.checkoutUrl);
        return;
      }
      Alert.alert(
        'Payment setup required',
        'The Premium billing backend is not configured for live checkout yet. No payment was taken and no Premium access was granted.',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'We could not start checkout.';
      Alert.alert('Payment unavailable', message === 'AUTH_REQUIRED' ? 'Please sign in before buying Premium.' : message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }} accessibilityLabel="Buy Premium">
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.iconButton}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.foreground }]}>Buy Premium</Text>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.hero}>
          <View style={[styles.crown, { backgroundColor: colors.secondary }]}>
            <Feather name="star" size={26} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Unlock more of Nexus Plus</Text>
          <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>Premium unlocks Premium-only features. Credit-based AI tools remain separate and use Credits.</Text>
        </View>

        <View style={styles.planList}>
          {PLANS.map((plan) => {
            const selected = selectedId === plan.id;
            return (
              <Pressable
                key={plan.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${plan.name}. ${plan.price} ${plan.cadence}. ${plan.description}`}
                onPress={() => setSelectedId(plan.id)}
                style={[styles.planCard, { backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.border }]}
              >
                <View style={styles.planTop}>
                  <View style={styles.planNameWrap}>
                    <View style={styles.planNameRow}>
                      <Text style={[styles.planName, { color: colors.foreground }]}>{plan.name}</Text>
                      {plan.popular ? <View style={[styles.badge, { backgroundColor: colors.secondary }]}><Text style={[styles.badgeText, { color: colors.primary }]}>POPULAR</Text></View> : null}
                    </View>
                    <Text style={[styles.planDescription, { color: colors.mutedForeground }]}>{plan.description}</Text>
                  </View>
                  <View style={styles.priceWrap}>
                    <Text style={[styles.price, { color: colors.foreground }]}>{plan.price}</Text>
                    <Text style={[styles.cadence, { color: colors.mutedForeground }]}>{plan.cadence}</Text>
                  </View>
                </View>
                <View style={styles.features}>
                  {plan.features.map((feature) => <View key={feature} style={styles.featureRow}><Feather name="check" size={16} color={colors.primary} /><Text style={[styles.featureText, { color: colors.foreground }]}>{feature}</Text></View>)}
                </View>
                <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.mutedForeground }]}>{selected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryTitleRow}><Text style={[styles.summaryTitle, { color: colors.foreground }]}>Selected plan</Text><Text style={[styles.summaryPlan, { color: colors.primary }]}>{selectedPlan.name}</Text></View>
          <Text style={[styles.summaryBody, { color: colors.mutedForeground }]}>Payment is processed by the configured gateway. Premium access is granted only after the trusted backend verifies the payment or subscription event.</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: busy, busy }}
          accessibilityLabel={`Continue with ${selectedPlan.name}`}
          disabled={busy}
          onPress={() => void beginCheckout()}
          style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Starting checkout…' : `Continue with ${selectedPlan.name}`}</Text>
          {!busy ? <Feather name="arrow-right" size={18} color="#FFFFFF" /> : null}
        </Pressable>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>Subscriptions are subject to the final pricing, billing, cancellation and payment terms shown at checkout.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontFamily: 'Inter_700Bold' },
  hero: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24 },
  crown: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 24, lineHeight: 30, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  heroBody: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 9, maxWidth: 350 },
  planList: { paddingHorizontal: 16, gap: 12 },
  planCard: { borderWidth: 1.5, borderRadius: 18, padding: 16, position: 'relative' },
  planTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingRight: 28 },
  planNameWrap: { flex: 1, marginRight: 12 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  badge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  badgeText: { fontSize: 8, fontFamily: 'Inter_700Bold' },
  planDescription: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  priceWrap: { alignItems: 'flex-end' },
  price: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  cadence: { fontSize: 10, marginTop: 1 },
  features: { gap: 8, marginTop: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { flex: 1, fontSize: 11, lineHeight: 16 },
  radio: { position: 'absolute', top: 16, right: 15, width: 21, height: 21, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5 },
  summary: { marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderRadius: 16, padding: 14 },
  summaryTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  summaryPlan: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  summaryBody: { fontSize: 10.5, lineHeight: 16, marginTop: 8 },
  primaryButton: { marginHorizontal: 16, marginTop: 14, minHeight: 52, borderRadius: 15, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_700Bold' },
  legal: { marginHorizontal: 22, marginTop: 10, fontSize: 9.5, lineHeight: 14, textAlign: 'center' },
});

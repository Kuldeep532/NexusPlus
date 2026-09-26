import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import {
  getActivePremiumPlans,
  getMyPremiumEntitlement,
  getMyAiCreditBalance,
  getPaymentSettings,
  getActiveAiCreditPlans,
  createPaymentOrder,
  createSubscriptionBundleOrder,
  canPurchaseCreditTopup,
  type PremiumCatalogPlan,
  type PremiumEntitlement,
  type AiCreditPlan,
  type PaymentSettings,
} from '@/features/premium/premiumRepository';

export default function ManageSubscriptionScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<PremiumCatalogPlan[]>([]);
  const [topups, setTopups] = useState<AiCreditPlan[]>([]);
  const [entitlement, setEntitlement] = useState<PremiumEntitlement | null>(null);
  const [credits, setCredits] = useState(0);
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [canTopup, setCanTopup] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t, e, c, s, eligible] = await Promise.all([
        getActivePremiumPlans(),
        getActiveAiCreditPlans(),
        getMyPremiumEntitlement().catch(() => null),
        getMyAiCreditBalance().catch(() => 0),
        getPaymentSettings().catch(() => null),
        canPurchaseCreditTopup().catch(() => false),
      ]);
      setPlans(p);
      setTopups(t);
      setEntitlement(e);
      setCredits(Number(c) || 0);
      setPayment(s);
      setCanTopup(Boolean(eligible));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openUpi = async (
    order: { upiId:string; receiverName:string; amountInr:number },
    code: string,
  ) => {
    const url =
      'upi://pay?pa=' + encodeURIComponent(order.upiId) +
      '&pn=' + encodeURIComponent(order.receiverName) +
      '&am=' + encodeURIComponent(String(order.amountInr)) +
      '&cu=INR&tn=' + encodeURIComponent('Nexus Plus ' + code);
    if (!(await Linking.canOpenURL(url))) throw new Error('UPI_NOT_AVAILABLE');
    await Linking.openURL(url);
    Alert.alert('Payment started', 'Complete the UPI payment. Access and credits are added only after payment verification.');
  };

  const start = async (plan: PremiumCatalogPlan | AiCreditPlan) => {
    try {
      if (plan.id.startsWith('bundle:')) {
        const order = await createSubscriptionBundleOrder(plan.code);
        await openUpi(order, plan.code);
        return;
      }

      const order = await createPaymentOrder('PREMIUM', plan.code);
      await openUpi(order, plan.code);
    } catch (error) {
      Alert.alert(
        'Payment',
        error instanceof Error && error.message === 'UPI_NOT_AVAILABLE'
          ? 'No UPI app is available on this device.'
          : 'The payment request could not be created right now.',
      );
    }
  };

  const startTopup = async (plan: AiCreditPlan) => {
    try {
      const order = await createPaymentOrder('AI_CREDITS', plan.code);
      await openUpi(order, plan.code);
    } catch (error) {
      Alert.alert(
        'Payment',
        error instanceof Error && error.message === 'UPI_NOT_AVAILABLE'
          ? 'No UPI app is available on this device.'
          : 'The payment request could not be created right now.',
      );
    }
  };

  const active = Boolean(
    entitlement?.status === 'ACTIVE' &&
    entitlement.expiresAt &&
    new Date(entitlement.expiresAt).getTime() > Date.now(),
  );

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 30 }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Manage Subscription</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Memberships, included credits and optional top-ups.</Text>
        </View>
      </View>

      <View style={[styles.balanceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.balanceIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="zap" size={21} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Nexus Credits</Text>
          <Text style={[styles.balance, { color: colors.foreground }]}>{credits.toLocaleString()}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {active ? 'Use these credits across supported AI features.' : 'Choose a membership to start using premium AI features and included credits.'}
          </Text>
        </View>
      </View>

      {active && entitlement ? (
        <View style={[styles.card, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.foreground }]}>Current membership</Text>
          <Text style={[styles.name, { color: colors.foreground }]}>{entitlement.planName ?? entitlement.planCode ?? 'Nexus Plus'}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Active until {entitlement.expiresAt ? new Date(entitlement.expiresAt).toLocaleDateString() : 'your renewal date'}.
          </Text>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.foreground }]}>Choose a membership</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            Every membership includes monthly credits. You only need a top-up when your included balance is not enough.
          </Text>
        </View>
      )}

      {payment ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.section, { color: colors.foreground }]}>UPI payment</Text>
          <Text selectable style={[styles.upi, { color: colors.primary }]}>{payment.upiId}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{payment.instructions}</Text>
        </View>
      ) : null}

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Memberships with included credits</Text>
      {plans.map(plan => (
        <View key={plan.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text style={[styles.name, { color: colors.foreground }]}>{plan.name}</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>{plan.description}</Text>
            </View>
            <Text style={[styles.price, { color: colors.primary }]}>₹{plan.amount}</Text>
          </View>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            Monthly • {plan.includedCredits.toLocaleString()} included credits • Ad-free
          </Text>
          <Pressable accessibilityRole="button" onPress={() => void start(plan)} style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
              {active && plan.code === entitlement?.planCode ? 'Renew or continue' : 'Choose ' + plan.name}
            </Text>
          </Pressable>
        </View>
      ))}

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Credit top-ups</Text>
      {!active ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={19} color={colors.primary} />
          <Text style={[styles.name, { color: colors.foreground, marginTop: 8 }]}>Available after subscription</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            You receive included credits with your membership first. Top-ups become available only while that membership is active.
          </Text>
        </View>
      ) : (
        topups.map(plan => (
          <View key={plan.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <View style={styles.copy}>
                <Text style={[styles.name, { color: colors.foreground }]}>{plan.name}</Text>
                <Text style={[styles.body, { color: colors.mutedForeground }]}>{plan.tagline}</Text>
              </View>
              <Text style={[styles.price, { color: colors.primary }]}>₹{plan.amount}</Text>
            </View>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{plan.credits.toLocaleString()} additional credits</Text>
            <Pressable
              accessibilityRole="button"
              disabled={!canTopup}
              onPress={() => void startTopup(plan)}
              style={[styles.button, { backgroundColor: colors.secondary, borderColor: colors.border, borderWidth: 1, opacity: canTopup ? 1 : 0.5 }]}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>Add credits</Text>
            </Pressable>
          </View>
        ))
      )}

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 18 }} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconButton: { width: 44, height: 44, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  title: { fontSize: 23, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 10.8, lineHeight: 16, marginTop: 3 },
  balanceCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  balanceIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10.5 },
  balance: { fontSize: 24, fontFamily: 'Inter_700Bold', marginTop: 2 },
  card: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 10 },
  section: { fontSize: 14.5, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  sectionTitle: { fontSize: 15.5, fontFamily: 'Inter_700Bold', marginTop: 10, marginBottom: 9 },
  name: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  body: { fontSize: 10.8, lineHeight: 16, marginTop: 5 },
  upi: { fontSize: 17, fontFamily: 'Inter_700Bold', marginTop: 3 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  price: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 10.5, marginTop: 8 },
  button: { minHeight: 46, borderRadius: 13, marginTop: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 11.5, fontFamily: 'Inter_700Bold' },
});

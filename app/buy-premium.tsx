import { Feather } from '@expo/vector-icons';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { createPendingTransaction, getActivePremiumPlans } from '@/features/premium/premiumRepository';
import type { PremiumPlan } from '@/features/premium/premiumPlans';

export default function BuyPremiumScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getActivePremiumPlans()
      .then((rows) => {
        if (!active) return;
        setPlans(rows);
        setSelectedId(rows[0]?.planId ?? null);
      })
      .catch((error) => {
        if (active) setMessage(error instanceof Error ? error.message : 'Could not load Premium plans.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selectedPlan = useMemo(() => plans.find((plan) => plan.planId === selectedId) ?? null, [plans, selectedId]);

  const beginPayment = async () => {
    if (!selectedPlan || busy) return;
    setBusy(true);
    try {
      const transaction = await createPendingTransaction(selectedPlan.planId, selectedPlan.amount);
      const upiUrl = `upi://pay?pa=${encodeURIComponent(selectedPlan.upiId)}&pn=${encodeURIComponent(selectedPlan.merchantName)}&am=${encodeURIComponent(selectedPlan.amount.toFixed(2))}&cu=INR&tn=${encodeURIComponent(`Nexus Plus ${selectedPlan.planName} ${transaction.transactionId}`)}`;
      const supported = await Linking.canOpenURL(upiUrl);
      if (!supported) {
        throw new Error('NO_UPI_APP_AVAILABLE');
      }
      await Linking.openURL(upiUrl);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      const text = code === 'NO_UPI_APP_AVAILABLE'
        ? 'No supported UPI app is installed. Install or enable a UPI payment app and try again.'
        : code === 'AUTH_REQUIRED'
          ? 'Please sign in before buying Premium.'
          : code || 'We could not start the payment.';
      Alert.alert('Payment unavailable', text);
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
          <View style={[styles.crown, { backgroundColor: colors.secondary }]}><Feather name="star" size={26} color={colors.primary} /></View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Unlock more of Nexus Plus</Text>
          <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>Plans and merchant UPI details are loaded from Supabase. Credit-based AI tools remain separate.</Text>
        </View>

        {loading ? <Text style={[styles.stateText, { color: colors.mutedForeground }]}>Loading Premium plans…</Text> : null}
        {message ? <View style={[styles.errorBox, { borderColor: colors.destructive, backgroundColor: colors.card }]}><Text style={[styles.errorText, { color: colors.destructive }]}>{message}</Text></View> : null}

        <View style={styles.planList}>
          {plans.map((plan) => {
            const selected = selectedId === plan.planId;
            return (
              <Pressable key={plan.planId} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${plan.planName}. ₹${plan.amount.toFixed(2)}`} onPress={() => setSelectedId(plan.planId)} style={[styles.planCard, { backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.border }]}> 
                <View style={styles.planTop}>
                  <View style={styles.planNameWrap}><Text style={[styles.planName, { color: colors.foreground }]}>{plan.planName}</Text><Text style={[styles.planMerchant, { color: colors.mutedForeground }]}>Pay to {plan.merchantName}</Text></View>
                  <View style={styles.priceWrap}><Text style={[styles.price, { color: colors.foreground }]}>₹{plan.amount.toFixed(2)}</Text><Text style={[styles.cadence, { color: colors.mutedForeground }]}>from Supabase</Text></View>
                </View>
                <View style={[styles.upiBox, { backgroundColor: colors.secondary }]}><Feather name="smartphone" size={15} color={colors.primary} /><Text selectable style={[styles.upiText, { color: colors.secondaryForeground }]}>{plan.upiId}</Text></View>
                <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.mutedForeground }]}>{selected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}</View>
              </Pressable>
            );
          })}
        </View>

        {selectedPlan ? <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.summaryTitle, { color: colors.foreground }]}>Selected plan: {selectedPlan.planName}</Text><Text style={[styles.summaryBody, { color: colors.mutedForeground }]}>Your UPI app receives the exact amount and merchant UPI loaded from Supabase. Premium is activated only after backend verification of the payment and UTR.</Text></View> : null}

        <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy || !selectedPlan, busy }} disabled={busy || !selectedPlan} onPress={() => void beginPayment()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: busy || !selectedPlan ? 0.65 : 1 }]}>
          <Feather name="send" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>{busy ? 'Opening UPI…' : selectedPlan ? `Pay ₹${selectedPlan.amount.toFixed(2)} with UPI` : 'Select a plan'}</Text>
        </Pressable>

        <Text style={[styles.legal, { color: colors.mutedForeground }]}>After payment, the transaction must be verified server-side before Premium access is granted. Never enter a UPI PIN anywhere except inside your chosen UPI app.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontFamily: 'Inter_700Bold' },
  hero: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 22 },
  crown: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontSize: 24, lineHeight: 30, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  heroBody: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 9, maxWidth: 360 },
  stateText: { textAlign: 'center', fontSize: 12, paddingVertical: 14 },
  errorBox: { marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderRadius: 14, padding: 12 },
  errorText: { fontSize: 11, lineHeight: 16 },
  planList: { paddingHorizontal: 16, gap: 12 },
  planCard: { borderWidth: 1.5, borderRadius: 18, padding: 16, position: 'relative' },
  planTop: { flexDirection: 'row', justifyContent: 'space-between', paddingRight: 30 },
  planNameWrap: { flex: 1, marginRight: 12 },
  planName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  planMerchant: { fontSize: 10, marginTop: 5 },
  priceWrap: { alignItems: 'flex-end' },
  price: { fontSize: 21, fontFamily: 'Inter_700Bold' },
  cadence: { fontSize: 9, marginTop: 2 },
  upiBox: { minHeight: 42, borderRadius: 12, marginTop: 14, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  upiText: { flex: 1, fontSize: 12, fontFamily: 'Inter_700Bold' },
  radio: { position: 'absolute', top: 15, right: 14, width: 21, height: 21, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5 },
  summary: { marginHorizontal: 16, marginTop: 16, borderWidth: 1, borderRadius: 16, padding: 14 },
  summaryTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  summaryBody: { fontSize: 10.5, lineHeight: 16, marginTop: 7 },
  primaryButton: { marginHorizontal: 16, marginTop: 14, minHeight: 52, borderRadius: 15, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_700Bold' },
  legal: { marginHorizontal: 22, marginTop: 10, fontSize: 9.5, lineHeight: 14, textAlign: 'center' },
});

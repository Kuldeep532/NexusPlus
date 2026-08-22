import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { usePaymentAnnouncer } from '@/features/payment-announcer/usePaymentAnnouncer';

export default function PaymentAnnouncerScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const payment = usePaymentAnnouncer();

  const setupLabel = useMemo(() => {
    if (!payment.biometricAvailable) return 'Biometric Vault setup required';
    return payment.setupComplete ? 'Protected by Biometric Vault' : 'Finish secure setup';
  }, [payment.biometricAvailable, payment.setupComplete]);

  const onSetup = async () => {
    const ok = await payment.setup();
    if (!ok && payment.error) Alert.alert('Payment Announcer', payment.error);
  };

  const onUnlock = async () => {
    const ok = await payment.unlock();
    if (!ok && payment.error) Alert.alert('Payment Announcer', payment.error);
  };

  if (!payment.isReady) {
    return <View style={[styles.root, { backgroundColor: colors.background }]} accessible accessibilityLabel="Loading Payment Announcer security" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]} accessibilityLabel="Payment Announcer dashboard">
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.primary }]}>SECURE PAYMENTS</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Payment Announcer</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Securely announce incoming payments with a protected, accessible control center.</Text>
        </View>

        <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: colors.border }]} accessible accessibilityRole="summary">
          <View style={[styles.securityIcon, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="fingerprint" size={28} color={colors.primary} />
          </View>
          <View style={styles.securityCopy}>
            <Text style={[styles.securityTitle, { color: colors.foreground }]}>{setupLabel}</Text>
            <Text style={[styles.securityText, { color: colors.mutedForeground }]}>The same strong biometric enrolled in Biometric Vault protects this feature. Device PIN/password fallback is not accepted.</Text>
          </View>
        </View>

        {!payment.setupComplete ? (
          <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Secure setup required</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Verify the existing Biometric Vault credential before opening payment controls.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Set up Payment Announcer with Biometric Vault" disabled={!payment.biometricAvailable} onPress={() => void onSetup()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: payment.biometricAvailable ? 1 : 0.5 }]}>
              <Feather name="lock" size={17} color={colors.primaryForeground} />
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Secure with existing biometric</Text>
            </Pressable>
            {!payment.biometricAvailable && <Text style={[styles.warning, { color: colors.mutedForeground }]}>Open Biometric Vault and enroll a strong biometric first.</Text>}
          </View>
        ) : !payment.isUnlocked ? (
          <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Announcer is locked</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Authenticate before viewing payment controls, histories, or security settings.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Unlock Payment Announcer" onPress={() => void onUnlock()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Feather name="unlock" size={17} color={colors.primaryForeground} />
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Unlock with biometric</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statusIcon, { backgroundColor: colors.secondary }]}><MaterialCommunityIcons name="bullhorn-outline" size={26} color={colors.primary} /></View>
              <View style={styles.securityCopy}>
                <Text style={[styles.securityTitle, { color: colors.foreground }]}>{payment.settings.enabled ? 'Announcements enabled' : 'Announcements paused'}</Text>
                <Text style={[styles.securityText, { color: colors.mutedForeground }]}>Payment data is accepted only through the authenticated payment-event boundary, not arbitrary UI entry.</Text>
              </View>
            </View>

            <SectionCard icon="credit-card" title="Payments" description="Recent payment activity and announcement status." onPress={() => router.push('/payment-announcer/payments')} colors={colors} />
            <SectionCard icon="bar-chart-2" title="Analytics" description="Announcement counts, delivery status, and usage insights." onPress={() => router.push('/payment-announcer/analytics')} colors={colors} />
            <SectionCard icon="volume-2" title="Voice" description="Choose voice strategy, adjust speech, and test availability." onPress={() => router.push('/payment-announcer/voice')} colors={colors} />
            <SectionCard icon="sliders" title="Announcement rules" description="Control which verified payment events are announced." onPress={() => router.push('/payment-announcer/announcement-rules')} colors={colors} />
            <SectionCard icon="shield" title="Security" description="Biometric status, screen protection, lock policy, and access controls." onPress={() => router.push('/payment-announcer/security')} colors={colors} />
            <SectionCard icon="settings" title="Settings" description="Feature preferences and accessibility-friendly behavior." onPress={() => router.push('/payment-announcer/settings')} colors={colors} />

            <Pressable accessibilityRole="button" accessibilityLabel="Lock Payment Announcer" onPress={() => void payment.lock()} style={[styles.lockButton, { borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.foreground} />
              <Text style={[styles.lockButtonText, { color: colors.foreground }]}>Lock Payment Announcer</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionCard({ icon, title, description, onPress, colors }: { icon: React.ComponentProps<typeof Feather>['name']; title: string; description: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${description}`} onPress={onPress} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={21} color={colors.primary} /></View>
      <View style={styles.sectionCopy}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  header: { marginBottom: 2 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 29, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  subtitle: { fontSize: 12, lineHeight: 18 },
  securityCard: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  securityIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  securityCopy: { flex: 1, marginLeft: 11 },
  securityTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  securityText: { fontSize: 11, lineHeight: 16 },
  setupCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 7 },
  body: { fontSize: 11, lineHeight: 17 },
  primaryButton: { marginTop: 15, minHeight: 48, borderRadius: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  warning: { marginTop: 11, fontSize: 10, lineHeight: 15 },
  statusCard: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sectionCard: { minHeight: 78, borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  sectionIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  sectionCopy: { flex: 1, marginLeft: 12, marginRight: 8 },
  lockButton: { minHeight: 46, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 2 },
  lockButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});

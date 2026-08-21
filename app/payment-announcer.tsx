import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { usePaymentAnnouncer } from '@/features/payment-announcer/usePaymentAnnouncer';
import { resolvePaymentTtsProvider } from '@/features/payment-announcer/paymentAnnouncerTts';

export default function PaymentAnnouncerScreen() {
  const colors = useColors();
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

  const testVoice = async () => {
    if (!payment.isUnlocked) return;
    const provider = await resolvePaymentTtsProvider(payment.settings.preferredTtsProvider);
    Alert.alert(
      'Voice availability',
      provider ? `${provider} is available for Payment Announcer.` : 'No supported Payment Announcer voice is available yet.',
    );
  };

  if (!payment.isReady) {
    return <View style={[styles.root, { backgroundColor: colors.background }]} accessible accessibilityLabel="Loading Payment Announcer security" />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
        accessibilityLabel="Payment Announcer"
      >
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.primary }]}>SECURE PAYMENTS</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Payment Announcer</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Announce incoming user-to-user payments using your installed voice or Android's default TTS.</Text>
        </View>

        <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: colors.border }]} accessible accessibilityRole="summary">
          <View style={[styles.securityIcon, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="fingerprint" size={28} color={colors.primary} />
          </View>
          <View style={styles.securityCopy}>
            <Text style={[styles.securityTitle, { color: colors.foreground }]}>Biometric Vault protection</Text>
            <Text style={[styles.securityText, { color: colors.mutedForeground }]}>{setupLabel}. The same biometric enrolled in Vault is used here.</Text>
          </View>
        </View>

        {!payment.setupComplete ? (
          <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Secure setup required</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Payment Announcer cannot be used until you verify the biometric already managed by Biometric Vault.</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Set up Payment Announcer with Biometric Vault"
              disabled={!payment.biometricAvailable}
              onPress={() => void onSetup()}
              style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: payment.biometricAvailable ? 1 : 0.5 }]}
            >
              <Feather name="lock" size={17} color={colors.primaryForeground} />
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Secure with existing biometric</Text>
            </Pressable>
            {!payment.biometricAvailable && (
              <Text style={[styles.warning, { color: colors.mutedForeground }]}>Open Biometric Vault and enroll a strong biometric first.</Text>
            )}
          </View>
        ) : !payment.isUnlocked ? (
          <View style={[styles.setupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment Announcer is locked</Text>
            <Text style={[styles.body, { color: colors.mutedForeground }]}>Authenticate before viewing payment controls or processing announcement data.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Unlock Payment Announcer" onPress={() => void onUnlock()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Feather name="unlock" size={17} color={colors.primaryForeground} />
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>Unlock with fingerprint</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.liveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.liveIcon, { backgroundColor: colors.secondary }]}>
                <MaterialCommunityIcons name="bullhorn-outline" size={26} color={colors.primary} />
              </View>
              <View style={styles.securityCopy}>
                <Text style={[styles.securityTitle, { color: colors.foreground }]}>Ready</Text>
                <Text style={[styles.securityText, { color: colors.mutedForeground }]}>Payment data is not accepted from arbitrary UI input. The transaction/notification source will be connected in the next implementation stage.</Text>
              </View>
            </View>

            <View style={[styles.controlsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Voice and behavior</Text>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>Announcements</Text>
                  <Text style={[styles.body, { color: colors.mutedForeground }]}>Enable spoken payment announcements.</Text>
                </View>
                <Pressable accessibilityRole="switch" accessibilityState={{ checked: payment.settings.enabled }} accessibilityLabel="Payment announcements enabled" onPress={() => void payment.updateSettings({ enabled: !payment.settings.enabled })} style={[styles.switch, { backgroundColor: payment.settings.enabled ? colors.primary : colors.secondary }]}>
                  <View style={[styles.switchThumb, { backgroundColor: payment.settings.enabled ? colors.primaryForeground : colors.mutedForeground, alignSelf: payment.settings.enabled ? 'flex-end' : 'flex-start' }]} />
                </Pressable>
              </View>
              <View style={styles.divider} />
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>Preferred voice</Text>
              <Text style={[styles.body, { color: colors.mutedForeground }]}>Installed voice sheet first; Android default TTS remains the fallback.</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Check available Payment Announcer voice" onPress={() => void testVoice()} style={[styles.secondaryButton, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                <Feather name="volume-2" size={16} color={colors.foreground} />
                <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Check voice</Text>
              </Pressable>
            </View>

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

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 14 },
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
  liveCard: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  liveIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  controlsCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  switch: { width: 48, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  switchThumb: { width: 22, height: 22, borderRadius: 11 },
  divider: { height: 1, marginVertical: 15 },
  secondaryButton: { marginTop: 12, minHeight: 42, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  lockButton: { minHeight: 44, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  lockButtonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});

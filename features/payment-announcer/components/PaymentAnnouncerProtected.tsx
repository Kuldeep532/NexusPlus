import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { clearPaymentAnnouncerUiSession, isPaymentAnnouncerUiAuthenticated, requirePaymentAnnouncerUiAuthentication } from '../paymentAnnouncerAccess';

export function PaymentAnnouncerProtected({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(true);

  const authenticate = async () => {
    setBusy(true);
    const ok = await requirePaymentAnnouncerUiAuthentication();
    setAuthorized(ok);
    setBusy(false);
    if (ok) AccessibilityInfo.announceForAccessibility?.('Payment Announcer protected area unlocked');
  };

  useEffect(() => {
    void (async () => {
      if (isPaymentAnnouncerUiAuthenticated()) {
        setAuthorized(true);
        setBusy(false);
        return;
      }
      await authenticate();
    })();
    return () => clearPaymentAnnouncerUiSession();
  }, []);

  if (busy) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator accessibilityLabel="Authenticating Payment Announcer" /></View>;
  }

  if (!authorized) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}> 
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <View style={[styles.icon, { backgroundColor: colors.secondary }]}><Feather name="lock" size={28} color={colors.primary} /></View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Payment Announcer locked</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>Biometric authentication is required to view payments, analytics, business information, rules, voice configuration, security, or settings.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Unlock Payment Announcer protected area" onPress={() => void authenticate()} style={[styles.button, { backgroundColor: colors.primary }]}> 
            <Feather name="fingerprint" size={17} color={colors.primaryForeground} />
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Unlock with biometric</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 520, borderRadius: 20, borderWidth: 1, padding: 20, alignItems: 'center' },
  icon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', marginBottom: 7, textAlign: 'center' },
  body: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  button: { width: '100%', minHeight: 48, borderRadius: 14, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});

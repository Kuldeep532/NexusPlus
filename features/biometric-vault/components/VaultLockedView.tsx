import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  authError: string | null;
  strongBiometric: boolean;
  isEnrolled: boolean;
  onUnlock: () => void;
  onEnroll: () => void;
  onCredentialSetup: () => void;
}

export function VaultLockedView({
  authError,
  strongBiometric,
  isEnrolled,
  onUnlock,
  onEnroll,
  onCredentialSetup,
}: Props) {
  const colors = useColors();

  return (
    <View style={styles.root}>
      <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
        <MaterialCommunityIcons name="shield-lock" size={60} color={colors.primary} />
      </View>

      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Biometric Vault</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>Private credentials, cards, notes and identity details stay encrypted and locked until Vault authentication succeeds.</Text>

      <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="lock-check" size={20} color={colors.primary} />
        <View style={styles.securityCopy}>
          <Text style={[styles.securityTitle, { color: colors.foreground }]}>AES-256-GCM protected</Text>
          <Text style={[styles.securityDetail, { color: colors.mutedForeground }]}>Vault data is authenticated before it is accepted.</Text>
        </View>
      </View>

      <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="fingerprint" size={20} color={colors.primary} />
        <View style={styles.securityCopy}>
          <Text style={[styles.securityTitle, { color: colors.foreground }]}>{strongBiometric ? 'Strong biometric supported' : 'Strong biometric required'}</Text>
          <Text style={[styles.securityDetail, { color: colors.mutedForeground }]}>Fingerprint or face templates remain managed by Android and are never stored by Nexus Plus.</Text>
        </View>
      </View>

      {authError ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.destructive }]}>{authError}</Text>
      ) : null}

      {!isEnrolled ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Register a biometric for Nexus Biometric Vault"
          accessibilityHint="Confirm the current Android biometric and use it for the Vault. The biometric template stays on the device."
          onPress={onEnroll}
          style={({ pressed }) => [styles.secondaryButton, { backgroundColor: colors.secondary, borderColor: colors.border }, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="fingerprint" size={22} color={colors.primary} />
          <Text style={[styles.secondaryButtonText, { color: colors.foreground }]}>Register Vault Biometric</Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Unlock Nexus Biometric Vault"
        accessibilityHint="Authenticate with the Vault biometric. Device fallback is not used in biometric-only mode."
        onPress={onUnlock}
        style={({ pressed }) => [styles.button, { backgroundColor: colors.primary }, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="shield-key" size={22} color={colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Unlock Vault</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use device PIN, pattern, or password for the Vault"
        accessibilityHint="Use the device screen-lock credential as the Vault authentication method. This does not create a separate Vault password."
        onPress={onCredentialSetup}
        style={({ pressed }) => [styles.linkButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="cellphone-lock" size={18} color={colors.primary} />
        <Text style={[styles.linkText, { color: colors.primary }]}>Use device PIN, pattern, or password</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22, justifyContent: 'center' },
  iconWrap: { alignSelf: 'center', width: 112, height: 112, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: { textAlign: 'center', fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  description: { textAlign: 'center', fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular', marginBottom: 22 },
  securityCard: { minHeight: 78, borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  securityCopy: { flex: 1, marginLeft: 12 },
  securityTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  securityDetail: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  error: { textAlign: 'center', fontSize: 12, lineHeight: 17, fontFamily: 'Inter_500Medium', marginTop: 8 },
  secondaryButton: { minHeight: 52, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 9, paddingHorizontal: 14 },
  secondaryButtonText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  button: { minHeight: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 9 },
  buttonText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  linkButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 7 },
  linkText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});

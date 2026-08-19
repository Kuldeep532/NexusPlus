import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  authError: string | null;
  strongBiometric: boolean;
  onUnlock: () => void;
}

export function VaultLockedView({ authError, strongBiometric, onUnlock }: Props) {
  const colors = useColors();

  return (
    <View style={styles.root}>
      <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
        <MaterialCommunityIcons name="shield-lock" size={60} color={colors.primary} />
      </View>

      <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Nexus Biometric Vault</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>Private credentials, cards, notes and identity details stay encrypted and locked until you authenticate.</Text>

      <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="lock-check" size={20} color={colors.primary} />
        <View style={styles.securityCopy}>
          <Text style={[styles.securityTitle, { color: colors.foreground }]}>AES-256-GCM protected</Text>
          <Text style={[styles.securityDetail, { color: colors.mutedForeground }]}>The vault payload is authenticated before it is accepted.</Text>
        </View>
      </View>

      <View style={[styles.securityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="fingerprint" size={20} color={colors.primary} />
        <View style={styles.securityCopy}>
          <Text style={[styles.securityTitle, { color: colors.foreground }]}>{strongBiometric ? 'Strong biometric available' : 'Device security required'}</Text>
          <Text style={[styles.securityDetail, { color: colors.mutedForeground }]}>Vault access uses the device authentication system.</Text>
        </View>
      </View>

      {authError ? (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.destructive }]}>{authError}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Unlock Nexus Biometric Vault"
        accessibilityHint="Authenticate with your biometric credential or device passcode"
        onPress={onUnlock}
        style={({ pressed }) => [styles.button, { backgroundColor: colors.primary }, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="fingerprint" size={22} color={colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Unlock Vault</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22, justifyContent: 'center' },
  iconWrap: { alignSelf: 'center', width: 112, height: 112, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  title: { textAlign: 'center', fontSize: 27, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  description: { textAlign: 'center', fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular', marginBottom: 22 },
  securityCard: { minHeight: 70, borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  securityCopy: { flex: 1, marginLeft: 12 },
  securityTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  securityDetail: { fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  error: { textAlign: 'center', fontSize: 12, lineHeight: 17, fontFamily: 'Inter_500Medium', marginTop: 8 },
  button: { minHeight: 54, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 9 },
  buttonText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});

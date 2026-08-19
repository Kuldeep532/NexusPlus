import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const ONBOARDING_KEY = 'nexusplus.welcome.completed.v1';
const GOOGLE_CONFIGURED = true;

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    void (async () => {
      const completed = await SecureStore.getItemAsync(ONBOARDING_KEY);
      if (completed === '1') router.replace('/(tabs)' as never);
    })();
  }, []);

  async function loginWithGoogle() {
    setBusy(true);
    setStatus('Opening Google sign-in…');

    try {
      if (!GOOGLE_CONFIGURED) throw new Error('Google sign-in configuration is incomplete.');

      // Credential Manager + Firebase Authentication native integration is wired
      // through the auth adapter. Keep the UI isolated from provider details.
      // Replace this placeholder call once the Android development build includes
      // the Credential Manager native module.
      const authenticated = false;
      if (!authenticated) {
        throw new Error('Google sign-in is not configured in the current development build.');
      }

      await SecureStore.setItemAsync(ONBOARDING_KEY, '1', {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      router.replace('/(tabs)' as never);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}> 
      <View style={styles.center}>
        <View accessible accessibilityLabel="Nexus Plus" style={[styles.logo, { backgroundColor: colors.primary }]}> 
          <Text style={[styles.logoText, { color: colors.primaryForeground }]}>N</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Welcome to Nexus Plus</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in with Google to securely access your Nexus Plus experience.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Login with Google"
          accessibilityHint="Sign in using your Google account"
          onPress={loginWithGoogle}
          disabled={busy}
          style={({ pressed }) => [styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed, busy && styles.disabled]}
        >
          {busy ? <ActivityIndicator color={colors.primary} /> : <MaterialCommunityIcons name="google" size={21} color={colors.primary} />}
          <Text style={[styles.googleText, { color: colors.foreground }]}>{busy ? 'Signing in…' : 'Login with Google'}</Text>
        </Pressable>
        {!!status && <Text accessibilityLiveRegion="polite" style={[styles.status, { color: colors.destructive }]}>{status}</Text>}
        <Text style={[styles.privacy, { color: colors.mutedForeground }]}>Your local documents remain on your device unless you explicitly share them.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', maxWidth: 520, width: '100%', alignSelf: 'center' },
  logo: { width: 92, height: 92, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  logoText: { fontSize: 42, fontFamily: 'Inter_700Bold' },
  title: { fontSize: 30, lineHeight: 37, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, lineHeight: 21, fontFamily: 'Inter_400Regular', textAlign: 'center', maxWidth: 360 },
  actions: { width: '100%', alignSelf: 'center', maxWidth: 520 },
  googleButton: { minHeight: 56, borderRadius: 17, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11 },
  googleText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  status: { marginTop: 12, fontSize: 12, lineHeight: 18, textAlign: 'center', fontFamily: 'Inter_500Medium' },
  privacy: { marginTop: 14, fontSize: 10, lineHeight: 15, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
});

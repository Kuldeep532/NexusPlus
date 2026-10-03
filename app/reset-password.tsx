import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { updatePasswordFromRecoveryUrl } from '@/features/auth/supabaseAuthAdapter';

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const openUrl = async (url: string | null) => {
      if (!url) return;
      const ok = await updatePasswordFromRecoveryUrl(url);
      if (ok) {
        setReady(true);
        return;
      }
      setMessage('This password reset link is no longer valid. Please request a new one.');
    };

    void Linking.getInitialURL().then(openUrl).catch(() => undefined);
    const subscription = Linking.addEventListener('url', ({ url }) => void openUrl(url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/login-plus-register');
      return true;
    });
    return () => sub.remove();
  }, [router]);

  const save = async () => {
    setMessage(null);
    if (!ready) {
      setMessage('Open the password reset link from your email first.');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must contain at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setMessage('The passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await updatePasswordFromRecoveryUrl(null, password);
      setMessage('Your password has been updated. You can now log in with your new password.');
      setTimeout(() => router.replace('/login-plus-register'), 900);
    } catch {
      setMessage('We could not update your password. Please request a new reset link and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]} keyboardShouldPersistTaps="handled">
        <Text style={[styles.kicker, { color: colors.primary }]}>NEXUS PLUS</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Choose a new password</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Use at least 8 characters and keep your new password private.</Text>

        <Text style={[styles.label, { color: colors.foreground }]}>New password</Text>
        <TextInput
          accessibilityLabel="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          placeholder="At least 8 characters"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Confirm password</Text>
        <TextInput
          accessibilityLabel="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
          placeholder="Enter it again"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
        />

        {message ? (
          <View accessible accessibilityRole="status" style={[styles.message, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.messageText, { color: colors.foreground }]}>{message}</Text>
          </View>
        ) : null}

        <Pressable accessibilityRole="button" accessibilityLabel="Save new password" disabled={busy} onPress={() => void save()} style={[styles.button, { backgroundColor: colors.primary, opacity: busy ? 0.55 : 1 }]}>
          <Feather name="check-circle" size={18} color={colors.primaryForeground} />
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Save Password</Text>
        </Pressable>

        <Pressable accessibilityRole="button" accessibilityLabel="Back to login" onPress={() => router.replace('/login-plus-register')} style={styles.back}>
          <Text style={[styles.backText, { color: colors.primary }]}>Back to Login</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 29, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { fontSize: 12, lineHeight: 18, marginBottom: 20 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 6, marginTop: 10 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 12 },
  button: { minHeight: 50, marginTop: 18, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  message: { borderWidth: 1, borderRadius: 13, padding: 12, marginTop: 14 },
  messageText: { fontSize: 11, lineHeight: 16 },
  back: { minHeight: 36, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  backText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
});

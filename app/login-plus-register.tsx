import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/features/auth/useAuth';

type Mode = 'chooser' | 'login' | 'register';

export default function LoginPlusRegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('chooser');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const complete = () => {
    router.back();
  };

  const signInGoogle = async () => {
    try {
      await auth.google();
      complete();
    } catch {
      // Error is rendered below.
    }
  };

  const signInEmail = async () => {
    try {
      await auth.emailSignIn(email, password);
      complete();
    } catch {
      // Error is rendered below.
    }
  };

  const createAccount = async () => {
    try {
      await auth.register({ name, email, password });
      complete();
    } catch {
      // Error is rendered below.
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.primary }]}>NEXUS PLUS ACCOUNT</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Login + Register</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Use Google Credential Manager or your Nexus Plus email account.</Text>
      </View>

      {!!auth.error && (
        <View accessible accessibilityRole="alert" style={[styles.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive }]}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{auth.error}</Text>
        </View>
      )}

      {mode === 'chooser' && (
        <View style={styles.stack}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityHint="Uses Android Credential Manager with your Google account"
            disabled={auth.busy}
            onPress={() => void signInGoogle()}
            style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: auth.busy ? 0.55 : 1 }]}
          >
            <Feather name="globe" size={18} color={colors.primaryForeground} />
            <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Login with Google</Text>
          </Pressable>

          <Pressable accessibilityRole="button" accessibilityLabel="Login with email and password" onPress={() => setMode('login')} style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="mail" size={18} color={colors.foreground} />
            <Text style={[styles.secondaryText, { color: colors.foreground }]}>Login with Email + Password</Text>
          </Pressable>

          <Pressable accessibilityRole="button" accessibilityLabel="Create a new account" onPress={() => setMode('register')} style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user-plus" size={18} color={colors.foreground} />
            <Text style={[styles.secondaryText, { color: colors.foreground }]}>Create Account</Text>
          </Pressable>
        </View>
      )}

      {mode !== 'chooser' && (
        <View style={styles.stack}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to login choices" onPress={() => setMode('chooser')} style={styles.backButton}>
            <Feather name="arrow-left" size={16} color={colors.foreground} />
            <Text style={[styles.backText, { color: colors.foreground }]}>Back</Text>
          </Pressable>

          {mode === 'register' && (
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Name</Text>
              <TextInput accessibilityLabel="Your name" value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
            </View>
          )}

          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
            <TextInput accessibilityLabel="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
            <TextInput accessibilityLabel="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'register' ? 'new-password' : 'password'} placeholder="At least 8 characters" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={mode === 'register' ? 'Create account' : 'Login'}
            disabled={auth.busy}
            onPress={() => void (mode === 'register' ? createAccount() : signInEmail())}
            style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: auth.busy ? 0.55 : 1 }]}
          >
            <Feather name={mode === 'register' ? 'user-plus' : 'log-in'} size={18} color={colors.primaryForeground} />
            <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{mode === 'register' ? 'Create Account' : 'Login'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  header: { marginBottom: 18 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 29, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { fontSize: 12, lineHeight: 18 },
  stack: { gap: 12 },
  primaryButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  secondaryButton: { minHeight: 50, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  backButton: { minHeight: 38, alignSelf: 'flex-start', paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 12 },
  errorBox: { borderWidth: 1, borderRadius: 13, padding: 12, marginBottom: 14 },
  errorText: { fontSize: 11, lineHeight: 16 },
});

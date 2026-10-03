import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/features/auth/useAuth';

type Mode = 'login' | 'register';

function friendlyAuthError(error: string | null): string | null {
  if (!error) return null;
  if (error === 'ACCOUNT_CREATED_CHECK_EMAIL') return 'Your account was created. Please verify your email, then log in.';
  if (error === 'AUTH_SESSION_NOT_CREATED') return 'We could not finish signing you in. Please try again.';
  if (error === 'SUPABASE_AUTH_NOT_CONFIGURED') return 'Sign-in is unavailable right now. Please try again.';
  if (error === 'GOOGLE_SIGN_IN_CANCELLED') return 'Google sign-in was cancelled.';
  if (/GOOGLE_SIGN_IN_STATE_MISMATCH|GOOGLE_SIGN_IN_VERIFIER_MISSING|GOOGLE_SIGN_IN_CODE_MISSING/i.test(error)) return 'We could not verify the Google sign-in. Please try again.';
  if (/INVALID_LOGIN_CREDENTIALS|invalid login credentials|invalid_credentials/i.test(error)) return 'The email or password is incorrect.';
  if (/EMAIL_NOT_CONFIRMED|email not confirmed/i.test(error)) return 'Please verify your email before logging in.';
  if (/USER_ALREADY_EXISTS|already registered|user already registered/i.test(error)) return 'An account with this email already exists. Please log in instead.';
  if (/RATE_LIMIT|too many requests/i.test(error)) return 'Too many sign-in attempts. Please wait a moment and try again.';
  if (/SUPABASE_AUTH_ERROR_5\d\d/i.test(error)) return 'The account service is temporarily unavailable. Please try again later.';
  if (/PASSWORD_RESET_SENT/i.test(error)) return 'We sent a password reset link to your email.';
  if (/INVALID_EMAIL/i.test(error)) return 'Please enter a valid email address.';
  return 'We could not complete your request. Please try again.';
}

export default function LoginPlusRegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const auth = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = useMemo(() => friendlyAuthError(localError ?? auth.error), [localError, auth.error]);

  useEffect(() => {
    const handleBack = () => {
      if (showForgot) {
        setShowForgot(false);
        setForgotMessage(null);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => subscription.remove();
  }, [showForgot]);

  const signInGoogle = async () => {
    setLocalError(null);
    try {
      await auth.google();
    } catch {}
  };

  const signInEmail = async () => {
    setLocalError(null);
    try {
      await auth.emailSignIn(email, password);
    } catch {}
  };

  const createAccount = async () => {
    setLocalError(null);
    try {
      await auth.register({ name, email, password });
    } catch {}
  };

  const requestPasswordReset = async () => {
    setLocalError(null);
    setForgotMessage(null);
    const target = forgotEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(target)) {
      setForgotMessage('Please enter a valid email address.');
      return;
    }

    setForgotBusy(true);
    try {
      await auth.resetPassword(target);
      setForgotMessage('We sent a password reset link to your email.');
    } catch {}
    finally {
      setForgotBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 22) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: colors.primary }]}>NEXUS PLUS</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>
            {showForgot ? 'Reset your password' : mode === 'login' ? 'Welcome back' : 'Create your account'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {showForgot
              ? 'Enter your email and we will send you a secure password reset link.'
              : mode === 'login'
                ? 'Sign in with your email or continue with Google.'
                : 'Create your Nexus Plus account with one simple form.'}
          </Text>
        </View>

        {displayError && !forgotMessage ? (
          <View accessible accessibilityRole="alert" style={[styles.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive }]}>
            <Text style={[styles.errorText, { color: colors.destructive }]}>{displayError}</Text>
          </View>
        ) : null}

        {showForgot ? (
          <View style={styles.stack}>
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <TextInput
                accessibilityLabel="Email address for password reset"
                value={forgotEmail}
                onChangeText={setForgotEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              />
            </View>

            {forgotMessage ? (
              <View accessible accessibilityRole="status" style={[styles.messageBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.messageText, { color: colors.foreground }]}>{forgotMessage}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send password reset link"
              disabled={forgotBusy}
              onPress={() => void requestPasswordReset()}
              style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: forgotBusy ? 0.55 : 1 }]}
            >
              <Feather name="mail" size={18} color={colors.primaryForeground} />
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Send Reset Link</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to login"
              onPress={() => {
                setShowForgot(false);
                setForgotMessage(null);
              }}
              style={styles.textButton}
            >
              <Text style={[styles.textButtonLabel, { color: colors.primary }]}>Back to Login</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.stack}>
            {mode === 'register' ? (
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>Name</Text>
                <TextInput
                  accessibilityLabel="Your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholder="Your name"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                />
              </View>
            ) : null}

            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <TextInput
                accessibilityLabel="Email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              />
            </View>

            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
              <TextInput
                accessibilityLabel="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete={mode === 'register' ? 'new-password' : 'password'}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
              />
            </View>

            {mode === 'login' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
                onPress={() => {
                  setForgotEmail(email);
                  setShowForgot(true);
                  setLocalError(null);
                }}
                style={styles.textButton}
              >
                <Text style={[styles.textButtonLabel, { color: colors.primary }]}>Forgot Password?</Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={mode === 'register' ? 'Create account' : 'Login'}
              disabled={auth.busy}
              onPress={() => void (mode === 'register' ? createAccount() : signInEmail())}
              style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: auth.busy ? 0.55 : 1 }]}
            >
              <Feather name={mode === 'register' ? 'user-plus' : 'log-in'} size={18} color={colors.primaryForeground} />
              <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>
                {mode === 'register' ? 'Create Account' : 'Login'}
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
              disabled={auth.busy}
              onPress={() => void signInGoogle()}
              style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: auth.busy ? 0.55 : 1 }]}
            >
              <Feather name="globe" size={18} color={colors.foreground} />
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>Continue with Google</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={mode === 'login' ? 'Create a new account' : 'Already have an account'}
              onPress={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setLocalError(null);
              }}
              style={styles.textButton}
            >
              <Text style={[styles.textButtonLabel, { color: colors.primary }]}>
                {mode === 'login' ? 'Create a new account' : 'Already have an account? Login'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  header: { marginBottom: 20 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 29, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  subtitle: { fontSize: 12, lineHeight: 18 },
  stack: { gap: 12 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 12 },
  primaryButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  googleButton: { minHeight: 50, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  secondaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  textButton: { minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  textButtonLabel: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 2 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  errorBox: { borderWidth: 1, borderRadius: 13, padding: 12, marginBottom: 14 },
  errorText: { fontSize: 11, lineHeight: 16 },
  messageBox: { borderWidth: 1, borderRadius: 13, padding: 12 },
  messageText: { fontSize: 11, lineHeight: 16 },
});

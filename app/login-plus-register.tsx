import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/features/auth/useAuth';
import { readLaunchPreferences, writeLaunchPreferences, hasPromptedForAppMode, markAppModePrompted, type HomeDestination } from '@/features/app-shell/launchPreferences';

type Mode = 'chooser' | 'login' | 'register';

function friendlyAuthError(error: string | null): string | null {
  if (!error) return null;
  if (error === 'ACCOUNT_CREATED_CHECK_EMAIL') return 'Account created. Please verify your email, then log in.';
  if (error === 'AUTH_SESSION_NOT_CREATED') return 'Authentication did not create a valid session. Please try again.';
  if (error === 'SUPABASE_AUTH_NOT_CONFIGURED') return 'Authentication is temporarily unavailable. Please try again later.';
  if (/INVALID_LOGIN_CREDENTIALS|invalid login credentials|invalid_credentials/i.test(error)) return 'Email or password is incorrect.';
  if (/EMAIL_NOT_CONFIRMED|email not confirmed/i.test(error)) return 'Please verify your email before logging in.';
  if (/USER_ALREADY_EXISTS|already registered|user already registered/i.test(error)) return 'An account with this email already exists. Try logging in.';
  if (/RATE_LIMIT|too many requests/i.test(error)) return 'Too many sign-in attempts. Please wait a moment and try again.';
  if (/SUPABASE_AUTH_ERROR_5\d\d/.test(error)) return 'The account service is temporarily unavailable. Please try again later.';
  return 'We could not complete your sign-in. Please try again.';
}

export default function LoginPlusRegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('chooser');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modeChoice, setModeChoice] = useState<HomeDestination | null>(null);
  const [showModeChoice, setShowModeChoice] = useState(false);

  const complete = async () => {
    const prompted = await hasPromptedForAppMode();
    const prefs = await readLaunchPreferences();
    if (!prompted) {
      setModeChoice(prefs.homeDestination);
      setShowModeChoice(true);
      return;
    }
    router.replace((prefs.homeDestination === 'geeta-home' ? '/geeta-nexus' : '/home') as never);
  };

  useEffect(() => {
    if (!auth.session) return;
  }, [auth.session]);

  const confirmAppMode = async () => {
    if (!modeChoice) return;
    const prefs = await readLaunchPreferences();
    await writeLaunchPreferences({ ...prefs, homeDestination: modeChoice });
    await markAppModePrompted();
    setShowModeChoice(false);
    router.replace((modeChoice === 'geeta-home' ? '/geeta-nexus' : '/home') as never);
  };

  const signInGoogle = async () => {
    try { await auth.google(); complete(); } catch { /* Error is rendered below. */ }
  };
  const signInEmail = async () => {
    try { await auth.emailSignIn(email, password); complete(); } catch { /* Error is rendered below. */ }
  };
  const createAccount = async () => {
    try { await auth.register({ name, email, password }); complete(); } catch { /* Error is rendered below. */ }
  };

  const displayError = friendlyAuthError(auth.error);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}> 
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.primary }]}>NEXUS PLUS ACCOUNT</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Login + Register</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sign in with Google through Supabase or use your Nexus Plus email account.</Text>
      </View>

      {showModeChoice && <View accessibilityRole="dialog" style={[styles.modeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.modeTitle, { color: colors.foreground }]}>Select App Mode</Text>
        <Text style={[styles.modeBody, { color: colors.mutedForeground }]}>Choose the experience to open after login. You can change this later in Settings.</Text>
        {([['nexus-home','Nexus Plus Home'],['geeta-home','Geeta Nexus']] as const).map(([value, title]) => (
          <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: modeChoice === value }} onPress={() => setModeChoice(value)} style={[styles.modeOption,{borderColor:modeChoice===value?colors.primary:colors.border,backgroundColor:modeChoice===value?colors.secondary:colors.card}]}>
            <View style={[styles.radio,{borderColor:modeChoice===value?colors.primary:colors.mutedForeground}]}>{modeChoice===value?<View style={[styles.radioDot,{backgroundColor:colors.primary}]} />:null}</View>
            <Text style={[styles.modeOptionText,{color:colors.foreground}]}>{title}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" accessibilityLabel="Continue with selected app mode" disabled={!modeChoice} onPress={() => void confirmAppMode()} style={[styles.primaryButton,{backgroundColor:colors.primary,opacity:modeChoice?1:.45}]}>
          <Text style={[styles.primaryText,{color:colors.primaryForeground}]}>Continue</Text>
        </Pressable>
      </View>}

      {!showModeChoice && displayError ? <View accessible accessibilityRole="alert" style={[styles.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive }]}><Text style={[styles.errorText, { color: colors.destructive }]}>{displayError}</Text></View> : null}

      {!showModeChoice && mode === 'chooser' && <View style={styles.stack}>
        <Pressable accessibilityRole="button" accessibilityLabel="Login with Google" accessibilityHint="Opens Supabase web authentication with Google" disabled={auth.busy} onPress={() => void signInGoogle()} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: auth.busy ? 0.55 : 1 }]}>
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
      </View>}

      {!showModeChoice && mode !== 'chooser' && <View style={styles.stack}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to login choices" onPress={() => setMode('chooser')} style={styles.backButton}>
          <Feather name="arrow-left" size={16} color={colors.foreground} /><Text style={[styles.backText, { color: colors.foreground }]}>Back</Text>
        </Pressable>
        {mode === 'register' && <View><Text style={[styles.label, { color: colors.foreground }]}>Name</Text><TextInput accessibilityLabel="Your name" value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} /></View>}
        <View><Text style={[styles.label, { color: colors.foreground }]}>Email</Text><TextInput accessibilityLabel="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} /></View>
        <View><Text style={[styles.label, { color: colors.foreground }]}>Password</Text><TextInput accessibilityLabel="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === 'register' ? 'new-password' : 'password'} placeholder="At least 8 characters" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]} /></View>
        <Pressable accessibilityRole="button" accessibilityLabel={mode === 'register' ? 'Create account' : 'Login'} disabled={auth.busy} onPress={() => void (mode === 'register' ? createAccount() : signInEmail())} style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: auth.busy ? 0.55 : 1 }]}>
          <Feather name={mode === 'register' ? 'user-plus' : 'log-in'} size={18} color={colors.primaryForeground} />
          <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>{mode === 'register' ? 'Create Account' : 'Login'}</Text>
        </Pressable>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 }, header: { marginBottom: 18 },
  kicker: { fontSize: 10, letterSpacing: 1.8, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  title: { fontSize: 29, fontFamily: 'Inter_700Bold', marginBottom: 6 }, subtitle: { fontSize: 12, lineHeight: 18 }, stack: { gap: 12 },
  primaryButton: { minHeight: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, primaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  secondaryButton: { minHeight: 50, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, secondaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  backButton: { minHeight: 38, alignSelf: 'flex-start', paddingHorizontal: 5, flexDirection: 'row', alignItems: 'center', gap: 6 }, backText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', marginBottom: 6 }, input: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, fontSize: 12 },
  modeCard:{borderWidth:1,borderRadius:18,padding:15,marginBottom:14,gap:9}, modeTitle:{fontSize:17,fontFamily:'Inter_700Bold'}, modeBody:{fontSize:11,lineHeight:17}, modeOption:{minHeight:52,borderWidth:1,borderRadius:13,padding:10,flexDirection:'row',alignItems:'center',gap:10}, radio:{width:20,height:20,borderRadius:10,borderWidth:2,alignItems:'center',justifyContent:'center'}, radioDot:{width:9,height:9,borderRadius:5}, modeOptionText:{fontSize:12,fontFamily:'Inter_700Bold'},
  errorBox: { borderWidth: 1, borderRadius: 13, padding: 12, marginBottom: 14 }, errorText: { fontSize: 11, lineHeight: 16 },
});

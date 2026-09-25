import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { completeWelcome } from '@/features/app-shell/onboardingPreferences';
import { RadhaKrishnaWelcomeArt } from '@/features/branding/RadhaKrishnaWelcomeArt';

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [accepted, setAccepted] = useState(false);

  const continueToLogin = async () => {
    if (!accepted) return;
    await completeWelcome();
    router.replace('/login-plus-register');
  };

  const openGoogleLogin = async () => {
    if (!accepted) return;
    await continueToLogin();
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <RadhaKrishnaWelcomeArt width={300} height={244} />
        <Text style={[styles.greeting, { color: colors.primary }]}>जय श्री कृष्ण</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Welcome to Nexus Plus</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          One thoughtful place for everyday tools, creativity, accessibility, spiritual experiences and the things you use most.
        </Text>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: accepted }}
          accessibilityLabel="Accept Privacy Policy and Terms and Conditions"
          onPress={() => setAccepted((value) => !value)}
          style={styles.acceptRow}
        >
          <View style={[styles.checkbox, { borderColor: accepted ? colors.primary : colors.border, backgroundColor: accepted ? colors.primary : colors.card }]}>
            {accepted && <Feather name="check" size={14} color={colors.primaryForeground} />}
          </View>
          <Text style={[styles.acceptText, { color: colors.foreground }]}>I accept the Privacy Policy and Terms and Conditions.</Text>
        </Pressable>

        <View style={styles.links}>
          <Link href="/privacy-policy" asChild>
            <Pressable accessibilityRole="link">
              <Text style={[styles.linkText, { color: colors.primary }]}>Privacy Policy</Text>
            </Pressable>
          </Link>
          <Text style={[styles.separator, { color: colors.mutedForeground }]}>•</Text>
          <Link href="/terms-and-conditions" asChild>
            <Pressable accessibilityRole="link">
              <Text style={[styles.linkText, { color: colors.primary }]}>Terms and Conditions</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Get started"
            accessibilityState={{ disabled: !accepted }}
            disabled={!accepted}
            onPress={() => void continueToLogin()}
            style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: accepted ? 1 : 0.45 }]}
          >
            <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Get Started</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Login with Google"
            accessibilityHint="Continue to Google login"
            accessibilityState={{ disabled: !accepted }}
            disabled={!accepted}
            onPress={() => void openGoogleLogin()}
            style={[styles.googleButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: accepted ? 1 : 0.45 }]}
          >
            <Feather name="globe" size={17} color={colors.foreground} />
            <Text style={[styles.googleText, { color: colors.foreground }]}>Login with Google</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 22, gap: 12 },
  greeting: { fontSize: 21, lineHeight: 28, textAlign: 'center', fontFamily: 'Inter_700Bold', marginTop: 2 },
  title: { fontSize: 28, lineHeight: 34, textAlign: 'center', fontFamily: 'Inter_700Bold', marginTop: 2 },
  subtitle: { maxWidth: 350, fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 10 },
  acceptRow: { width: '100%', maxWidth: 360, flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  acceptText: { flex: 1, fontSize: 13, lineHeight: 20 },
  links: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  linkText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  separator: { fontSize: 12 },
  actions: { width: '100%', maxWidth: 360, gap: 10, marginTop: 12 },
  primaryButton: { minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  googleButton: { minHeight: 52, borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center' },
  googleText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});

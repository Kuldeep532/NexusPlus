import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { completeWelcome } from '@/features/app-shell/onboardingPreferences';

const BRAND_LOGO = require('@/assets/generated-branding/nexus-plus-1024.png');

export default function WelcomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const continueToLogin = async () => {
    await completeWelcome();
    router.replace('/login-plus-register');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.hero}>
        <Image source={BRAND_LOGO} contentFit="contain" style={styles.logo} accessibilityLabel="Nexus Plus logo" />
        <Text accessibilityRole="header" style={[styles.title, { color: colors.foreground }]}>Welcome to Nexus Plus</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>One secure home for accessible tools, utilities, reading, media and financial features.</Text>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Get started" accessibilityHint="Marks welcome as completed and opens login and registration." onPress={() => void continueToLogin()} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.primaryText, { color: colors.primaryForeground }]}>Get Started</Text>
        </Pressable>
        <Text style={[styles.securityNote, { color: colors.mutedForeground }]}>Your account and protected features use the existing secure authentication system.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22, justifyContent: 'space-between' },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  logo: { width: 190, height: 190, marginBottom: 28 },
  title: { fontSize: 30, lineHeight: 36, textAlign: 'center', fontFamily: 'Inter_700Bold', marginBottom: 10 },
  subtitle: { maxWidth: 350, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  actions: { gap: 12, paddingBottom: 18 },
  primaryButton: { minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  securityNote: { fontSize: 10, lineHeight: 15, textAlign: 'center' },
});

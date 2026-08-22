import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/useAuth';
import { useColors } from '@/hooks/useColors';
import { getLaunchRoute } from '@/features/app-shell/launchPreferences';
import { PersistentMediaProvider } from '@/media-player/PersistentMediaController';

export default function RootLayout() {
  const auth = useAuth();
  const colors = useColors();
  const router = useRouter();
  const segments = useSegments();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!splashDone || auth.loading) return;

    const inAuth = segments[0] === 'login-plus-register';
    const inPublicWelcome = segments[0] === 'welcome';
    const inLaunchScreen = segments[0] === 'home' || segments[0] === 'geeta-nexus';

    if (!auth.session) {
      if (!inAuth && !inPublicWelcome) router.replace('/login-plus-register');
      return;
    }

    if (auth.session && (inAuth || inPublicWelcome || !inLaunchScreen)) {
      void getLaunchRoute().then((route) => router.replace(route));
    }
  }, [auth.loading, auth.session, router, segments, splashDone]);

  if (!splashDone) {
    return (
      <View style={[styles.splashBridge, { backgroundColor: colors.background }]} accessible accessibilityLabel="Nexus Plus loading. Please wait three seconds.">
        <Text style={[styles.brand, { color: colors.foreground }]}>Nexus Plus</Text>
        <Text style={[styles.message, { color: colors.primary }]}>Spiritual Sundays</Text>
        <ActivityIndicator accessibilityLabel="Loading" color={colors.primary} style={styles.spinner} />
      </View>
    );
  }

  return (
    <PersistentMediaProvider>
      <Stack screenOptions={{ headerShown: true }} />
    </PersistentMediaProvider>
  );
}

const styles = StyleSheet.create({
  splashBridge: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  brand: { fontSize: 30, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  message: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1.4 },
  spinner: { marginTop: 22 },
});

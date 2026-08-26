import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/useAuth';
import { useColors } from '@/hooks/useColors';
import { getLaunchRoute } from '@/features/app-shell/launchPreferences';
import { hasCompletedWelcome } from '@/features/app-shell/onboardingPreferences';
import { PersistentMediaProvider } from '@/media-player/PersistentMediaController';
import { GlobalMiniPlayer } from '@/features/media/GlobalMiniPlayer';

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

    const firstSegment = segments[0];
    const inAuth = firstSegment === 'login-plus-register';
    const inWelcome = firstSegment === 'welcome';
    const inTabs = firstSegment === '(tabs)';
    const inGeeta = firstSegment === 'geeta-nexus';

    if (!auth.session) {
      if (inAuth || inWelcome) return;
      void hasCompletedWelcome().then((completed) => {
        router.replace(completed ? '/login-plus-register' : '/welcome');
      });
      return;
    }

    if (inAuth || inWelcome || (!firstSegment && !inTabs && !inGeeta)) {
      void getLaunchRoute().then((route) => router.replace(route));
    }
  }, [auth.loading, auth.session, router, segments, splashDone]);

  if (!splashDone) {
    return (
      <View style={[styles.splashBridge, { backgroundColor: colors.background }]} accessible accessibilityLabel="Nexus Plus splash screen. Loading the app.">
        <Text accessibilityRole="header" style={[styles.brand, { color: colors.foreground }]}>Nexus Plus</Text>
        <Text style={[styles.message, { color: colors.primary }]}>Spiritual Sundays</Text>
        <ActivityIndicator accessibilityLabel="Loading Nexus Plus" color={colors.primary} style={styles.spinner} />
      </View>
    );
  }

  return (
    <PersistentMediaProvider>
      <View style={styles.root}>
        <Stack screenOptions={{ headerShown: true }} />
        <GlobalMiniPlayer />
      </View>
    </PersistentMediaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splashBridge: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  brand: { fontSize: 30, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  message: { fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1.4 },
  spinner: { marginTop: 22 },
});

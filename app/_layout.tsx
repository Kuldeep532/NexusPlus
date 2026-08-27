import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/features/auth/useAuth';
import { useColors } from '@/hooks/useColors';
import { getLaunchRoute } from '@/features/app-shell/launchPreferences';
import { hasCompletedWelcome } from '@/features/app-shell/onboardingPreferences';
import { PersistentMediaProvider } from '@/media-player/PersistentMediaController';
import { GlobalMiniPlayer } from '@/features/media/GlobalMiniPlayer';
import { RemoteConfigOverlay } from '@/features/supabase/RemoteConfigOverlay';
import { attachFirebaseTokenRefreshListener, registerForFirebaseNotifications } from '@/features/notifications/pushNotifications';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 350, fade: true });

export default function RootLayout() {
  const auth = useAuth();
  const colors = useColors();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (auth.loading) return;
    const timer = setTimeout(() => void SplashScreen.hideAsync(), 150);
    return () => clearTimeout(timer);
  }, [auth.loading]);

  useEffect(() => {
    if (!auth.loading && auth.session) {
      void registerForFirebaseNotifications();
      return attachFirebaseTokenRefreshListener();
    }
    return undefined;
  }, [auth.loading, auth.session]);

  useEffect(() => {
    if (auth.loading) return;

    const firstSegment = segments[0];
    const inAuth = firstSegment === 'login-plus-register';
    const inWelcome = firstSegment === 'welcome';
    const inTabs = firstSegment === '(tabs)';
    const inGeeta = firstSegment === 'geeta-nexus';
    const inHome = firstSegment === 'home';

    if (!auth.session) {
      if (inAuth || inWelcome || inHome || inTabs || inGeeta) return;
      void hasCompletedWelcome().then((completed) => {
        router.replace(completed ? '/home' : '/welcome');
      });
      return;
    }

    if (inAuth || inWelcome || (!firstSegment && !inTabs && !inGeeta && !inHome)) {
      void getLaunchRoute().then((route) => router.replace(route));
    }
  }, [auth.loading, auth.session, router, segments]);

  return (
    <PersistentMediaProvider>
      <RemoteConfigOverlay>
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <Stack screenOptions={{ headerShown: true }} />
          <GlobalMiniPlayer />
        </View>
      </RemoteConfigOverlay>
    </PersistentMediaProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

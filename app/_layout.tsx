import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/features/auth/useAuth';
import { useColors } from '@/hooks/useColors';
import { hasCompletedWelcome } from '@/features/app-shell/onboardingPreferences';
import { PersistentMediaProvider } from '@/media-player/PersistentMediaController';
import { GlobalMiniPlayer } from '@/features/media/GlobalMiniPlayer';
import { RemoteConfigOverlay } from '@/features/supabase/RemoteConfigOverlay';
import { attachFirebaseTokenRefreshListener, registerForFirebaseNotifications } from '@/features/notifications/pushNotifications';
import { startAssistantBootstrap } from '@/features/nexus-assistant/assistantBootstrap';
import DebugErrorBoundary from '../DebugErrorBoundary';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 350, fade: true });

function RootLayoutContent() {
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
    if (!auth.loading && auth.session) return startAssistantBootstrap();
    return undefined;
  }, [auth.loading, auth.session]);

  useEffect(() => {
    if (auth.loading) return;

    const firstSegment = segments[0];
    const inAuth = firstSegment === 'login-plus-register';
    const inWelcome = firstSegment === 'welcome';
    const inTabs = firstSegment === '(tabs)';
    const inHome = firstSegment === 'home';
    const inLegal = firstSegment === 'privacy-policy' || firstSegment === 'terms-and-conditions' || firstSegment === 'about-us';

    if (firstSegment === 'geeta-nexus') {
      router.replace('/(tabs)');
      return;
    }

    if (!auth.session) {
      if (inWelcome || inLegal) return;

      void hasCompletedWelcome().then((completed) => {
        if (!completed) {
          router.replace('/welcome');
          return;
        }
        if (inAuth) return;
        router.replace('/login-plus-register');
      });
      return;
    }

    if (inAuth || inWelcome || (!firstSegment && !inTabs && !inHome && !inLegal)) {
      router.replace('/home');
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

export default function RootLayout() {
  return (
    <DebugErrorBoundary>
      <RootLayoutContent />
    </DebugErrorBoundary>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });

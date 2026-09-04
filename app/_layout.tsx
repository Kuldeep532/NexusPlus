import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { NativeModules, View, StyleSheet } from 'react-native';
import { useAuth } from '@/features/auth/useAuth';
import { useColors } from '@/hooks/useColors';
import { getLaunchRoute } from '@/features/app-shell/launchPreferences';
import { hasCompletedWelcome } from '@/features/app-shell/onboardingPreferences';
import { PersistentMediaProvider } from '@/media-player/PersistentMediaController';
import { GlobalMiniPlayer } from '@/features/media/GlobalMiniPlayer';
import { RemoteConfigOverlay } from '@/features/supabase/RemoteConfigOverlay';
import { attachFirebaseTokenRefreshListener, registerForFirebaseNotifications } from '@/features/notifications/pushNotifications';
import DebugErrorBoundary from '../DebugErrorBoundary';

void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 350, fade: true });

type SafetyState = { acknowledged: boolean; accessibilityEnabled: boolean; ready: boolean };
const SafetyGate = NativeModules.NexusSafetyGate as { getState?: () => Promise<SafetyState> } | undefined;

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
    if (auth.loading) return;

    const firstSegment = segments[0];
    const inSafetySetup = firstSegment === 'safe-device-setup';
    const inLegal = firstSegment === 'privacy-policy' || firstSegment === 'terms-and-conditions' || firstSegment === 'about-us';

    let cancelled = false;
    void SafetyGate?.getState?.().then((safety) => {
      if (cancelled || !safety) return;

      // The Safe Environment gate is intentionally before Welcome/Auth.
      // No login or protected Nexus Plus route is reachable until Android reports
      // that the user has explicitly enabled the Nexus Safety Accessibility Service.
      if (!safety.ready) {
        if (!inSafetySetup && !inLegal) router.replace('/safe-device-setup');
        return;
      }

      if (!auth.session) {
        if (inSafetySetup) {
          void hasCompletedWelcome().then((completed) => {
            if (cancelled) return;
            router.replace(completed ? '/login-plus-register' : '/welcome');
          });
          return;
        }

        const inWelcome = firstSegment === 'welcome';
        const inAuth = firstSegment === 'login-plus-register';
        if (inWelcome || inAuth || inLegal) return;

        void hasCompletedWelcome().then((completed) => {
          if (cancelled) return;
          router.replace(completed ? '/login-plus-register' : '/welcome');
        });
        return;
      }

      if (inSafetySetup || firstSegment === 'login-plus-register' || firstSegment === 'welcome' || (!firstSegment && !inLegal)) {
        void getLaunchRoute().then((route) => {
          if (!cancelled) router.replace(route);
        });
      }
    });

    return () => {
      cancelled = true;
    };
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

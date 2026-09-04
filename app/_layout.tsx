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
    const enforceSafetyGate = async () => {
      if (!SafetyGate?.getState) {
        if (!cancelled && !inSafetySetup && !inLegal) router.replace('/safe-device-setup');
        return;
      }

      try {
        const safety = await SafetyGate.getState();
        if (cancelled) return;

        // Fail closed: if the native safety module exists but does not report a
        // verified ready state, login and protected Nexus routes stay locked.
        if (!safety?.ready) {
          if (!inSafetySetup && !inLegal) router.replace('/safe-device-setup');
          return;
        }

        if (!auth.session) {
          if (inSafetySetup) {
            const completed = await hasCompletedWelcome();
            if (cancelled) return;
            router.replace(completed ? '/login-plus-register' : '/welcome');
            return;
          }

          const inWelcome = firstSegment === 'welcome';
          const inAuth = firstSegment === 'login-plus-register';
          if (inWelcome || inAuth || inLegal) return;

          const completed = await hasCompletedWelcome();
          if (cancelled) return;
          router.replace(completed ? '/login-plus-register' : '/welcome');
          return;
        }

        if (inSafetySetup || firstSegment === 'login-plus-register' || firstSegment === 'welcome' || (!firstSegment && !inLegal)) {
          const route = await getLaunchRoute();
          if (!cancelled) router.replace(route);
        }
      } catch {
        if (!cancelled && !inSafetySetup && !inLegal) router.replace('/safe-device-setup');
      }
    };

    void enforceSafetyGate();

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

import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAuth } from '@/features/auth/useAuth';
import { useColors } from '@/hooks/useColors';
import { hasCompletedWelcome } from '@/features/app-shell/onboardingPreferences';
import { PersistentMediaProvider } from '@/media-player/PersistentMediaController';
import { GlobalMiniPlayer } from '@/features/media/GlobalMiniPlayer';
import { RemoteConfigOverlay } from '@/features/supabase/RemoteConfigOverlay';
import { attachFirebaseTokenRefreshListener, registerForFirebaseNotifications } from '@/features/notifications/pushNotifications';
import { startAssistantBootstrap } from '@/features/nexus-assistant/assistantBootstrap';
import { refreshNexusFeatureFlags } from '@/features/remote-config/featureFlags';
import { readSpiritualReminderPreferences, scheduleSpiritualReminders } from '@/features/spiritual/spiritualReminder';
import { readLaunchPreferences } from '@/features/app-shell/launchPreferences';
import { requestDeviceIntegrityToken, submitIntegrityToken } from '@/features/security/deviceSecurityGate';
import { RadhaKrishnaWelcomeArt } from '@/features/branding/RadhaKrishnaWelcomeArt';
import DebugErrorBoundary from '../DebugErrorBoundary';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
try {
  SplashScreen.setOptions({ duration: 350, fade: true });
} catch {}

function RootLayoutContent() {
  const auth = useAuth();
  const colors = useColors();
  const router = useRouter();
  const segments = useSegments();
  const [startupBrandingVisible, setStartupBrandingVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setStartupBrandingVisible(false), 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (auth.loading) return;
    const timer = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
    }, 150);
    return () => clearTimeout(timer);
  }, [auth.loading]);

  useEffect(() => {
    if (auth.loading || !auth.session) return;
    const requestHash = 'nexus-plus-startup';
    void requestDeviceIntegrityToken(requestHash)
      .then((token) => {
        if (!token) return null;
        return submitIntegrityToken(token, requestHash);
      })
      .catch(() => undefined);
  }, [auth.loading, auth.session]);

  useEffect(() => {
    if (!auth.loading && auth.session) {
      let cancelled = false;
      void Promise.resolve().then(() => registerForFirebaseNotifications()).catch(() => undefined);
      const detach = (() => {
        try { return attachFirebaseTokenRefreshListener(); } catch { return undefined; }
      })();
      return () => {
        cancelled = true;
        void cancelled;
        try { detach?.(); } catch {}
      };
    }
    return undefined;
  }, [auth.loading, auth.session]);

  useEffect(() => {
    if (auth.loading || !auth.session) return undefined;
    let active = true;
    const timer = setTimeout(() => {
      if (!active) return;
      Promise.resolve()
        .then(() => startAssistantBootstrap())
        .then((cleanup) => {
          if (!active) { try { cleanup?.(); } catch {} }
        })
        .catch(() => undefined);
    }, 1000);
    return () => { active = false; clearTimeout(timer); };
  }, [auth.loading, auth.session]);

  useEffect(() => {
    if (auth.loading || !auth.session) return;
    void refreshNexusFeatureFlags().catch(() => undefined);
  }, [auth.loading, auth.session]);

  useEffect(() => {
    if (auth.loading || !auth.session) return;
    void readSpiritualReminderPreferences().then((prefs) => {
      if (prefs.enabled) void scheduleSpiritualReminders();
    }).catch(() => undefined);
  }, [auth.loading, auth.session]);

  useEffect(() => {
    if (auth.loading) return;
    const firstSegment = segments[0];
    const inAuth = firstSegment === 'login-plus-register';
    const inWelcome = firstSegment === 'welcome';
    const inTabs = firstSegment === '(tabs)';
    const inHome = firstSegment === 'home';
    const inGeetaNexus = firstSegment === 'geeta-nexus';
    const inSpiritual = firstSegment === 'spiritual' || firstSegment === '(tabs)' && segments[1] === 'spiritual';
    const inLegal = firstSegment === 'privacy-policy' || firstSegment === 'terms-and-conditions' || firstSegment === 'about-us' || firstSegment === 'contact';

    if (!auth.session) {
      if (inWelcome || inLegal) return;
      void hasCompletedWelcome().then((completed) => {
        if (!completed) { router.replace('/welcome'); return; }
        if (inAuth) return;
        router.replace('/login-plus-register');
      }).catch(() => {});
      return;
    }

    if (inAuth || inWelcome || (!firstSegment && !inTabs && !inHome && !inGeetaNexus && !inSpiritual && !inLegal)) {
      void readLaunchPreferences().then((prefs) => {
        router.replace((prefs.homeDestination === 'geeta-home'
          ? '/geeta-nexus'
          : prefs.homeDestination === 'spiritual-home'
            ? '/(tabs)/spiritual'
            : '/home') as never);
      }).catch(() => router.replace('/home'));
    }
  }, [auth.loading, auth.session, router, segments]);

  return (
    <PersistentMediaProvider>
      <RemoteConfigOverlay>
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <Stack screenOptions={{ headerShown: false }} />
          <GlobalMiniPlayer />
          {startupBrandingVisible && (
            <View style={[styles.startupOverlay, { backgroundColor: colors.background }]} pointerEvents="none" accessibilityRole="summary" accessibilityLabel="Nexus Plus">
              <RadhaKrishnaWelcomeArt width={290} height={290} />
              <Text style={[styles.startupTitle, { color: colors.foreground }]}>Nexus Plus</Text>
            </View>
          )}
        </View>
      </RemoteConfigOverlay>
    </PersistentMediaProvider>
  );
}

export default function RootLayout() {
  return <DebugErrorBoundary><RootLayoutContent /></DebugErrorBoundary>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  startupOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  startupTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: -26 },
});

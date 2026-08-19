import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Redirect, Stack } from 'expo-router';
import { setBaseUrl } from '@workspace/api-client-react';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useColors } from '@/hooks/useColors';

SplashScreen.preventAutoHideAsync();
if (process.env.EXPO_PUBLIC_DOMAIN) setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

const queryClient = new QueryClient();
const ONBOARDING_KEY = 'nexusplus.welcome.completed.v1';

function RootLayoutNav({ onboardingComplete }: { onboardingComplete: boolean }) {
  const colors = useColors();
  if (!onboardingComplete) return <Redirect href="/welcome" />;

  return (
    <Stack screenOptions={{
      headerBackTitle: 'Back',
      headerTintColor: colors.primary,
      headerStyle: { backgroundColor: colors.background },
      headerTitleStyle: { color: colors.foreground, fontFamily: 'Inter_600SemiBold' },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="reader" options={{ title: 'Book Reader' }} />
      <Stack.Screen name="media-player" options={{ title: 'Media Player' }} />
      <Stack.Screen name="biometric-vault" options={{ title: 'Biometric Vault' }} />
      <Stack.Screen name="voices" options={{ title: 'Voice Library' }} />
      <Stack.Screen name="pdf-tools" options={{ title: 'PDF Tools' }} />
      <Stack.Screen name="pdf-to-images" options={{ title: 'PDF to Images' }} />
      <Stack.Screen name="protect-pdf" options={{ title: 'Protect PDF' }} />
      <Stack.Screen name="unlock-pdf" options={{ title: 'Unlock PDF' }} />
      <Stack.Screen name="privacy-policy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="terms-and-conditions" options={{ title: 'Terms and Conditions' }} />
      <Stack.Screen name="about-us" options={{ title: 'About Us' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    void SecureStore.getItemAsync(ONBOARDING_KEY).then((value) => {
      if (mounted) setOnboardingComplete(value === '1');
    }).catch(() => {
      if (mounted) setOnboardingComplete(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && onboardingComplete !== null) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError, onboardingComplete]);

  if (!fontsLoaded && !fontError) return null;
  if (onboardingComplete === null) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav onboardingComplete={onboardingComplete} />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

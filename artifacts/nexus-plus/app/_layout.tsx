import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { setBaseUrl } from '@workspace/api-client-react';
import * as SplashScreen from 'expo-splash-screen';
import { useColors } from '@/hooks/useColors';

SplashScreen.preventAutoHideAsync();
if (process.env.EXPO_PUBLIC_DOMAIN) setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);

const queryClient = new QueryClient();

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack screenOptions={{
      headerBackTitle: 'Back',
      headerTintColor: colors.primary,
      headerStyle: { backgroundColor: colors.background },
      headerTitleStyle: { color: colors.foreground, fontFamily: 'Inter_600SemiBold' },
      headerShadowVisible: false,
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="reader" options={{ title: 'Book Reader' }} />
      <Stack.Screen name="media-player" options={{ title: 'Media Player' }} />
      <Stack.Screen name="biometric-vault" options={{ title: 'Biometric Vault' }} />
      <Stack.Screen name="selfie" options={{ title: 'Selfie' }} />
      <Stack.Screen name="time-announcer" options={{ title: 'Time Announcer' }} />
      <Stack.Screen name="battery-announcer" options={{ title: 'Battery Announcer' }} />
      <Stack.Screen name="language-and-preference" options={{ title: 'Language and Preference' }} />
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
  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

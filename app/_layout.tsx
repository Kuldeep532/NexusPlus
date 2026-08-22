import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth/useAuth';

export default function RootLayout() {
  const auth = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (auth.loading) return;

    const inAuth = segments[0] === 'login-plus-register';
    const inPublicWelcome = segments[0] === 'welcome';

    if (!auth.session && !inAuth && !inPublicWelcome) {
      router.replace('/login-plus-register');
      return;
    }

    if (auth.session && (inAuth || inPublicWelcome)) {
      router.replace('/home');
    }
  }, [auth.loading, auth.session, router, segments]);

  return <Stack screenOptions={{ headerShown: true }} />;
}

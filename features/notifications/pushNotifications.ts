import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSupabaseAccessToken } from '@/features/auth/supabaseAuthAdapter';
import { isFirebaseConfigured } from '@/features/firebase/firebaseConfig';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const CHANNEL_ID = 'nexus-default';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function saveToken(token: string): Promise<void> {
  if (!SUPABASE_URL || !ANON_KEY) return;
  const accessToken = await getSupabaseAccessToken();
  if (!accessToken) return;

  await fetch(`${SUPABASE_URL}/rest/v1/push_tokens?on_conflict=token`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      token,
      platform: Platform.OS,
      app_version: '1.0.0',
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function registerForFirebaseNotifications(): Promise<string | null> {
  if (Platform.OS !== 'android' || !isFirebaseConfigured()) return null;

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Nexus Plus Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const nativeToken = await Notifications.getDevicePushTokenAsync();
  if (nativeToken.type !== 'fcm') return null;
  await saveToken(nativeToken.data);
  return nativeToken.data;
}

export function attachFirebaseTokenRefreshListener(): () => void {
  const subscription = Notifications.addPushTokenListener((event) => {
    if (event.type === 'fcm') void saveToken(event.data);
  });
  return () => subscription.remove();
}

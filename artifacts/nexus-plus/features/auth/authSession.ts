import * as SecureStore from 'expo-secure-store';
import type { NexusUserProfile } from './authTypes';

const USER_KEY = 'nexusplus.auth.user.v1';
const COMPLETE_KEY = 'nexusplus.welcome.completed.v1';

export async function saveAuthenticatedUser(user: NexusUserProfile): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  await SecureStore.setItemAsync(COMPLETE_KEY, '1', {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadAuthenticatedUser(): Promise<NexusUserProfile | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as NexusUserProfile;
  } catch {
    return null;
  }
}

export async function isOnboardingComplete(): Promise<boolean> {
  return (await SecureStore.getItemAsync(COMPLETE_KEY)) === '1';
}

export async function clearAuthenticatedUser(): Promise<void> {
  await SecureStore.deleteItemAsync(USER_KEY);
  await SecureStore.deleteItemAsync(COMPLETE_KEY);
}

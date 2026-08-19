import * as SecureStore from 'expo-secure-store';

const GOOGLE_ID_TOKEN_KEY = 'nexus.google.id-token';

/**
 * Keeps short-lived authentication state out of AsyncStorage/plain files.
 * Android SecureStore uses Android Keystore-backed encrypted storage.
 * No OAuth client secret, service-account key, or signing credential is stored here.
 */
export async function saveGoogleIdToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(GOOGLE_ID_TOKEN_KEY, token, {
    requireAuthentication: true,
  });
}

export async function getGoogleIdToken(): Promise<string | null> {
  return SecureStore.getItemAsync(GOOGLE_ID_TOKEN_KEY, {
    requireAuthentication: true,
  });
}

export async function clearGoogleIdToken(): Promise<void> {
  await SecureStore.deleteItemAsync(GOOGLE_ID_TOKEN_KEY);
}

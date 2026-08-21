import { Platform } from 'react-native';
import { getAndroidVaultBackend } from './nativeVaultBackend.android';
import { getIosVaultBackend } from './nativeVaultBackend.ios';
import type { NativeVaultBackend } from './nativeVaultContract';

export function getNativeVaultBackend(): NativeVaultBackend | null {
  if (Platform.OS === 'android') return getAndroidVaultBackend();
  if (Platform.OS === 'ios') return getIosVaultBackend();
  return null;
}

export async function requireNativeVaultBackend(): Promise<NativeVaultBackend> {
  const backend = getNativeVaultBackend();
  if (!backend || !(await backend.isAvailable())) {
    throw new Error('A native secure vault backend is not available on this platform/build.');
  }
  return backend;
}

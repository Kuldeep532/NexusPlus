import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { NativeVaultBackend } from './nativeVaultContract';

const MASTER_KEY = 'nexus_plus_vault_master_key_v1';
const META_KEY = 'nexus_plus_vault_meta_v1';

export function getIosVaultBackend(): NativeVaultBackend | null {
  if (Platform.OS !== 'ios') return null;
  return {
    platform: 'ios',
    isAvailable: async () => {
      const supported = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return supported && enrolled;
    },
    authenticate: async (reason, allowDeviceCredential) => {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: reason, disableDeviceFallback: !allowDeviceCredential });
      return result.success;
    },
    generateMasterKey: async () => {
      const existing = await SecureStore.getItemAsync(MASTER_KEY);
      if (existing) return existing;
      const generated = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      await SecureStore.setItemAsync(MASTER_KEY, generated, { requireAuthentication: true });
      return generated;
    },
    loadMasterKey: () => SecureStore.getItemAsync(MASTER_KEY, { requireAuthentication: true }),
    deleteMasterKey: () => SecureStore.deleteItemAsync(MASTER_KEY),
    saveVaultMeta: (value) => SecureStore.setItemAsync(META_KEY, value, { requireAuthentication: true }),
    loadVaultMeta: () => SecureStore.getItemAsync(META_KEY, { requireAuthentication: true }),
    deleteVaultMeta: () => SecureStore.deleteItemAsync(META_KEY),
  };
}

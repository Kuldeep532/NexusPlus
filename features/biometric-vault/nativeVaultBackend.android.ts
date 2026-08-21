import { NativeModules, Platform } from 'react-native';
import type { NativeVaultBackend } from './nativeVaultContract';

const moduleName = 'NexusVault';

type NexusVaultNativeModule = {
  isAvailable(): Promise<boolean>;
  authenticate(reason: string, allowDeviceCredential: boolean): Promise<boolean>;
  generateMasterKey(): Promise<string>;
  loadMasterKey(): Promise<string | null>;
  deleteMasterKey(): Promise<void>;
  saveVaultMeta(value: string): Promise<void>;
  loadVaultMeta(): Promise<string | null>;
  deleteVaultMeta(): Promise<void>;
};

export function getAndroidVaultBackend(): NativeVaultBackend | null {
  if (Platform.OS !== 'android') return null;
  const native = NativeModules[moduleName] as NexusVaultNativeModule | undefined;
  if (!native) return null;

  return {
    platform: 'android',
    isAvailable: () => native.isAvailable(),
    authenticate: (reason, allowDeviceCredential) =>
      native.authenticate(reason, allowDeviceCredential),
    generateMasterKey: () => native.generateMasterKey(),
    loadMasterKey: () => native.loadMasterKey(),
    deleteMasterKey: () => native.deleteMasterKey(),
    saveVaultMeta: (value) => native.saveVaultMeta(value),
    loadVaultMeta: () => native.loadVaultMeta(),
    deleteVaultMeta: () => native.deleteVaultMeta(),
  };
}

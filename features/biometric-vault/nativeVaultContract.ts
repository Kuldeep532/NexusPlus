export type VaultPlatform = 'android' | 'ios' | 'unsupported';

export interface NativeVaultBackend {
  platform: VaultPlatform;
  isAvailable(): Promise<boolean>;
  authenticate(reason: string, allowDeviceCredential: boolean): Promise<boolean>;
  generateMasterKey(): Promise<string>;
  loadMasterKey(): Promise<string | null>;
  deleteMasterKey(): Promise<void>;
  saveVaultMeta(value: string): Promise<void>;
  loadVaultMeta(): Promise<string | null>;
  deleteVaultMeta(): Promise<void>;
}

export const NATIVE_VAULT_SCHEMA_VERSION = 1 as const;

export function assertNativeVaultBackend(backend: NativeVaultBackend): NativeVaultBackend {
  if (!backend || typeof backend.authenticate !== 'function') {
    throw new Error('Native Vault backend is unavailable.');
  }
  return backend;
}

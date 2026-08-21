import { NativeModules, Platform } from 'react-native';

export const VAULT_ALGORITHM = 'AES-256-GCM' as const;
export const VAULT_IV_BYTES = 12;
export const VAULT_TAG_BYTES = 16;
export const VAULT_FORMAT_VERSION = 1 as const;

const { NexusVault } = NativeModules;

type NativeVaultModule = {
  generateKey: () => Promise<void>;
  deleteKey: () => Promise<void>;
  encrypt: (plaintext: string, aad: string) => Promise<{ ciphertext: string; iv: string; tag: string }>;
  decrypt: (ciphertext: string, iv: string, tag: string, aad: string) => Promise<string>;
};

function nativeVault(): NativeVaultModule {
  if (Platform.OS === 'android' && NexusVault) return NexusVault as NativeVaultModule;
  throw new Error('Native Nexus Vault security module is unavailable.');
}

export async function generateVaultKey(): Promise<void> {
  if (Platform.OS === 'android') return nativeVault().generateKey();
  throw new Error('A platform-native Vault key provider is required.');
}

export async function keyToBase64(_key?: unknown): Promise<string> {
  throw new Error('Vault keys are non-exportable and cannot be returned to JavaScript.');
}

export async function keyFromBase64(_value?: string): Promise<void> {
  throw new Error('Vault keys are non-importable and managed by the platform keystore.');
}

export async function encryptVaultPayload(
  plaintext: string,
  _key: unknown,
  aad: string,
): Promise<{ ciphertext: string; iv: string; tag: string }> {
  if (Platform.OS === 'android') return nativeVault().encrypt(plaintext, aad);
  throw new Error('A platform-native Vault crypto provider is required.');
}

export async function decryptVaultPayload(
  ciphertext: string,
  iv: string,
  tag: string,
  _key: unknown,
  aad: string,
): Promise<string> {
  if (Platform.OS === 'android') return nativeVault().decrypt(ciphertext, iv, tag, aad);
  throw new Error('A platform-native Vault crypto provider is required.');
}

export function buildVaultAad(
  keyVersion: number,
  appId = 'com.nexuswavetech.nexusplus',
): string {
  return `nexusplus-vault:v${VAULT_FORMAT_VERSION}:key${keyVersion}:${appId}`;
}

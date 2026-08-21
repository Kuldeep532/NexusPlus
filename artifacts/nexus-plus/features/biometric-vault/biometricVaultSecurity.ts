import { NativeModules, Platform } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';

export const VAULT_KEY_ALIAS = 'nexusplus.biometric-vault.master-key.v1';
export const VAULT_META_KEY = 'nexusplus.biometric-vault.meta.v1';
export const VAULT_CREDENTIAL_MODE_KEY = 'nexusplus.biometric-vault.credential-mode.v1';

export type VaultCredentialMode = 'biometric-only' | 'device-auth';

type NativeVaultSecurity = {
  getBiometricCapability: () => Promise<{ hardware: boolean; enrolled: boolean; securityLevel: 'strong' | 'weak' | 'none' }>;
  authenticate: (promptMessage: string, mode: VaultCredentialMode) => Promise<{ success: boolean; error?: string }>;
  ensureKey: () => Promise<void>;
  deleteKey: () => Promise<void>;
  isKeyAvailable: () => Promise<boolean>;
  saveMetadata: (value: string) => Promise<void>;
  loadMetadata: () => Promise<string | null>;
  deleteMetadata: () => Promise<void>;
  saveCredentialMode: (mode: VaultCredentialMode) => Promise<void>;
  loadCredentialMode: () => Promise<VaultCredentialMode>;
};

const { NexusVault } = NativeModules;

function nativeSecurity(): NativeVaultSecurity {
  if (Platform.OS === 'android' && NexusVault) return NexusVault as NativeVaultSecurity;
  throw new Error('Native Nexus Vault security module is unavailable.');
}

export async function getBiometricCapability(): Promise<{
  hardware: boolean;
  enrolled: boolean;
  securityLevel: 'strong' | 'weak' | 'none';
}> {
  if (Platform.OS === 'android') return nativeSecurity().getBiometricCapability();
  return { hardware: false, enrolled: false, securityLevel: 'none' };
}

export async function authenticateVault(
  promptMessage = 'Unlock Nexus Biometric Vault',
  mode: VaultCredentialMode = 'biometric-only',
): Promise<{ success: boolean; error?: string }> {
  if (Platform.OS === 'android') return nativeSecurity().authenticate(promptMessage, mode);
  throw new Error('A platform-native Vault authentication provider is required.');
}

export async function enrollStrongBiometric(): Promise<boolean> {
  const result = await authenticateVault('Register this biometric for Nexus Biometric Vault', 'biometric-only');
  return result.success;
}

export async function enableVaultScreenProtection(): Promise<void> {
  await ScreenCapture.preventScreenCaptureAsync('nexusplus-biometric-vault');
  await ScreenCapture.enableAppSwitcherProtectionAsync(1);
}

export async function disableVaultScreenProtection(): Promise<void> {
  await ScreenCapture.allowScreenCaptureAsync('nexusplus-biometric-vault');
  await ScreenCapture.disableAppSwitcherProtectionAsync();
}

export async function saveVaultMasterKey(_keyBase64?: string): Promise<void> {
  if (Platform.OS === 'android') return nativeSecurity().ensureKey();
  throw new Error('A platform-native Vault key provider is required.');
}

export async function loadVaultMasterKey(): Promise<string | null> {
  if (Platform.OS === 'android') return (await nativeSecurity().isKeyAvailable()) ? '__native_keystore_key__' : null;
  return null;
}

export async function deleteVaultMasterKey(): Promise<void> {
  if (Platform.OS === 'android') return nativeSecurity().deleteKey();
  throw new Error('A platform-native Vault key provider is required.');
}

export async function saveVaultMeta(meta: string): Promise<void> {
  if (Platform.OS === 'android') return nativeSecurity().saveMetadata(meta);
  throw new Error('A platform-native Vault storage provider is required.');
}

export async function loadVaultMeta(): Promise<string | null> {
  if (Platform.OS === 'android') return nativeSecurity().loadMetadata();
  return null;
}

export async function deleteVaultMeta(): Promise<void> {
  if (Platform.OS === 'android') return nativeSecurity().deleteMetadata();
}

export async function saveVaultCredentialMode(mode: VaultCredentialMode): Promise<void> {
  if (Platform.OS === 'android') return nativeSecurity().saveCredentialMode(mode);
  throw new Error('A platform-native Vault storage provider is required.');
}

export async function loadVaultCredentialMode(): Promise<VaultCredentialMode> {
  if (Platform.OS === 'android') return nativeSecurity().loadCredentialMode();
  return 'biometric-only';
}

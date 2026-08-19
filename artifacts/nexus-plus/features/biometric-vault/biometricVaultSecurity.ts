import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as ScreenCapture from 'expo-screen-capture';

export const VAULT_KEY_ALIAS = 'nexusplus.biometric-vault.master-key.v2';
export const VAULT_META_KEY = 'nexusplus.biometric-vault.meta.v2';
export const VAULT_CREDENTIAL_MODE_KEY = 'nexusplus.biometric-vault.credential-mode.v1';

type VaultCredentialMode = 'biometric-only' | 'device-auth';

export async function getBiometricCapability(): Promise<{
  hardware: boolean;
  enrolled: boolean;
  securityLevel: 'strong' | 'weak' | 'none';
}> {
  const hardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hardware || !enrolled) return { hardware, enrolled, securityLevel: 'none' };

  const level = await LocalAuthentication.getEnrolledLevelAsync();
  return {
    hardware,
    enrolled,
    securityLevel:
      level === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG ? 'strong' : 'weak',
  };
}

export async function authenticateVault(
  promptMessage = 'Unlock Nexus Biometric Vault',
  mode: VaultCredentialMode = 'biometric-only',
): Promise<LocalAuthentication.LocalAuthenticationResult> {
  const capability = await getBiometricCapability();

  if (!capability.hardware) throw new Error('Biometric hardware is not available on this device.');
  if (!capability.enrolled) throw new Error('No biometric credential is enrolled on this device.');
  if (capability.securityLevel !== 'strong') {
    throw new Error('A strong biometric credential is required for the vault.');
  }

  return LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: mode === 'device-auth' ? 'Use device passcode' : '',
    cancelLabel: 'Cancel',
    disableDeviceFallback: mode === 'biometric-only',
    biometricsSecurityLevel: 'strong',
  });
}

export async function enrollStrongBiometric(): Promise<boolean> {
  const capability = await getBiometricCapability();
  if (!capability.hardware) throw new Error('This device has no supported biometric hardware.');
  if (!capability.enrolled) throw new Error('No fingerprint or face credential is enrolled in Android.');
  if (capability.securityLevel !== 'strong') throw new Error('The enrolled biometric is not strong enough for the vault.');

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Register this biometric for Nexus Biometric Vault',
    fallbackLabel: '',
    cancelLabel: 'Cancel',
    disableDeviceFallback: true,
    biometricsSecurityLevel: 'strong',
  });

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

export async function saveVaultMasterKey(keyBase64: string): Promise<void> {
  await SecureStore.setItemAsync(VAULT_KEY_ALIAS, keyBase64, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    requireAuthentication: true,
  });
}

export async function loadVaultMasterKey(): Promise<string | null> {
  return SecureStore.getItemAsync(VAULT_KEY_ALIAS, { requireAuthentication: true });
}

export async function deleteVaultMasterKey(): Promise<void> {
  await SecureStore.deleteItemAsync(VAULT_KEY_ALIAS);
}

export async function saveVaultMeta(meta: string): Promise<void> {
  await SecureStore.setItemAsync(VAULT_META_KEY, meta, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadVaultMeta(): Promise<string | null> {
  return SecureStore.getItemAsync(VAULT_META_KEY);
}

export async function deleteVaultMeta(): Promise<void> {
  await SecureStore.deleteItemAsync(VAULT_META_KEY);
}

export async function saveVaultCredentialMode(mode: VaultCredentialMode): Promise<void> {
  await SecureStore.setItemAsync(VAULT_CREDENTIAL_MODE_KEY, mode, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function loadVaultCredentialMode(): Promise<VaultCredentialMode> {
  const mode = await SecureStore.getItemAsync(VAULT_CREDENTIAL_MODE_KEY, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return mode === 'device-auth' ? 'device-auth' : 'biometric-only';
}

import * as SecureStore from 'expo-secure-store';

export const VAULT_KEY_BACKUP_ALIAS = 'nexusplus.biometric-vault.key-backup.v1';

/**
 * Optional recovery metadata only. The actual vault key remains protected by
 * SecureStore's authentication gate. This module deliberately does not expose
 * plaintext key material to application-level storage APIs.
 */
export async function canUseDeviceBoundSecureStorage(): Promise<boolean> {
  return SecureStore.isAvailableAsync();
}

export async function clearRecoveryMetadata(): Promise<void> {
  await SecureStore.deleteItemAsync(VAULT_KEY_BACKUP_ALIAS);
}

import { readVault, writeVault } from '@/features/biometric-vault/biometricVaultRepository';
import type { PasswordVaultItem } from '@/features/biometric-vault/biometricVaultTypes';

/**
 * Saves a protected-PDF password into the existing encrypted Nexus Vault.
 * The password is never written to ordinary AsyncStorage or logs.
 */
export async function savePdfPasswordToVault(
  title: string,
  password: string,
): Promise<void> {
  if (!title.trim()) throw new Error('PDF title is required.');
  if (!password) throw new Error('PDF password is required.');

  const snapshot = await readVault();
  const now = Date.now();
  const item: PasswordVaultItem = {
    id: `pdf-${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    category: 'PASSWORD',
    title: `${title.trim()} PDF password`,
    username: '',
    password,
    notes: 'Password for a protected PDF created in Nexus Plus.',
    createdAt: now,
    updatedAt: now,
    favorite: false,
    tags: ['PDF'],
  };

  await writeVault([...snapshot.items, item], snapshot.keyVersion);
}

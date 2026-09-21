import { addVaultItemWithAuthentication } from '@/features/biometric-vault/secureVaultService';
import type { VaultItem } from '@/features/biometric-vault/biometricVaultTypes';

export async function savePdfPasswordToVault(title: string, password: string): Promise<void> {
  if (!password) throw new Error('PDF password is required.');
  const now = Date.now();
  const normalizedTitle = title.trim() || 'Protected PDF';

  const item: Omit<VaultItem,'id'|'createdAt'|'updatedAt'> = {
    category: 'PASSWORD',
    title: normalizedTitle,
    username: normalizedTitle,
    password,
    website: '',
    appName: 'Nexus Plus Protect PDF',
    source: 'generated',
    generatorProvider: 'nexus',
    notes: 'PDF protection password saved by Nexus Plus Protect PDF.',
  };

  await addVaultItemWithAuthentication(item, 'Authenticate to save the PDF password in Secure Vault.');
  void now;
}

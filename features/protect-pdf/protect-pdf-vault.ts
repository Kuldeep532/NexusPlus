import { addVaultItemWithAuthentication, saveVaultItemWithAuthentication } from '@/features/biometric-vault/secureVaultService';
import type { VaultItem } from '@/features/biometric-vault/biometricVaultTypes';

export async function savePdfPasswordToVault(title: string, password: string): Promise<void> {
  if (!password) throw new Error('PDF password is required.');

  const normalizedTitle = title.trim() || 'Protected PDF';
  const item: VaultItem = {
    id: 'pdf-password-' + Date.now().toString(36),
    category: 'PASSWORD',
    title: normalizedTitle,
    username: normalizedTitle,
    password,
    website: '',
    appName: 'Nexus Plus Protect PDF',
    source: 'generated',
    generatorProvider: 'nexus',
    notes: 'PDF protection password saved by Nexus Plus Protect PDF.',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await addVaultItemWithAuthentication(
    item as Omit<VaultItem,'id'|'createdAt'|'updatedAt'>,
    'Authenticate to save the PDF password in Secure Vault.',
  );
}

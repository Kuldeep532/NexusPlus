import { VaultItem } from '@/features/biometric-vault/biometricVaultTypes';
import { readVault, writeVault } from '@/features/biometric-vault/biometricVaultRepository';

export async function savePdfPasswordToVault(
  title: string,
  password: string,
): Promise<void> {
  if (!password) throw new Error('PDF password is required.');

  const snapshot = await readVault();
  const normalizedTitle = title.trim() || 'Protected PDF';
  const existingIndex = snapshot.items.findIndex(
    (item) => item.category === 'PASSWORD' && item.title === normalizedTitle,
  );

  const now = Date.now();
  const nextPasswordItem: VaultItem = existingIndex >= 0
    ? {
        ...(snapshot.items[existingIndex] as Extract<VaultItem, { category: 'PASSWORD' }>),
        username: normalizedTitle,
        password,
        notes: 'PDF protection password saved by Nexus Plus Protect PDF.',
        updatedAt: now,
      }
    : {
        id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        category: 'PASSWORD',
        title: normalizedTitle,
        username: normalizedTitle,
        password,
        notes: 'PDF protection password saved by Nexus Plus Protect PDF.',
        createdAt: now,
        updatedAt: now,
      };

  const nextItems = [...snapshot.items];
  if (existingIndex >= 0) nextItems[existingIndex] = nextPasswordItem;
  else nextItems.unshift(nextPasswordItem);

  await writeVault(nextItems, snapshot.keyVersion);
}

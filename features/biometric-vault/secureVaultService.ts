import { requireVaultReauthentication } from './biometricVaultSecurity';
import { readVault, writeVault } from './biometricVaultRepository';
import type { VaultItem } from './biometricVaultTypes';

export async function saveVaultItemWithAuthentication(
  item: VaultItem,
  reason = 'Authenticate to save protected Nexus Vault data.',
): Promise<void> {
  const authenticated = await requireVaultReauthentication(reason);
  if (!authenticated) throw new Error('Vault authentication was cancelled.');
  const snapshot = await readVault();
  const nextItems = snapshot.items.filter((current) => current.id !== item.id);
  await writeVault([{ ...item, updatedAt: Date.now() }, ...nextItems], snapshot.keyVersion);
}

export async function addVaultItemWithAuthentication(
  item: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>,
  reason = 'Authenticate to save protected Nexus Vault data.',
): Promise<VaultItem> {
  const authenticated = await requireVaultReauthentication(reason);
  if (!authenticated) throw new Error('Vault authentication was cancelled.');
  const snapshot = await readVault();
  const now = Date.now();
  const created = { ...item, id: `${now.toString(36)}-${Math.random().toString(36).slice(2,10)}`, createdAt: now, updatedAt: now } as VaultItem;
  await writeVault([created, ...snapshot.items], snapshot.keyVersion);
  return created;
}

export async function removeVaultItemWithAuthentication(
  id: string,
  reason = 'Authenticate to delete protected Nexus Vault data.',
): Promise<void> {
  const authenticated = await requireVaultReauthentication(reason);
  if (!authenticated) throw new Error('Vault authentication was cancelled.');
  const snapshot = await readVault();
  await writeVault(snapshot.items.filter((item) => item.id !== id), snapshot.keyVersion);
}

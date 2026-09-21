import type { VaultItem } from './biometricVaultTypes';
import { readVault, writeVault } from './biometricVaultRepository';

export interface VaultCloudRepository {
  pull(): Promise<VaultItem[]>;
  push(items: VaultItem[]): Promise<void>;
  enabled: boolean;
}

const localOnlyRepository: VaultCloudRepository = {
  enabled: false,
  pull: async () => (await readVault()).items,
  push: async (items) => { await writeVault(items); },
};

export function getVaultCloudRepository(): VaultCloudRepository {
  return localOnlyRepository;
}

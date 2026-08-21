import { VaultEnvelope, VaultItem } from './biometricVaultTypes';
import {
  buildVaultAad,
  decryptVaultPayload,
  encryptVaultPayload,
  generateVaultKey,
  VAULT_ALGORITHM,
  VAULT_FORMAT_VERSION,
} from './secureVaultCrypto';
import {
  deleteVaultMasterKey,
  deleteVaultMeta,
  loadVaultMasterKey,
  loadVaultMeta,
  saveVaultMasterKey,
  saveVaultMeta,
} from './biometricVaultSecurity';

const DEFAULT_KEY_VERSION = 1;
const EMPTY_ITEMS: VaultItem[] = [];

function serializeEnvelope(envelope: VaultEnvelope): string {
  return JSON.stringify(envelope);
}

function parseEnvelope(raw: string): VaultEnvelope {
  const value = JSON.parse(raw) as Partial<VaultEnvelope>;
  if (
    value.version !== VAULT_FORMAT_VERSION ||
    value.algorithm !== VAULT_ALGORITHM ||
    typeof value.keyVersion !== 'number' ||
    typeof value.createdAt !== 'number' ||
    typeof value.updatedAt !== 'number' ||
    typeof value.ciphertext !== 'string' ||
    typeof value.iv !== 'string' ||
    typeof value.tag !== 'string' ||
    typeof value.aad !== 'string'
  ) {
    throw new Error('Unsupported or corrupted Nexus Vault format.');
  }
  return value as VaultEnvelope;
}

export interface VaultRepositorySnapshot {
  items: VaultItem[];
  keyVersion: number;
}

export async function initializeVault(): Promise<void> {
  const existingKey = await loadVaultMasterKey();
  const existingMeta = await loadVaultMeta();

  if (existingKey && existingMeta) return;
  if (!existingKey && existingMeta) {
    throw new Error('Vault key is missing while encrypted Vault data still exists.');
  }
  if (existingKey && !existingMeta) {
    throw new Error('Vault metadata is missing while the Vault key still exists.');
  }

  await generateVaultKey();
  const aad = buildVaultAad(DEFAULT_KEY_VERSION);
  const encrypted = await encryptVaultPayload(
    JSON.stringify(EMPTY_ITEMS),
    undefined,
    aad,
  );

  const now = Date.now();
  const envelope: VaultEnvelope = {
    version: VAULT_FORMAT_VERSION,
    algorithm: VAULT_ALGORITHM,
    keyVersion: DEFAULT_KEY_VERSION,
    createdAt: now,
    updatedAt: now,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    tag: encrypted.tag,
    aad,
  };

  await saveVaultMasterKey();
  try {
    await saveVaultMeta(serializeEnvelope(envelope));
  } catch (error) {
    await deleteVaultMasterKey().catch(() => undefined);
    throw error;
  }
}

export async function readVault(): Promise<VaultRepositorySnapshot> {
  const keyAvailable = await loadVaultMasterKey();
  const rawEnvelope = await loadVaultMeta();

  if (!keyAvailable && !rawEnvelope) {
    await initializeVault();
    return readVault();
  }
  if (!keyAvailable || !rawEnvelope) {
    throw new Error('Vault integrity state is invalid. Vault remains locked.');
  }

  const envelope = parseEnvelope(rawEnvelope);
  if (envelope.aad !== buildVaultAad(envelope.keyVersion)) {
    throw new Error('Vault integrity check failed.');
  }

  const plaintext = await decryptVaultPayload(
    envelope.ciphertext,
    envelope.iv,
    envelope.tag,
    undefined,
    envelope.aad,
  );

  const items = JSON.parse(plaintext) as unknown;
  if (!Array.isArray(items)) {
    throw new Error('Vault payload is invalid.');
  }

  return {
    items: items as VaultItem[],
    keyVersion: envelope.keyVersion,
  };
}

export async function writeVault(
  items: VaultItem[],
  keyVersion = DEFAULT_KEY_VERSION,
): Promise<void> {
  const keyAvailable = await loadVaultMasterKey();
  if (!keyAvailable) throw new Error('Vault master key is unavailable.');

  const previousRaw = await loadVaultMeta();
  const previous = previousRaw ? parseEnvelope(previousRaw) : null;
  const aad = buildVaultAad(keyVersion);
  const encrypted = await encryptVaultPayload(
    JSON.stringify(items),
    undefined,
    aad,
  );

  const now = Date.now();
  const envelope: VaultEnvelope = {
    version: VAULT_FORMAT_VERSION,
    algorithm: VAULT_ALGORITHM,
    keyVersion,
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    tag: encrypted.tag,
    aad,
  };

  await saveVaultMeta(serializeEnvelope(envelope));
}

export async function destroyVault(): Promise<void> {
  await deleteVaultMeta();
  await deleteVaultMasterKey();
}

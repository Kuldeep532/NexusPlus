import { VaultEnvelope, VaultItem } from './biometricVaultTypes';
import {
  buildVaultAad,
  decryptVaultPayload,
  encryptVaultPayload,
  generateVaultKey,
  keyFromBase64,
  keyToBase64,
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
  const value = JSON.parse(raw) as VaultEnvelope;
  if (
    value.version !== VAULT_FORMAT_VERSION ||
    value.algorithm !== VAULT_ALGORITHM ||
    typeof value.ciphertext !== 'string' ||
    typeof value.iv !== 'string' ||
    typeof value.tag !== 'string' ||
    typeof value.aad !== 'string'
  ) {
    throw new Error('Unsupported or corrupted Nexus Vault format.');
  }
  return value;
}

export interface VaultRepositorySnapshot {
  items: VaultItem[];
  keyVersion: number;
}

export async function initializeVault(): Promise<void> {
  const existingKey = await loadVaultMasterKey();
  if (existingKey) return;

  const key = await generateVaultKey();
  const keyBase64 = await keyToBase64(key);
  await saveVaultMasterKey(keyBase64);

  const aad = buildVaultAad(DEFAULT_KEY_VERSION);
  const encrypted = await encryptVaultPayload(
    JSON.stringify(EMPTY_ITEMS),
    key,
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

  await saveVaultMeta(serializeEnvelope(envelope));
}

export async function readVault(): Promise<VaultRepositorySnapshot> {
  const keyBase64 = await loadVaultMasterKey();
  const rawEnvelope = await loadVaultMeta();

  if (!keyBase64 || !rawEnvelope) {
    await initializeVault();
    return readVault();
  }

  const envelope = parseEnvelope(rawEnvelope);
  const key = await keyFromBase64(keyBase64);

  if (envelope.aad !== buildVaultAad(envelope.keyVersion)) {
    throw new Error('Vault integrity check failed.');
  }

  const plaintext = await decryptVaultPayload(
    envelope.ciphertext,
    envelope.iv,
    envelope.tag,
    key,
    envelope.aad,
  );

  const items = JSON.parse(plaintext) as VaultItem[];
  if (!Array.isArray(items)) {
    throw new Error('Vault payload is invalid.');
  }

  return {
    items,
    keyVersion: envelope.keyVersion,
  };
}

export async function writeVault(
  items: VaultItem[],
  keyVersion = DEFAULT_KEY_VERSION,
): Promise<void> {
  const keyBase64 = await loadVaultMasterKey();
  if (!keyBase64) throw new Error('Vault master key is unavailable.');

  const key = await keyFromBase64(keyBase64);
  const previousRaw = await loadVaultMeta();
  const previous = previousRaw ? parseEnvelope(previousRaw) : null;
  const aad = buildVaultAad(keyVersion);
  const encrypted = await encryptVaultPayload(
    JSON.stringify(items),
    key,
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

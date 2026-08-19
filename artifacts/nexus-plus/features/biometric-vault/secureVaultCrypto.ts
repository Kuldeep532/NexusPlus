import * as Crypto from 'expo-crypto';

/**
 * AES-256-GCM helper for the vault payload.
 *
 * The vault key itself is never written to AsyncStorage or the filesystem.
 * It is stored through the platform secure storage layer by the vault store.
 */
export const VAULT_ALGORITHM = 'AES-256-GCM' as const;
export const VAULT_KEY_BYTES = 32;
export const VAULT_IV_BYTES = 12;
export const VAULT_TAG_BYTES = 16;
export const VAULT_FORMAT_VERSION = 1 as const;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const output = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    output[i] = binary.charCodeAt(i);
  }
  return output;
}

export function encodeUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

export function decodeUtf8(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

export function toBase64(value: Uint8Array): string {
  return bytesToBase64(value);
}

export function fromBase64(value: string): Uint8Array {
  return base64ToBytes(value);
}

export async function generateVaultKey(): Promise<Crypto.AESEncryptionKey> {
  return Crypto.AESEncryptionKey.generate(Crypto.AESKeySize.AES256);
}

export async function keyToBase64(
  key: Crypto.AESEncryptionKey,
): Promise<string> {
  return key.export();
}

export async function keyFromBase64(
  value: string,
): Promise<Crypto.AESEncryptionKey> {
  return Crypto.AESEncryptionKey.import(value);
}

export async function encryptVaultPayload(
  plaintext: string,
  key: Crypto.AESEncryptionKey,
  aad: string,
): Promise<{
  ciphertext: string;
  iv: string;
  tag: string;
}> {
  const encrypted = await Crypto.aesEncryptAsync(encodeUtf8(plaintext), key, {
    nonce: { length: VAULT_IV_BYTES },
    additionalData: toBase64(encodeUtf8(aad)),
    output: 'base64',
    tagLength: VAULT_TAG_BYTES,
  });

  const combined = fromBase64(encrypted.data);
  const ivBytes = encrypted.nonce;
  const tagBytes = combined.slice(combined.length - VAULT_TAG_BYTES);
  const ciphertextBytes = combined.slice(0, combined.length - VAULT_TAG_BYTES);

  return {
    ciphertext: toBase64(ciphertextBytes),
    iv: toBase64(ivBytes),
    tag: toBase64(tagBytes),
  };
}

export async function decryptVaultPayload(
  ciphertext: string,
  iv: string,
  tag: string,
  key: Crypto.AESEncryptionKey,
  aad: string,
): Promise<string> {
  const ciphertextBytes = fromBase64(ciphertext);
  const tagBytes = fromBase64(tag);
  const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
  combined.set(ciphertextBytes, 0);
  combined.set(tagBytes, ciphertextBytes.length);

  const plaintext = await Crypto.aesDecryptAsync(
    toBase64(combined),
    key,
    {
      nonce: { bytes: fromBase64(iv) },
      additionalData: toBase64(encodeUtf8(aad)),
      output: 'bytes',
      tagLength: VAULT_TAG_BYTES,
    },
  );

  return decodeUtf8(plaintext);
}

export function buildVaultAad(
  keyVersion: number,
  appId = 'com.nexuswavetech.nexusplus',
): string {
  return `nexusplus-vault:v${VAULT_FORMAT_VERSION}:key${keyVersion}:${appId}`;
}

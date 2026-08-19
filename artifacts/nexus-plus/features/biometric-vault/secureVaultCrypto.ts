import * as Crypto from 'expo-crypto';

export const VAULT_ALGORITHM = 'AES-256-GCM' as const;
export const VAULT_IV_BYTES = 12;
export const VAULT_TAG_BYTES = 16;
export const VAULT_FORMAT_VERSION = 1 as const;

function encodeUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function decodeUtf8(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

export async function generateVaultKey(): Promise<Crypto.AESEncryptionKey> {
  return Crypto.AESEncryptionKey.generate(Crypto.AESKeySize.AES256);
}

export async function keyToBase64(key: Crypto.AESEncryptionKey): Promise<string> {
  return key.encoded('base64');
}

export async function keyFromBase64(value: string): Promise<Crypto.AESEncryptionKey> {
  return Crypto.AESEncryptionKey.import(value, 'base64');
}

export async function encryptVaultPayload(
  plaintext: string,
  key: Crypto.AESEncryptionKey,
  aad: string,
): Promise<{ ciphertext: string; iv: string; tag: string }> {
  const sealed = await Crypto.aesEncryptAsync(encodeUtf8(plaintext), key, {
    nonce: { length: VAULT_IV_BYTES },
    additionalData: btoa(aad),
    tagLength: VAULT_TAG_BYTES,
  });

  return {
    ciphertext: (await sealed.ciphertext({ encoding: 'base64', includeTag: false })) as string,
    iv: (await sealed.iv('base64')) as string,
    tag: (await sealed.tag('base64')) as string,
  };
}

export async function decryptVaultPayload(
  ciphertext: string,
  iv: string,
  tag: string,
  key: Crypto.AESEncryptionKey,
  aad: string,
): Promise<string> {
  const sealed = Crypto.AESSealedData.fromParts(iv, ciphertext, tag);
  const plaintext = await Crypto.aesDecryptAsync(sealed, key, {
    additionalData: btoa(aad),
    output: 'bytes',
  });
  return decodeUtf8(plaintext as Uint8Array);
}

export function buildVaultAad(
  keyVersion: number,
  appId = 'com.nexuswavetech.nexusplus',
): string {
  return `nexusplus-vault:v${VAULT_FORMAT_VERSION}:key${keyVersion}:${appId}`;
}

import * as Crypto from 'expo-crypto';

const VERSION = 1 as const;
const KEY_BYTES = 32;

type EncryptedEnvelope = {
  version: typeof VERSION;
  algorithm: 'AES-256-GCM';
  salt: string;
  iv: string;
  ciphertext: string;
  aad: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  return globalThis.btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function fromUtf8(value: Uint8Array): string {
  return new TextDecoder().decode(value);
}

async function deriveAesKey(material: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey('raw', utf8(material), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 210_000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_BYTES * 8 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptCloudPayload(input: {
  plaintext: string;
  keyMaterial: string;
  aad: string;
}): Promise<string> {
  const salt = new Uint8Array(await Crypto.getRandomBytesAsync(16));
  const iv = new Uint8Array(await Crypto.getRandomBytesAsync(12));
  const key = await deriveAesKey(input.keyMaterial, salt);
  const encrypted = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: utf8(input.aad), tagLength: 128 },
    key,
    utf8(input.plaintext),
  ));
  const envelope: EncryptedEnvelope = {
    version: VERSION,
    algorithm: 'AES-256-GCM',
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(encrypted),
    aad: input.aad,
  };
  return JSON.stringify(envelope);
}

export async function decryptCloudPayload(input: {
  envelope: string;
  keyMaterial: string;
}): Promise<string> {
  const parsed = JSON.parse(input.envelope) as EncryptedEnvelope;
  if (parsed.version !== VERSION || parsed.algorithm !== 'AES-256-GCM') throw new Error('CLOUD_SYNC_UNSUPPORTED_ENVELOPE');
  const aadBytes = utf8(parsed.aad);
  const key = await deriveAesKey(input.keyMaterial, base64ToBytes(parsed.salt));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(parsed.iv), additionalData: aadBytes, tagLength: 128 },
    key,
    base64ToBytes(parsed.ciphertext),
  );
  return fromUtf8(new Uint8Array(decrypted));
}

export async function sha256Hex(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, { encoding: Crypto.CryptoEncoding.HEX });
}

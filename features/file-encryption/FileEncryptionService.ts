import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';

const MAGIC = 'NEXUSENC';
const VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;

export type EncryptionResult = {
  uri: string;
  originalName: string;
};

/**
 * The file container format is implemented by the native crypto module.
 * TypeScript intentionally handles orchestration and metadata only.
 */
export type NativeFileEncryptionBridge = {
  isAvailable(): boolean;
  lockFile(inputUri: string, outputUri: string, password: string): Promise<string>;
  unlockFile(inputUri: string, outputUri: string, password: string): Promise<string>;
};

export function getNativeFileEncryptionBridge(): NativeFileEncryptionBridge {
  const bridge = (globalThis as typeof globalThis & {
    NexusFileEncryption?: NativeFileEncryptionBridge;
  }).NexusFileEncryption;
  if (!bridge?.isAvailable()) {
    throw new Error('Native file-encryption engine is not available in this build.');
  }
  return bridge;
}

export async function createEncryptedOutputUri(originalName: string): Promise<string> {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const id = Crypto.randomUUID();
  return `${FileSystem.cacheDirectory}nexus-${id}-${safeName}.nexusenc`;
}

export const FILE_ENCRYPTION_FORMAT = {
  magic: MAGIC,
  version: VERSION,
  algorithm: 'AES-256-GCM' as const,
  kdf: 'PBKDF2-SHA256' as const,
  iterations: PBKDF2_ITERATIONS,
};

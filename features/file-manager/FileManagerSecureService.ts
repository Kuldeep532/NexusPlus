import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { FileEncryptionNative } from '@/features/file-encryption/FileEncryptionNative';

export function isSecureFile(entryName: string): boolean {
  return entryName.toLowerCase().endsWith('.nexusenc');
}

export async function createSecureOutputUri(name: string): Promise<string> {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);
  return `${FileSystem.cacheDirectory}nexus-${Crypto.randomUUID()}-${safe}.nexusenc`;
}

export async function encryptFile(inputUri: string, originalName: string, password: string): Promise<string> {
  if (password.length < 8) throw new Error('Use a password of at least 8 characters.');
  if (!FileEncryptionNative.isAvailable()) throw new Error('Native encryption is unavailable in this build.');
  const outputUri = await createSecureOutputUri(originalName);
  return FileEncryptionNative.lockFile(inputUri, outputUri, password);
}

export async function decryptFile(inputUri: string, originalName: string, password: string): Promise<string> {
  if (password.length < 8) throw new Error('Use a password of at least 8 characters.');
  if (!FileEncryptionNative.isAvailable()) throw new Error('Native encryption is unavailable in this build.');
  const safe = originalName.replace(/\.nexusenc$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const outputUri = `${FileSystem.cacheDirectory}unlocked-${safe}`;
  return FileEncryptionNative.unlockFile(inputUri, outputUri, password);
}

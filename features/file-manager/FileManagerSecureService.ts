import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { FileEncryptionNative } from '@/features/file-encryption/FileEncryptionNative';

export function isSecureFile(entryName: string): boolean {
  return entryName.toLowerCase().endsWith('.nexusenc');
}

export async function createSecureOutputUri(name: string): Promise<string> {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128);
  const base = FileSystem.cacheDirectory;
  if (!base) throw new Error('App cache storage is unavailable.');
  return `${base}nexus-${Crypto.randomUUID()}-${safe}.nexusenc`;
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
  const base = FileSystem.cacheDirectory;
  if (!base) throw new Error('App cache storage is unavailable.');
  const safe = originalName.replace(/\.nexusenc$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  const outputUri = `${base}unlocked-${safe}`;
  return FileEncryptionNative.unlockFile(inputUri, outputUri, password);
}

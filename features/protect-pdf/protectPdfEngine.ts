import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system';
import { PdfNativeBridge } from '../pdf-native/PdfNativeBridge';
import type { ProtectPdfInput, ProtectPdfResult } from './protectPdfTypes';

function safeBaseName(name: string): string {
  return name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document';
}

async function outputPath(name: string, suffix: string): Promise<string> {
  const base = FileSystem.cacheDirectory;
  if (!base) throw new Error('App cache storage is unavailable.');
  const id = Crypto.randomUUID();
  return `${base}nexus-pdf-${id}-${safeBaseName(name)}-${suffix}.pdf`;
}

export async function protectPdfWithEngine(
  input: ProtectPdfInput,
  userPassword: string,
): Promise<ProtectPdfResult> {
  if (!userPassword || userPassword.length < 8) {
    throw new Error('PDF password must be at least 8 characters.');
  }
  const path = await outputPath(input.name, 'protected');
  await PdfNativeBridge.protect(input.uri, path, userPassword);
  return { uri: path, name: `${safeBaseName(input.name)}-protected.pdf` };
}

export async function unlockPdfWithEngine(
  input: ProtectPdfInput,
  password: string,
): Promise<ProtectPdfResult> {
  if (!password) throw new Error('PDF password is required.');
  const path = await outputPath(input.name, 'unlocked');
  await PdfNativeBridge.unlock(input.uri, path, password);
  return { uri: path, name: `${safeBaseName(input.name)}-unlocked.pdf` };
}

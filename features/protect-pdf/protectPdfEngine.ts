import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { PdfNativeBridge } from '../pdf-native/PdfNativeBridge';
import type { ProtectPdfInput, ProtectPdfResult } from './protectPdfTypes';

function safeBaseName(name: string): string {
  return name.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128) || 'document';
}

async function outputPath(name: string): Promise<string> {
  const base = FileSystem.cacheDirectory;
  if (!base) throw new Error('App cache storage is unavailable.');
  return `${base}nexus-pdf-${Crypto.randomUUID()}-${safeBaseName(name)}-unlocked.pdf`;
}

export async function unlockPdfWithEngine(input: ProtectPdfInput, password: string): Promise<ProtectPdfResult> {
  if (!password) throw new Error('PDF password is required.');
  const path = await outputPath(input.name);
  await PdfNativeBridge.unlock(input.uri, path, password);
  return { uri: path, name: `${safeBaseName(input.name)}-unlocked.pdf` };
}

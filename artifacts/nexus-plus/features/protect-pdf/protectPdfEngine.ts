import './pdfnativeRuntime';
import { mergePdfs, openPdf } from 'pdfnative';
import * as FileSystem from 'expo-file-system/legacy';
import type { ProtectPdfInput, ProtectPdfResult } from './protectPdfTypes';

function base64ToBytes(value: string): Uint8Array {
  const binary = globalThis.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, Math.min(index + chunkSize, bytes.length)));
  }
  return globalThis.btoa(binary);
}

async function readBytes(uri: string): Promise<Uint8Array> {
  return base64ToBytes(await FileSystem.readAsStringAsync(uri, { encoding: 'base64' }));
}

async function writeBytes(uri: string, bytes: Uint8Array): Promise<void> {
  await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), { encoding: 'base64' });
}

function outputName(name: string, suffix: string): string {
  return `${name.replace(/\.pdf$/i, '')}-${suffix}.pdf`;
}

export async function protectPdfWithEngine(
  input: ProtectPdfInput,
  userPassword: string,
): Promise<ProtectPdfResult> {
  if (!userPassword || userPassword.length < 8) throw new Error('PDF password must be at least 8 characters.');

  const bytes = await readBytes(input.uri);
  // Parse the source first so malformed PDFs fail before any output is written.
  openPdf(bytes);

  const output = await mergePdfs([bytes], {
    encrypt: {
      algorithm: 'aes256',
      ownerPassword: `${userPassword}:owner`,
      userPassword,
      permissions: {
        print: true,
        copy: false,
        modify: false,
        extractText: true,
      },
    },
  });

  const name = outputName(input.name, 'protected');
  const uri = `${FileSystem.cacheDirectory}${name}`;
  await FileSystem.deleteAsync(uri, { idempotent: true });
  await writeBytes(uri, output);
  return { uri, name };
}

export async function unlockPdfWithEngine(
  input: ProtectPdfInput,
  password: string,
): Promise<ProtectPdfResult> {
  if (!password) throw new Error('PDF password is required.');

  const bytes = await readBytes(input.uri);
  // The password is validated by the Standard Security Handler before export.
  const reader = openPdf(bytes, { password });
  void reader;

  // Passing no encryption options intentionally removes the source encryption.
  const output = await mergePdfs([bytes], { password });
  const name = outputName(input.name, 'unlocked');
  const uri = `${FileSystem.cacheDirectory}${name}`;
  await FileSystem.deleteAsync(uri, { idempotent: true });
  await writeBytes(uri, output);
  return { uri, name };
}

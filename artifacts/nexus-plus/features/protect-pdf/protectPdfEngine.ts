import { PdfNativeBridge } from '../pdf-native/PdfNativeBridge';
import type { ProtectPdfInput, ProtectPdfResult } from './protectPdfTypes';

function outputName(name: string, suffix: string): string {
  return `${name.replace(/\.pdf$/i, '')}-${suffix}.pdf`;
}

function cacheOutput(name: string): string {
  // The native Android/iOS bridge owns the actual destination path/URI.
  // Callers that need a shareable/exportable URI should pass a SAF/content URI
  // adapter at the platform boundary.
  return name;
}

export async function protectPdfWithEngine(
  input: ProtectPdfInput,
  userPassword: string,
): Promise<ProtectPdfResult> {
  if (!userPassword || userPassword.length < 8) {
    throw new Error('PDF password must be at least 8 characters.');
  }
  const name = outputName(input.name, 'protected');
  const uri = cacheOutput(name);
  await PdfNativeBridge.protect(input.uri, uri, userPassword);
  return { uri, name };
}

export async function unlockPdfWithEngine(
  input: ProtectPdfInput,
  password: string,
): Promise<ProtectPdfResult> {
  if (!password) throw new Error('PDF password is required.');
  const name = outputName(input.name, 'unlocked');
  const uri = cacheOutput(name);
  await PdfNativeBridge.unlock(input.uri, uri, password);
  return { uri, name };
}

import { PdfNativeBridge } from '../pdf-native/PdfNativeBridge';
import type { ProtectPdfInput, ProtectPdfResult } from './protectPdfTypes';

function outputName(name: string, suffix: string): string {
  return `${name.replace(/\.pdf$/i, '')}-${suffix}.pdf`;
}

/**
 * The native bridge accepts an app-accessible filesystem path.
 * Higher-level screens can later hand the returned path to the platform
 * sharing/export adapter without changing the PDF engine API.
 */
function outputPath(name: string): string {
  return `nexusplus-cache/${name}`;
}

export async function protectPdfWithEngine(
  input: ProtectPdfInput,
  userPassword: string,
): Promise<ProtectPdfResult> {
  if (!userPassword || userPassword.length < 8) {
    throw new Error('PDF password must be at least 8 characters.');
  }
  const name = outputName(input.name, 'protected');
  const path = outputPath(name);
  await PdfNativeBridge.protect(input.uri, path, userPassword);
  return { uri: path, name };
}

export async function unlockPdfWithEngine(
  input: ProtectPdfInput,
  password: string,
): Promise<ProtectPdfResult> {
  if (!password) throw new Error('PDF password is required.');
  const name = outputName(input.name, 'unlocked');
  const path = outputPath(name);
  await PdfNativeBridge.unlock(input.uri, path, password);
  return { uri: path, name };
}

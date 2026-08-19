import * as FileSystem from 'expo-file-system/legacy';
import type { ProtectPdfInput, ProtectPdfResult } from './protectPdfTypes';

/**
 * Adapter boundary for the PDF security engine.
 *
 * The app must not claim success unless the engine has actually rewritten the
 * PDF with a Standard Security Handler /Encrypt dictionary.
 *
 * The current repository does not yet ship a verified Expo-compatible
 * encryption package. This adapter therefore remains fail-closed.
 */
export async function protectPdfWithEngine(
  input: ProtectPdfInput,
  _userPassword: string,
): Promise<ProtectPdfResult> {
  // Keep FileSystem imported here deliberately: the production implementation
  // will write a new artifact rather than modifying the user's source file.
  void FileSystem;
  throw new Error(
    'PDF encryption engine is not installed. Protect PDF is disabled until a verified Expo development-build engine is configured.',
  );
}

export async function unlockPdfWithEngine(
  input: ProtectPdfInput,
  _password: string,
): Promise<ProtectPdfResult> {
  void FileSystem;
  throw new Error(
    'PDF decryption engine is not installed. Unlock PDF is disabled until a verified Expo development-build engine is configured.',
  );
}

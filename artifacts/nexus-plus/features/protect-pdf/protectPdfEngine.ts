import type { ProtectPdfInput, ProtectPdfResult } from './protectPdfTypes';

/**
 * PDF encryption boundary.
 *
 * Do not replace this with a JS-only file copy. This adapter must call a real
 * PDF Standard Security Handler implementation that writes the /Encrypt
 * dictionary and encrypts the document streams. The app deliberately fails
 * closed until that engine is available.
 */
export async function protectPdfWithEngine(
  _input: ProtectPdfInput,
  _userPassword: string,
): Promise<ProtectPdfResult> {
  throw new Error(
    'PDF encryption engine is not configured. Add a native-compatible PDF security implementation before enabling Protect PDF.',
  );
}

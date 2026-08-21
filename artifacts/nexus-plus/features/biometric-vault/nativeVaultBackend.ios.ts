import type { NativeVaultBackend } from './nativeVaultContract';

/**
 * iOS extension point for the same contract.
 * The implementation can later bind to Keychain/Secure Enclave + LocalAuthentication
 * without changing the shared vault repository or UI.
 */
export function getIosVaultBackend(): NativeVaultBackend | null {
  return null;
}

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytesAsync } from 'expo-crypto';
import type { RemoteComputerUnlockRequest } from './remoteComputerTypes';

const DEVICE_KEY_ID = 'remote-computer.device-key-id';

export interface RemoteComputerBiometricResult {
  authenticated: boolean;
  keyId?: string;
  biometricStrength?: 'strong' | 'weak';
  reason?: string;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

export async function canUseRemoteComputerBiometrics(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

export async function authenticateForRemoteComputer(): Promise<RemoteComputerBiometricResult> {
  const supported = await canUseRemoteComputerBiometrics();
  if (!supported) {
    return { authenticated: false, reason: 'Phone biometric authentication is unavailable.' };
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authenticate to access your computer',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
    biometricsSecurityLevel: LocalAuthentication.SecurityLevel.SECRET,
  });

  if (!result.success) {
    return { authenticated: false, reason: 'Biometric authentication was cancelled or failed.' };
  }

  let keyId = await SecureStore.getItemAsync(DEVICE_KEY_ID);
  if (!keyId) {
    keyId = `nexus-${toHex(await getRandomBytesAsync(16))}`;
    await SecureStore.setItemAsync(DEVICE_KEY_ID, keyId, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  // The private signing key must live in a native OS keystore / secure
  // hardware boundary in a later stage. The JS layer only receives the
  // non-secret key identifier after the user has authenticated.
  return {
    authenticated: true,
    keyId,
    biometricStrength: 'strong',
  };
}

export async function buildUnlockRequest(
  computerId: string,
  challengeId: string,
  challenge: string,
): Promise<RemoteComputerUnlockRequest> {
  const result = await authenticateForRemoteComputer();
  if (!result.authenticated || !result.keyId) {
    throw new Error(result.reason ?? 'Biometric authentication failed.');
  }

  // Signing intentionally stays native. Never replace this with a JS hash,
  // client secret, or reversible token: those would not prove possession of
  // a device-bound private key and must not unlock a computer.
  return {
    computerId,
    challengeId,
    signedChallenge: `native-signature-required:${challenge}`,
    deviceKeyId: result.keyId,
    biometricStrength: result.biometricStrength ?? 'strong',
  };
}

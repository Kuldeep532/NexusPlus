import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { getRandomBytesAsync } from 'expo-crypto';
import type { RemoteComputerUnlockRequest } from './remoteComputerTypes';

const DEVICE_KEY_ID = 'remote-computer.device-key-id';
const DEVICE_SECRET = 'remote-computer.device-secret';

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
  let secret = await SecureStore.getItemAsync(DEVICE_SECRET);
  if (!keyId || !secret) {
    keyId = `nexus-${toHex(await getRandomBytesAsync(16))}`;
    secret = toHex(await getRandomBytesAsync(32));
    await SecureStore.setItemAsync(DEVICE_KEY_ID, keyId, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    await SecureStore.setItemAsync(DEVICE_SECRET, secret, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  // Stage 1 deliberately exposes only a stable device-key identity to JS.
  // The secret is never returned to the UI and is intended for the native
  // secure signing layer added in the next stage.
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

  // Cryptographic signing is intentionally delegated to a native keystore
  // implementation. Do not substitute a JS hash/HMAC here: the raw secret
  // must remain inside secure hardware/keystore boundaries in the next stage.
  return {
    computerId,
    challengeId,
    signedChallenge: `native-signature-required:${challenge}`,
    deviceKeyId: result.keyId,
    biometricStrength: result.biometricStrength ?? 'strong',
  };
}

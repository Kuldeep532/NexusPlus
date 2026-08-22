import * as LocalAuthentication from 'expo-local-authentication';
import { getRandomBytesAsync } from 'expo-crypto';
import type { RemoteComputerUnlockRequest } from './remoteComputerTypes';
import { getRemoteDevicePublicKey, isRemoteKeyAvailable, signRemoteChallenge } from './remoteComputerNative';

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
  return hasHardware && enrolled && isRemoteKeyAvailable();
}

export async function authenticateForRemoteComputer(): Promise<RemoteComputerBiometricResult> {
  const supported = await canUseRemoteComputerBiometrics();
  if (!supported) {
    return { authenticated: false, reason: 'Phone biometric authentication or the device-bound key is unavailable.' };
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

  const publicKey = await getRemoteDevicePublicKey();
  if (!publicKey.keyId) {
    return { authenticated: false, reason: 'The device-bound signing key could not be initialized.' };
  }

  return {
    authenticated: true,
    keyId: publicKey.keyId,
    biometricStrength: 'strong',
  };
}

export async function createRemotePairingIdentity() {
  if (!isRemoteKeyAvailable()) throw new Error('Device-bound remote key is unavailable on this platform.');
  return getRemoteDevicePublicKey();
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

  const signedChallenge = await signRemoteChallenge(challenge);
  return {
    computerId,
    challengeId,
    signedChallenge,
    deviceKeyId: result.keyId,
    biometricStrength: result.biometricStrength ?? 'strong',
  };
}

export async function createPairingNonce(): Promise<string> {
  return toHex(await getRandomBytesAsync(32));
}

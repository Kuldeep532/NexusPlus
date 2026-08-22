import { NativeModules, Platform } from 'react-native';
import { evaluateDeviceIntegrity, type DeviceIntegrityVerdict, type DeviceSecurityState } from './deviceSecurityPolicy';

interface NativeIntegrityModule {
  requestIntegrityToken(requestHash: string): Promise<string>;
}

const nativeIntegrity = NativeModules.NexusIntegrity as NativeIntegrityModule | undefined;

export async function requestDeviceIntegrityToken(requestHash: string): Promise<string | null> {
  if (Platform.OS !== 'android' || !nativeIntegrity) return null;
  try {
    return await nativeIntegrity.requestIntegrityToken(requestHash);
  } catch {
    return null;
  }
}

export function evaluateVerifiedIntegrity(verdict: DeviceIntegrityVerdict): DeviceSecurityState {
  return evaluateDeviceIntegrity(verdict);
}

import { NativeModules, Platform } from 'react-native';
import * as Crypto from 'expo-crypto';

interface NativeIntegrityModule {
  getSecurityState(): Promise<{
    integrityAvailable: boolean;
    licensedInstall: boolean;
    playRecognized: boolean;
    deviceRecall: 'UNKNOWN' | 'FIRST_INSTALL' | 'KNOWN' | 'UNKNOWN_NEW_DEVICE';
  }>;
  requestIntegrityToken(requestHash: string): Promise<string>;
}

function nativeIntegrity(): NativeIntegrityModule {
  if (Platform.OS !== 'android' || !NativeModules.NexusIntegrity) {
    throw new Error('Device integrity service is unavailable.');
  }
  return NativeModules.NexusIntegrity as NativeIntegrityModule;
}

export async function getSecurityState() {
  return nativeIntegrity().getSecurityState();
}

export async function getDurableDeviceHash(): Promise<string> {
  const raw = `${Platform.OS}:nexus-plus:device-binding:v1`;
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw);
}

export async function requestIntegrityToken(challenge: string): Promise<string> {
  return nativeIntegrity().requestIntegrityToken(challenge);
}

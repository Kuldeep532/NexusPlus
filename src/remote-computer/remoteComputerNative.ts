import { NativeModules, Platform } from 'react-native';

interface NexusRemoteKeyModule {
  getPublicKey(): Promise<{ keyId: string; algorithm: string; publicKey: string }>;
  signChallenge(challenge: string): Promise<string>;
}
const nativeModule = NativeModules.NexusRemoteKey as NexusRemoteKeyModule | undefined;
export function isRemoteKeyAvailable(): boolean { return Platform.OS === 'android' && Boolean(nativeModule); }
export async function getRemoteDevicePublicKey() { if (!nativeModule) throw new Error('Device-bound remote key is unavailable on this platform.'); return nativeModule.getPublicKey(); }
/** Signing is delegated to Android Keystore; Android requires user authentication for every use. */
export async function signRemoteChallenge(challenge: string): Promise<string> { if (!nativeModule) throw new Error('Device-bound remote key is unavailable on this platform.'); return nativeModule.signChallenge(challenge); }

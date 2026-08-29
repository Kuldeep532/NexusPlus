import * as Crypto from 'expo-crypto';
import { cctvCredentialStore } from './cctvBackend';

const ERASE_CHALLENGE_PREFIX = 'nexus_plus_cctv_erase_';
const CHALLENGE_TTL_MS = 2 * 60 * 1000;

export interface CctvEraseChallenge {
  id: string;
  cameraId: string;
  expiresAt: number;
  verificationHash: string;
}

async function hash(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

export async function createEraseChallenge(cameraId: string): Promise<CctvEraseChallenge> {
  const nonce = `${cameraId}:${Date.now()}:${Math.random()}`;
  const verificationHash = await hash(nonce);
  return {
    id: `${ERASE_CHALLENGE_PREFIX}${verificationHash.slice(0, 24)}`,
    cameraId,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    verificationHash,
  };
}

export async function verifyCctvEraseAuthorization(
  cameraId: string,
  password: string,
  challenge: CctvEraseChallenge,
): Promise<boolean> {
  if (challenge.cameraId !== cameraId || challenge.expiresAt <= Date.now()) return false;
  const credentials = await cctvCredentialStore.read(cameraId);
  if (!credentials) return false;
  const supplied = await hash(`${cameraId}:${password}`);
  const expected = await hash(`${cameraId}:${credentials.password}`);
  return supplied === expected;
}

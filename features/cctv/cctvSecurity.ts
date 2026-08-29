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

function equalDigest(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export async function createEraseChallenge(cameraId: string): Promise<CctvEraseChallenge> {
  const normalizedCameraId = cameraId.trim();
  if (!normalizedCameraId) throw new Error('Camera ID is required.');
  const nonce = `${normalizedCameraId}:${Date.now()}:${Math.random()}`;
  const verificationHash = await hash(nonce);
  return {
    id: `${ERASE_CHALLENGE_PREFIX}${verificationHash.slice(0, 24)}`,
    cameraId: normalizedCameraId,
    expiresAt: Date.now() + CHALLENGE_TTL_MS,
    verificationHash,
  };
}

export async function verifyCctvEraseAuthorization(
  cameraId: string,
  password: string,
  challenge: CctvEraseChallenge,
): Promise<boolean> {
  const normalizedCameraId = cameraId.trim();
  if (!normalizedCameraId || !password || challenge.cameraId !== normalizedCameraId || challenge.expiresAt <= Date.now()) return false;
  const credentials = await cctvCredentialStore.read(normalizedCameraId);
  if (!credentials) return false;
  const supplied = await hash(`${normalizedCameraId}:${password}`);
  const expected = await hash(`${normalizedCameraId}:${credentials.password}`);
  return equalDigest(supplied, expected);
}

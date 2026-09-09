import * as Crypto from 'expo-crypto';
import { cctvCredentialStore } from './cctvBackend';

const ERASE_CHALLENGE_PREFIX = 'nexus_plus_cctv_erase_';
const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const activeChallenges = new Map<string, CctvEraseChallenge>();

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
  const random = await Crypto.getRandomBytesAsync(32);
  const nonce = `${normalizedCameraId}:${Date.now()}:${Array.from(random).join(',')}`;
  const verificationHash = await hash(nonce);
  const challenge = { id: `${ERASE_CHALLENGE_PREFIX}${verificationHash.slice(0, 24)}`, cameraId: normalizedCameraId, expiresAt: Date.now() + CHALLENGE_TTL_MS, verificationHash };
  activeChallenges.set(challenge.id, challenge);
  return challenge;
}

export async function verifyCctvEraseAuthorization(
  cameraId: string,
  password: string,
  challenge: CctvEraseChallenge,
): Promise<boolean> {
  const normalizedCameraId = cameraId.trim();
  const active = activeChallenges.get(challenge.id);
  if (!normalizedCameraId || !password || !active || active.cameraId !== normalizedCameraId || active.expiresAt <= Date.now() || active.verificationHash !== challenge.verificationHash) return false;
  try {
    const credentials = await cctvCredentialStore.read(normalizedCameraId);
    if (!credentials) return false;
    const supplied = await hash(`${normalizedCameraId}:${password}`);
    const expected = await hash(`${normalizedCameraId}:${credentials.password}`);
    return equalDigest(supplied, expected);
  } finally {
    activeChallenges.delete(challenge.id);
  }
}

export function invalidateCctvEraseChallenge(challengeId: string): void {
  activeChallenges.delete(challengeId);
}

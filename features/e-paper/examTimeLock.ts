import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export const EXAM_LOCK_VERSION = 1 as const;
const DEVICE_KEY = 'nexus.exam.paper.key.v1';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomString(length: number): string {
  let output = '';
  for (let i = 0; i < length; i += 1) output += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return output;
}

export type ExamLockEnvelope = {
  version: 1;
  type: 'NEXUS_EXAM_LOCKED_PAPER';
  unlockAt: string;
  printFrom: string;
  expiresAt?: string;
  paperTitle: string;
  nonce: string;
  payload: string;
  integrity: string;
};

async function getOrCreateDeviceKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_KEY);
  if (existing) return existing;
  const key = `${randomString(48)}-${await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${Date.now()}-${Math.random()}`)}`;
  await SecureStore.setItemAsync(DEVICE_KEY, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  return key;
}

async function integrityDigest(text: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
}

export async function createExamLockEnvelope(input: {
  unlockAt: string;
  printFrom?: string;
  expiresAt?: string;
  paperTitle: string;
  encryptedPayload: string;
}): Promise<ExamLockEnvelope> {
  const deviceKey = await getOrCreateDeviceKey();
  const nonce = randomString(32);
  const integrity = await integrityDigest([EXAM_LOCK_VERSION, input.unlockAt, input.printFrom || input.unlockAt, input.expiresAt || '', input.paperTitle, nonce, input.encryptedPayload, deviceKey].join('|'));
  return {
    version: EXAM_LOCK_VERSION,
    type: 'NEXUS_EXAM_LOCKED_PAPER',
    unlockAt: input.unlockAt,
    printFrom: input.printFrom || input.unlockAt,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    paperTitle: input.paperTitle,
    nonce,
    payload: input.encryptedPayload,
    integrity,
  };
}

export function isExamPaperOpen(envelope: ExamLockEnvelope, now = new Date()): boolean {
  return now.getTime() >= Date.parse(envelope.unlockAt) && (!envelope.expiresAt || now.getTime() <= Date.parse(envelope.expiresAt));
}

export function canPrintExamPaper(envelope: ExamLockEnvelope, now = new Date()): boolean {
  return now.getTime() >= Date.parse(envelope.printFrom) && (!envelope.expiresAt || now.getTime() <= Date.parse(envelope.expiresAt));
}

export function serializeExamLock(envelope: ExamLockEnvelope): string { return JSON.stringify(envelope); }
export function parseExamLock(value: string): ExamLockEnvelope {
  const parsed = JSON.parse(value) as Partial<ExamLockEnvelope>;
  if (parsed.version !== 1 || parsed.type !== 'NEXUS_EXAM_LOCKED_PAPER' || typeof parsed.payload !== 'string' || typeof parsed.unlockAt !== 'string' || typeof parsed.integrity !== 'string') throw new Error('Invalid Nexus exam lock file.');
  return parsed as ExamLockEnvelope;
}

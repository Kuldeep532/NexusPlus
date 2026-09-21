import { getCloudSyncBinding, assertBoundAccount } from './cloudSyncBinding';
import { encryptCloudPayload, sha256Hex } from './cloudCrypto';
import {
  createEncryptedAppDataFile,
  findEncryptedAppDataFile,
  isGoogleDriveConfigured,
  getStoredGoogleDriveAuth,
} from './googleDriveApi';
import type { CloudSyncResult } from './cloudSyncTypes';
import type { GoogleDriveSyncRepository } from './googleDriveSyncRepository';

function fileNameFor(userId: string, kind: string): string {
  return `nexus-test-${kind}-${userId.slice(0, 16)}.nxd`;
}

async function keyMaterialFor(userId: string, email: string): Promise<string> {
  const binding = await getCloudSyncBinding();
  assertBoundAccount(binding, userId, email);
  const deviceAuth = await getStoredGoogleDriveAuth();
  if (!deviceAuth || deviceAuth.userId !== userId || deviceAuth.email.toLowerCase() !== email.toLowerCase()) {
    throw new Error('GOOGLE_DRIVE_ACCOUNT_MISMATCH');
  }
  return `nexus-test|v1|${userId}|${email.trim().toLowerCase()}`;
}

export async function uploadEncryptedBackup(input: {
  userId: string;
  email: string;
  payload: string;
  fileName?: string;
  kind?: string;
}): Promise<CloudSyncResult> {
  if (!isGoogleDriveConfigured()) {
    return { enabled: false, uploaded: false, downloaded: false, message: 'Google Drive sync is disabled because production Drive configuration is unavailable.' };
  }

  const keyMaterial = await keyMaterialFor(input.userId, input.email);
  const aad = `Nexus Test|Google Drive appDataFolder|${input.userId}`;
  const ciphertext = await encryptCloudPayload({ plaintext: input.payload, keyMaterial, aad });
  const kind = input.kind ?? 'app-data';
  const fileName = input.fileName ?? fileNameFor(input.userId, kind);

  await createEncryptedAppDataFile({ fileName, ciphertext });
  return { enabled: true, uploaded: true, downloaded: false, conflict: 'none' };
}

export async function upsertEncryptedBackup(input: {
  userId: string;
  email: string;
  payload: string;
  kind: string;
}): Promise<CloudSyncResult> {
  return uploadEncryptedBackup({
    userId: input.userId,
    email: input.email,
    payload: input.payload,
    kind: input.kind,
  });
}

export async function getEncryptedBackupFile(input: {
  userId: string;
  email: string;
  kind: string;
}) {
  if (!isGoogleDriveConfigured()) return null;
  await keyMaterialFor(input.userId, input.email);
  const fileName = fileNameFor(input.userId, input.kind);
  return findEncryptedAppDataFile(fileName);
}

export const googleDriveSyncService: Pick<GoogleDriveSyncRepository, 'provider' | 'enabled'> = {
  provider: 'google-drive',
  enabled: isGoogleDriveConfigured(),
};

export async function driveCapabilityFingerprint(): Promise<string> {
  return sha256Hex(`nexus-test-drive|${isGoogleDriveConfigured()}`);
}

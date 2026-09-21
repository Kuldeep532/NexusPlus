import { getCloudSyncBinding, assertBoundAccount } from './cloudSyncBinding';
import type { CloudSyncResult } from './cloudSyncTypes';
import type { GoogleDriveSyncRepository } from './googleDriveSyncRepository';

export interface GoogleDriveClient {
  uploadEncryptedObject(input: {
    fileName: string;
    folderId?: string | null;
    ciphertext: string;
    contentType: string;
  }): Promise<{ fileId: string }>;
  downloadEncryptedObject(input: { fileId: string }): Promise<{ ciphertext: string }>;
}

let client: GoogleDriveClient | null = null;

export function configureGoogleDriveClient(nextClient: GoogleDriveClient): void {
  client = nextClient;
}

async function assertOwner(userId: string, email: string) {
  const binding = await getCloudSyncBinding();
  return assertBoundAccount(binding, userId, email);
}

export async function uploadEncryptedBackup(input: {
  userId: string;
  email: string;
  payload: string;
  fileName: string;
}): Promise<CloudSyncResult> {
  const binding = await assertOwner(input.userId, input.email);
  if (!client) return { enabled:false, uploaded:false, downloaded:false, message:'Google Drive client is not configured.' };

  await client.uploadEncryptedObject({
    fileName: input.fileName,
    folderId: binding.driveFolderId,
    ciphertext: input.payload,
    contentType: 'application/octet-stream',
  });

  return { enabled:true, uploaded:true, downloaded:false, conflict:'none' };
}

export const googleDriveSyncService: Pick<GoogleDriveSyncRepository,'provider'|'enabled'> = {
  provider: 'google-drive',
  enabled: Boolean(client),
};

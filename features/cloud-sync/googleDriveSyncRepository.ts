import type { VaultItem } from '@/features/biometric-vault/biometricVaultTypes';
import type { Note, NoteCategory } from '@/features/notepad/notepadTypes';
import type { CloudSyncResult } from './cloudSyncTypes';

export interface GoogleDriveSyncRepository {
  readonly provider: 'google-drive';
  readonly enabled: boolean;
  syncVault(items: VaultItem[]): Promise<CloudSyncResult>;
  syncNotes(notes: Note[], categories: NoteCategory[]): Promise<CloudSyncResult>;
  syncDocuments(records: unknown[]): Promise<CloudSyncResult>;
  syncAppData(payload: Record<string, unknown>): Promise<CloudSyncResult>;
}

const disabledRepository: GoogleDriveSyncRepository = {
  provider: 'google-drive',
  enabled: false,
  syncVault: async () => ({enabled:false,uploaded:false,downloaded:false,message:'Google Drive sync is not configured.'}),
  syncNotes: async () => ({enabled:false,uploaded:false,downloaded:false,message:'Google Drive sync is not configured.'}),
  syncDocuments: async () => ({enabled:false,uploaded:false,downloaded:false,message:'Google Drive sync is not configured.'}),
  syncAppData: async () => ({enabled:false,uploaded:false,downloaded:false,message:'Google Drive sync is not configured.'}),
};

export function getGoogleDriveSyncRepository(): GoogleDriveSyncRepository {
  return disabledRepository;
}

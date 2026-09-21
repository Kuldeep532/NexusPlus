export interface CloudSyncAccountBinding {
  ownerEmail: string;
  ownerUserId: string;
  provider: 'google-drive';
  boundAt: number;
  driveFolderId?: string | null;
}

export interface CloudSyncEnvelope {
  schemaVersion: 1;
  ownerUserId: string;
  ownerEmailHash: string;
  generatedAt: number;
  nonce: string;
  ciphertext: string;
  aad: string;
}

export interface CloudSyncResult {
  enabled: boolean;
  uploaded: boolean;
  downloaded: boolean;
  conflict?: 'local-newer'|'cloud-newer'|'equal'|'none';
  message?: string;
}

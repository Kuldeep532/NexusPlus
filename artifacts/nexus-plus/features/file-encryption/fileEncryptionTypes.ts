export type FileEncryptionAlgorithm = 'AES-256-GCM';

export type FileEncryptionHeader = {
  magic: 'NEXUSENC';
  version: 1;
  algorithm: FileEncryptionAlgorithm;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  saltBase64: string;
  ivBase64: string;
  originalName: string;
  originalMimeType?: string;
};

export type EncryptedFileRecord = {
  id: string;
  encryptedUri: string;
  originalName: string;
  createdAt: number;
  sizeBytes: number;
};

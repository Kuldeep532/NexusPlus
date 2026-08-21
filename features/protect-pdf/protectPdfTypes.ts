export type ProtectPdfState = 'idle' | 'selecting' | 'processing' | 'completed' | 'error';

export interface ProtectPdfInput {
  uri: string;
  name: string;
}

export interface ProtectPdfResult {
  uri: string;
  name: string;
}

export interface ProtectPdfSecurityOptions {
  userPassword: string;
  ownerPassword?: string;
}

export interface PdfRecoveryEnvelope {
  version: 1;
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2-SHA256';
  salt: string;
  iv: string;
  wrappedKey: string;
  tag: string;
  keyVersion: number;
}

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

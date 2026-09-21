export type DocumentSource = 'created' | 'imported' | 'scanned' | 'converted' | 'translated' | 'generated';

export type DocumentRecord = {
  id: string;
  title: string;
  uri: string;
  mimeType: string;
  format: string;
  sizeBytes?: number;
  source: DocumentSource;
  textUri?: string;
  textPreview?: string;
  createdAt: number;
  updatedAt: number;
};

export const DOCUMENT_STUDIO_STORAGE_KEY = 'nexus-plus.document-studio.records.v2';
export const DOCUMENT_STUDIO_ROOT = 'Document Studio';

export function documentIdFor(uri: string, title: string): string {
  return (title.trim().toLowerCase() + '::' + uri).slice(0, 180);
}

export function sanitizeDocumentName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._ -]/g, '_').trim().slice(0, 120) || 'document';
}

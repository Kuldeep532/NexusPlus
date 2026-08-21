export type DocumentFormat =
  | 'pdf'
  | 'epub'
  | 'txt'
  | 'md'
  | 'html'
  | 'rtf'
  | 'docx'
  | 'doc'
  | 'odt'
  | 'unsupported';

export type DocumentDescriptor = {
  uri: string;
  name: string;
  mimeType?: string;
  format: DocumentFormat;
  sizeBytes?: number;
};

export type ReaderPosition = {
  documentId: string;
  page?: number;
  chapter?: number;
  offset?: number;
  progress: number;
  updatedAt: number;
};

export type ReaderBookmark = {
  id: string;
  documentId: string;
  label: string;
  page?: number;
  chapter?: number;
  offset?: number;
  createdAt: number;
};

export const MIME_TO_FORMAT: Record<string, DocumentFormat> = {
  'application/pdf': 'pdf',
  'application/epub+zip': 'epub',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/html': 'html',
  'application/xhtml+xml': 'html',
  'application/rtf': 'rtf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.oasis.opendocument.text': 'odt',
};

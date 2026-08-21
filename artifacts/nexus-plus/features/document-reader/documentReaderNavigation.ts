export type DocumentReaderRoute =
  | { name: 'home' }
  | { name: 'library' }
  | { name: 'document'; uri: string; title?: string }
  | { name: 'bookmarks'; documentId: string }
  | { name: 'settings' }
  | { name: 'profile' };

export const DOCUMENT_READER_HOME_ACTIONS = [
  'open-document',
  'recent-documents',
  'books',
  'bookmarks',
  'settings',
] as const;

export function createDocumentRoute(uri: string, title?: string): DocumentReaderRoute {
  return { name: 'document', uri, title };
}

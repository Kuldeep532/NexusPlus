import type { ReaderBookmark, ReaderPosition } from './documentReaderTypes';

const positions = new Map<string, ReaderPosition>();
const bookmarks = new Map<string, ReaderBookmark[]>();

/**
 * Shared persistence contract. Production Android/iOS storage can replace this
 * implementation without changing reader UI or document backends.
 */
export const documentReaderPersistence = {
  async getPosition(documentId: string): Promise<ReaderPosition | null> {
    return positions.get(documentId) ?? null;
  },

  async savePosition(position: ReaderPosition): Promise<void> {
    positions.set(position.documentId, position);
  },

  async listBookmarks(documentId: string): Promise<ReaderBookmark[]> {
    return [...(bookmarks.get(documentId) ?? [])];
  },

  async saveBookmark(bookmark: ReaderBookmark): Promise<void> {
    const current = bookmarks.get(bookmark.documentId) ?? [];
    const index = current.findIndex((item) => item.id === bookmark.id);
    if (index >= 0) current[index] = bookmark;
    else current.push(bookmark);
    bookmarks.set(bookmark.documentId, current);
  },
};

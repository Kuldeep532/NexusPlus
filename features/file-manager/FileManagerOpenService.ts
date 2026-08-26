import type { FileManagerEntry } from './FileManagerTypes';

export type FileOpenTarget =
  | { kind: 'media'; route: '/media-player'; reason: string }
  | { kind: 'document'; route: '/reader'; reason: string }
  | { kind: 'external'; route: null; reason: string };

const MEDIA_EXTENSIONS = new Set([
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus',
  'mp4', 'mkv', 'avi', 'mov', 'webm', 'm4v', '3gp',
]);

const DOCUMENT_EXTENSIONS = new Set([
  'pdf', 'txt', 'md', 'log', 'rtf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'epub', 'mobi', 'fb2',
]);

export function resolveFileOpenTarget(entry: FileManagerEntry): FileOpenTarget {
  if (entry.isDirectory) {
    return { kind: 'external', route: null, reason: 'Folders are opened by the File Manager browser.' };
  }

  const extension = entry.extension.toLowerCase();
  if (MEDIA_EXTENSIONS.has(extension)) {
    return { kind: 'media', route: '/media-player', reason: 'Media file detected.' };
  }
  if (DOCUMENT_EXTENSIONS.has(extension)) {
    return { kind: 'document', route: '/reader', reason: 'Readable document detected.' };
  }
  return { kind: 'external', route: null, reason: 'No Nexus Plus specialized viewer is registered for this file type.' };
}

import type { FileManagerTab, FileManagerViewMode, FileSortMode } from './FileManagerTypes';

export const FILE_MANAGER_TABS: ReadonlyArray<{ id: FileManagerTab; title: string; description: string }> = [
  { id: 'browse', title: 'Browse', description: 'Folders and files on this device.' },
  { id: 'categories', title: 'Categories', description: 'Images, videos, audio, documents and archives.' },
  { id: 'recent', title: 'Recent', description: 'Recently changed or opened files.' },
  { id: 'secure', title: 'Secure', description: 'Encryption and protected file workflows.' },
];

export const DEFAULT_FILE_MANAGER_VIEW: FileManagerViewMode = 'list';
export const DEFAULT_FILE_SORT: FileSortMode = 'name-asc';

export const SUPPORTED_FILE_GROUPS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'],
  videos: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'm4v', '3gp'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus'],
  documents: ['pdf', 'txt', 'md', 'log', 'rtf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
  archives: ['zip', 'rar', 'tar', 'gz', '7z'],
} as const;

import * as FileSystem from 'expo-file-system';
import type { FileManagerEntry } from './FileManagerTypes';

export type LocalFileAIAction = 'summarize' | 'classify' | 'extract-text' | 'suggest-name';

export type LocalFileAIResult = {
  action: LocalFileAIAction;
  title: string;
  body: string;
  model: 'local-rule-engine-v1';
  sourceUri: string;
};

/**
 * Local-only AI foundation.
 * This stage intentionally performs no network request and sends no file content
 * to any remote service. The adapter is designed so a bundled/mobile local model
 * can replace the deterministic engine later without changing the File Manager UI.
 */
export async function runLocalFileAI(entry: FileManagerEntry, action: LocalFileAIAction): Promise<LocalFileAIResult> {
  if (!entry.uri) throw new Error('File URI is required.');

  let text = '';
  if (!entry.isDirectory && ['txt', 'md', 'log', 'rtf'].includes(entry.extension)) {
    text = (await FileSystem.readAsStringAsync(entry.uri)).slice(0, 12000);
  }

  const titleByAction: Record<LocalFileAIAction, string> = {
    summarize: 'Local summary',
    classify: 'Local classification',
    'extract-text': 'Local text extraction',
    'suggest-name': 'Local name suggestion',
  };

  let body: string;
  switch (action) {
    case 'summarize':
      body = text ? summarizeLocally(text) : 'A local model adapter can summarize this binary file when a bundled model is available.';
      break;
    case 'extract-text':
      body = text || 'Text extraction requires a compatible local document parser/model for this file type.';
      break;
    case 'classify':
      body = classifyByExtension(entry.extension, entry.name);
      break;
    case 'suggest-name':
      body = suggestName(entry.name, entry.extension);
      break;
  }

  return { action, title: titleByAction[action], body, model: 'local-rule-engine-v1', sourceUri: entry.uri };
}

function summarizeLocally(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'The selected document is empty.';
  const sentences = normalized.match(/[^.!?]+[.!?]+/g) ?? [normalized];
  return sentences.slice(0, 3).join(' ').slice(0, 900);
}

function classifyByExtension(extension: string, name: string): string {
  const ext = extension.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'].includes(ext)) return 'Image';
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'm4v', '3gp'].includes(ext)) return 'Video';
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus'].includes(ext)) return 'Audio';
  if (['pdf', 'txt', 'md', 'log', 'rtf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'epub', 'mobi', 'fb2'].includes(ext)) return 'Document';
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'Archive';
  return name.includes('.') ? `File (${ext || 'unknown'})` : 'File';
}

function suggestName(name: string, extension: string): string {
  const stem = name.replace(/\.[^.]+$/, '').trim();
  if (!stem) return `Nexus File${extension ? `.${extension}` : ''}`;
  return stem.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase()).slice(0, 80) + (extension ? `.${extension}` : '');
}

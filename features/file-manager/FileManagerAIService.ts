import * as FileSystem from 'expo-file-system';
import type { FileManagerEntry } from './FileManagerTypes';
import { FILE_MANAGER_LOCAL_MODEL, type FileManagerLocalModelCapability } from './FileManagerLocalModel';

export type LocalFileAIAction = 'summarize' | 'classify' | 'extract-text' | 'suggest-name';

export type LocalFileAIResult = {
  action: LocalFileAIAction;
  title: string;
  body: string;
  model: string;
  sourceUri: string;
  runtime: 'on-device';
};

const actionToCapability: Record<LocalFileAIAction, FileManagerLocalModelCapability> = {
  summarize: 'summarize',
  classify: 'classify',
  'extract-text': 'extract',
  'suggest-name': 'rename',
};

function classifyByExtension(extension: string, name: string): string {
  const ext = extension.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic'].includes(ext)) return 'Image';
  if (['mp4', 'mkv', 'avi', 'mov', 'webm', 'm4v', '3gp'].includes(ext)) return 'Video';
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus'].includes(ext)) return 'Audio';
  if (['pdf', 'txt', 'md', 'log', 'rtf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'epub', 'mobi', 'fb2'].includes(ext)) return 'Document';
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'Archive';
  return name.includes('.') ? `File (${ext || 'unknown'})` : 'File';
}

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
  if (action === 'classify') {
    body = classifyByExtension(entry.extension, entry.name);
  } else if (text) {
    body = FILE_MANAGER_LOCAL_MODEL.infer(text, actionToCapability[action]);
  } else {
    body = action === 'summarize'
      ? `This ${classifyByExtension(entry.extension, entry.name).toLowerCase()} is ${formatBytes(entry.size)}. Text content is not read for this file type.`
      : action === 'extract-text'
        ? 'No compatible local text reader is registered for this file type.'
        : FILE_MANAGER_LOCAL_MODEL.infer(entry.name, actionToCapability[action]);
  }

  return {
    action,
    title: titleByAction[action],
    body,
    model: `${FILE_MANAGER_LOCAL_MODEL.id}@${FILE_MANAGER_LOCAL_MODEL.version}`,
    sourceUri: entry.uri,
    runtime: 'on-device',
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

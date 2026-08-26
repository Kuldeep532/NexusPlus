import * as FileSystem from 'expo-file-system';
import type { FileManagerEntry, FileSortMode } from './FileManagerTypes';

const asNumber = (value: string | number | undefined): number => typeof value === 'number' ? value : Number(value ?? 0);

export function entryFromInfo(uri: string, info: FileSystem.FileInfo): FileManagerEntry {
  const name = uri.replace(/\/$/, '').split('/').pop() || uri;
  const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  return {
    id: uri,
    uri,
    name,
    isDirectory: info.isDirectory,
    size: asNumber(info.size),
    modifiedAt: asNumber(info.modificationTime) * 1000,
    extension,
  };
}

export async function listDirectory(uri: string): Promise<FileManagerEntry[]> {
  const names = await FileSystem.StorageAccessFramework.readDirectoryAsync(uri).catch(async () => []);
  return Promise.all(names.map(async (name) => {
    const childUri = name.startsWith('content://') ? name : `${uri.replace(/\/$/, '')}/${name}`;
    const info = await FileSystem.getInfoAsync(childUri);
    return entryFromInfo(childUri, info);
  }));
}

export function sortEntries(entries: FileManagerEntry[], mode: FileSortMode): FileManagerEntry[] {
  return [...entries].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    if (mode === 'name-asc') return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    if (mode === 'name-desc') return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
    if (mode === 'size-asc') return a.size - b.size;
    if (mode === 'size-desc') return b.size - a.size;
    if (mode === 'date-new') return b.modifiedAt - a.modifiedAt;
    if (mode === 'date-old') return a.modifiedAt - b.modifiedAt;
    return a.extension.localeCompare(b.extension) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

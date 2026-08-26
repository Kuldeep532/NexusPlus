import * as FileSystem from 'expo-file-system';
import type { FileManagerEntry, FileSortMode } from './FileManagerTypes';
import { entryFromInfo, listDirectory, sortEntries } from './FileManagerService';

export type FileManagerStorageStats = {
  total: number;
  free: number;
  used: number;
  ratio: number;
};

export async function refreshDirectory(uri: string, sortMode: FileSortMode): Promise<FileManagerEntry[]> {
  const entries = await listDirectory(uri);
  return sortEntries(entries, sortMode);
}

export async function createFolder(parentUri: string, name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Folder name is required.');
  const uri = `${parentUri.replace(/\/$/, '')}/${trimmed}`;
  await FileSystem.makeDirectoryAsync(uri, { intermediates: false });
  return uri;
}

export async function renameEntry(uri: string, newName: string): Promise<string> {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('A new name is required.');
  const parent = uri.slice(0, uri.lastIndexOf('/'));
  const destination = `${parent}/${trimmed}`;
  await FileSystem.moveAsync({ from: uri, to: destination });
  return destination;
}

export async function deleteEntry(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function copyEntry(uri: string, destinationUri: string): Promise<void> {
  await FileSystem.copyAsync({ from: uri, to: destinationUri });
}

export async function moveEntry(uri: string, destinationUri: string): Promise<void> {
  await FileSystem.moveAsync({ from: uri, to: destinationUri });
}

export async function inspectEntry(uri: string): Promise<FileManagerEntry> {
  const info = await FileSystem.getInfoAsync(uri);
  return entryFromInfo(uri, info);
}

export function getStorageStats(): FileManagerStorageStats {
  const total = Math.max(Number(FileSystem.totalDiskSpace), 1);
  const free = Math.max(Number(FileSystem.freeDiskStorage), 0);
  const used = Math.max(total - free, 0);
  return { total, free, used, ratio: Math.min(used / total, 1) };
}

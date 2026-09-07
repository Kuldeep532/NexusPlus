import * as FileSystem from 'expo-file-system/legacy';
import type { FileManagerEntry, FileSortMode } from './FileManagerTypes';
import { entryFromInfo, listDirectory, sortEntries } from './FileManagerService';

export type FileManagerStorageStats = { total: number; free: number; used: number; ratio: number };

export async function refreshDirectory(uri: string, sortMode: FileSortMode): Promise<FileManagerEntry[]> {
  return sortEntries(await listDirectory(uri), sortMode);
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

export async function deleteEntry(uri: string): Promise<void> { await FileSystem.deleteAsync(uri, { idempotent: true }); }
export async function copyEntry(uri: string, destinationUri: string): Promise<void> { await FileSystem.copyAsync({ from: uri, to: destinationUri }); }
export async function moveEntry(uri: string, destinationUri: string): Promise<void> { await FileSystem.moveAsync({ from: uri, to: destinationUri }); }
export async function inspectEntry(uri: string): Promise<FileManagerEntry> { return entryFromInfo(uri, await FileSystem.getInfoAsync(uri)); }

export function getStorageStats(): FileManagerStorageStats {
  const total = Math.max(Number(awaitableLegacyValue(FileSystem.getTotalDiskCapacityAsync)), 1);
  const free = Math.max(Number(awaitableLegacyValue(FileSystem.getFreeDiskStorageAsync)), 0);
  const used = Math.max(total - free, 0);
  return { total, free, used, ratio: Math.min(used / total, 1) };
}

function awaitableLegacyValue<T>(promiseFactory: () => Promise<T>): T | Promise<T> { return promiseFactory(); }

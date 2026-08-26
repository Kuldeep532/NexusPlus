import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { FileManagerEntry } from './FileManagerTypes';

export type FileActionResult = { success: boolean; uri?: string; message?: string };

export async function shareEntry(entry: FileManagerEntry): Promise<FileActionResult> {
  if (!(await Sharing.isAvailableAsync())) return { success: false, message: 'Sharing is not available on this device.' };
  await Sharing.shareAsync(entry.uri);
  return { success: true };
}

export async function deleteEntryWithConfirmation(entry: FileManagerEntry): Promise<FileActionResult> {
  await FileSystem.deleteAsync(entry.uri, { idempotent: true });
  return { success: true };
}

export async function copyEntryTo(entry: FileManagerEntry, destinationUri: string): Promise<FileActionResult> {
  const target = `${destinationUri.replace(/\/$/, '')}/${entry.name}`;
  await FileSystem.copyAsync({ from: entry.uri, to: target });
  return { success: true, uri: target };
}

export async function moveEntryTo(entry: FileManagerEntry, destinationUri: string): Promise<FileActionResult> {
  const target = `${destinationUri.replace(/\/$/, '')}/${entry.name}`;
  await FileSystem.moveAsync({ from: entry.uri, to: target });
  return { success: true, uri: target };
}

export async function renameEntryTo(entry: FileManagerEntry, newName: string): Promise<FileActionResult> {
  const name = newName.trim();
  if (!name) return { success: false, message: 'A new name is required.' };
  const parent = entry.uri.slice(0, entry.uri.lastIndexOf('/'));
  const target = `${parent}/${name}`;
  await FileSystem.moveAsync({ from: entry.uri, to: target });
  return { success: true, uri: target };
}

export async function getEntryDetails(entry: FileManagerEntry) {
  const info = await FileSystem.getInfoAsync(entry.uri, { size: true });
  return {
    ...entry,
    exists: info.exists,
    size: Number(info.size ?? entry.size),
    modificationTime: Number(info.modificationTime ?? 0) * 1000,
  };
}

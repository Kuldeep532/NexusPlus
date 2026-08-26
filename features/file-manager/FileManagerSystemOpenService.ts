import * as Sharing from 'expo-sharing';
import type { FileManagerEntry } from './FileManagerTypes';

export async function openWithSystem(entry: FileManagerEntry): Promise<void> {
  if (entry.isDirectory) throw new Error('Folders must be opened inside File Manager.');
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(entry.uri);
    return;
  }
  throw new Error('No compatible external viewer is available for this file.');
}

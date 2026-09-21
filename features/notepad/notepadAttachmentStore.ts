import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const NOTES_DIR = 'Nexus Plus/Notes';

export async function ensureNotesDirectory(): Promise<string> {
  const base = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!base) throw new Error('Local file storage is unavailable on this device.');
  const root = base.endsWith('/') ? base : base + '/';
  const target = root + NOTES_DIR + '/';
  const info = await FileSystem.getInfoAsync(target);
  if (!info.exists) await FileSystem.makeDirectoryAsync(target, { intermediates: true });
  return target;
}

export async function persistAttachment(uri: string, name: string): Promise<string> {
  const targetDir = await ensureNotesDirectory();
  const safeName = (name || 'attachment').replace(/[^a-zA-Z0-9._-]+/g, '-');
  const target = targetDir + Date.now().toString(36) + '-' + safeName;
  if (uri === target) return target;
  await FileSystem.copyAsync({ from: uri, to: target });
  return target;
}

export function isWebRuntime(): boolean {
  return Platform.OS === 'web';
}

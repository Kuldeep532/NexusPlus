import * as FileSystem from 'expo-file-system';

const ROOT = `${FileSystem.documentDirectory ?? ''}Nexus Plus Audio Editor/Fun Recordings/`;

export async function ensureFunRecordingDirectory(): Promise<string> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Audio storage is not available on this device.');
  }
  const info = await FileSystem.getInfoAsync(ROOT);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
  }
  return ROOT;
}

export async function createFunRecordingPath(): Promise<string> {
  const directory = await ensureFunRecordingDirectory();
  return `${directory}recording-${Date.now()}.m4a`;
}

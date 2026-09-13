import * as FileSystem from 'expo-file-system';

const ROOT_FOLDER = 'Nexus Plus Audio Editor';

function sanitizeName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').trim() || 'Untitled';
}

export async function ensureAudioEditorExportFolder(category = 'Audio Trims'): Promise<string> {
  const base = FileSystem.documentDirectory;
  if (!base) throw new Error('Nexus Plus storage is unavailable on this device.');
  const categoryPath = `${base}${ROOT_FOLDER}/${sanitizeName(category)}/`;
  await FileSystem.makeDirectoryAsync(categoryPath, { intermediates: true });
  return categoryPath;
}

export async function createAudioEditorOutputPath(category: string, sourceName: string): Promise<string> {
  const folder = await ensureAudioEditorExportFolder(category);
  const baseName = sanitizeName(sourceName).replace(/\.[^.]+$/, '') || 'audio';
  return `${folder}${baseName}-trimmed-${Date.now()}.m4a`;
}

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

export async function createAudioEditorOutputPath(
  category: string,
  sourceName: string,
  suffix = 'audio',
  extension = 'm4a',
): Promise<string> {
  const folder = await ensureAudioEditorExportFolder(category);
  const baseName = sanitizeName(sourceName).replace(/\.[^.]+$/, '') || 'audio';
  const safeSuffix = sanitizeName(suffix).toLowerCase() || 'audio';
  const safeExtension = sanitizeName(extension).toLowerCase().replace(/^\./, '') || 'm4a';
  return `${folder}${baseName}-${safeSuffix}-${Date.now()}.${safeExtension}`;
}

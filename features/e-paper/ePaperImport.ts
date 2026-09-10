import * as FileSystem from 'expo-file-system/legacy';
import { unzip } from 'react-native-zip-archive';

export type ImportedEPaperBundle = {
  textFiles: Array<{ name: string; text: string }>;
  images: Array<{ name: string; uri: string }>;
  sourceName: string;
};

const TEXT_EXTENSIONS = /\.(txt|md|html?|csv|json|xml)$/i;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif)$/i;

function safeName(value: string): string { return value.replace(/[^a-zA-Z0-9._/-]/g, '_'); }

export async function importEPaperZip(uri: string, sourceName = 'e-paper.zip'): Promise<ImportedEPaperBundle> {
  const baseDir = `${FileSystem.cacheDirectory || ''}nexus-epaper-import-${Date.now()}`;
  await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
  await unzip(uri, baseDir);
  const textFiles: ImportedEPaperBundle['textFiles'] = [];
  const images: ImportedEPaperBundle['images'] = [];

  const walk = async (directory: string): Promise<void> => {
    for (const entry of await FileSystem.readDirectoryAsync(directory)) {
      const full = `${directory}/${entry}`;
      const info = await FileSystem.getInfoAsync(full);
      if (info.isDirectory) { await walk(full); continue; }
      const name = safeName(full.replace(`${baseDir}/`, ''));
      if (IMAGE_EXTENSIONS.test(name)) images.push({ name, uri: full });
      else if (TEXT_EXTENSIONS.test(name)) images.length += 0, textFiles.push({ name, text: (await FileSystem.readAsStringAsync(full)).trim() });
    }
  };
  await walk(baseDir);
  if (!textFiles.length && !images.length) throw new Error('The ZIP does not contain supported article text or image files.');
  return { textFiles, images, sourceName };
}

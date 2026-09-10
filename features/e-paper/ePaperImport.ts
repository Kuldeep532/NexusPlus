import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';

export type ImportedEPaperBundle = {
  textFiles: Array<{ name: string; text: string }>;
  images: Array<{ name: string; uri: string }>;
  sourceName: string;
};

const TEXT_EXTENSIONS = /\.(txt|md|html?|csv|json|xml)$/i;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|gif)$/i;

function normalizeZipPath(path: string): string { return path.replace(/\\/g, '/').replace(/^\/+/, ''); }

export async function importEPaperZip(uri: string, sourceName = 'e-paper.zip'): Promise<ImportedEPaperBundle> {
  const baseDir = `${FileSystem.cacheDirectory || ''}nexus-epaper-import-${Date.now()}/`;
  await FileSystem.makeDirectoryAsync(baseDir, { intermediates: true });
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  const zip = await JSZip.loadAsync(base64, { base64: true });
  const textFiles: ImportedEPaperBundle['textFiles'] = [];
  const images: ImportedEPaperBundle['images'] = [];

  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const name = normalizeZipPath(entry.name);
    if (name.startsWith('../') || name.includes('/../')) continue;
    if (IMAGE_EXTENSIONS.test(name)) {
      const data = await entry.async('base64');
      const target = `${baseDir}${name.replace(/[^a-zA-Z0-9._/-]/g, '_')}`;
      const parent = target.slice(0, target.lastIndexOf('/'));
      if (parent) await FileSystem.makeDirectoryAsync(parent, { intermediates: true });
      await FileSystem.writeAsStringAsync(target, data, { encoding: 'base64' });
      images.push({ name, uri: target });
    } else if (TEXT_EXTENSIONS.test(name)) {
      const text = await entry.async('text');
      textFiles.push({ name, text: text.trim() });
    }
  }
  if (!textFiles.length && !images.length) throw new Error('The ZIP does not contain supported article text or image files.');
  return { textFiles, images, sourceName };
}

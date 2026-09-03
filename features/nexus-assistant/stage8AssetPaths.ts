import { Directory, Paths } from 'expo-file-system';
import { getAssistantAsset } from './modelCatalog';

const root = new Directory(Paths.document, 'nexus-assistant', 'stage8-assets');

/** Returns the archive location used by the lazy downloader. Extraction into child
 * model directories is performed by the native speech/runtime adapter.
 */
export function getAssistantAssetPath(id: string): string | null {
  const asset = getAssistantAsset(id);
  if (!asset) return null;
  const extension = asset.format === 'archive' ? '.tar.bz2' : asset.format === 'onnx' ? '.onnx' : '.gguf';
  return `${root.uri}/${asset.id}${extension}`;
}

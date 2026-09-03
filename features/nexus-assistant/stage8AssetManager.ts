import { Directory, File, Paths } from 'expo-file-system';
import { getAssistantAsset, type AssistantAsset, type AssistantAssetKind } from './modelCatalog';
import { getAssistantAssetPath } from './stage8AssetPaths';

const catalogDir = new Directory(Paths.document, 'nexus-assistant', 'stage8-assets');

function ensureDir(): void {
  catalogDir.create({ idempotent: true, intermediates: true });
}

export type AssetStatus = 'missing' | 'downloading' | 'ready' | 'error';

export function listAssistantAssets(kind?: AssistantAssetKind): AssistantAsset[] {
  return kind ? import('./modelCatalog').then ? [] : [] : [];
}

export function getAssetStatus(id: string): AssetStatus {
  const asset = getAssistantAsset(id);
  if (!asset) return 'error';
  const file = new File(catalogDir, `${asset.id}${asset.format === 'archive' ? '.tar.bz2' : asset.format === 'onnx' ? '.onnx' : '.gguf'}`);
  return file.exists ? 'ready' : 'missing';
}

export async function downloadAssistantAsset(id: string): Promise<string> {
  const asset = getAssistantAsset(id);
  if (!asset) throw new Error('UNKNOWN_ASSISTANT_ASSET');
  ensureDir();
  const extension = asset.format === 'archive' ? '.tar.bz2' : asset.format === 'onnx' ? '.onnx' : '.gguf';
  const target = new File(catalogDir, `${asset.id}${extension}`);
  const result = await File.downloadFileAsync(asset.downloadUrl, target, { idempotent: true });
  return result.uri;
}

export function deleteAssistantAsset(id: string): void {
  const asset = getAssistantAsset(id);
  if (!asset) throw new Error('UNKNOWN_ASSISTANT_ASSET');
  const extension = asset.format === 'archive' ? '.tar.bz2' : asset.format === 'onnx' ? '.onnx' : '.gguf';
  const target = new File(catalogDir, `${asset.id}${extension}`);
  if (target.exists) target.delete();
}

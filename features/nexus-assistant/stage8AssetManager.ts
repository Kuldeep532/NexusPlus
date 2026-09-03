import { Directory, File, Paths } from 'expo-file-system';
import { getAssistantAsset, getAssistantAssetsFor, type AssistantAsset, type AssistantAssetKind } from './modelCatalog';

const catalogDir = new Directory(Paths.document, 'nexus-assistant', 'stage8-assets');

function ensureDir(): void {
  catalogDir.create({ idempotent: true, intermediates: true });
}

export type AssetStatus = 'missing' | 'ready' | 'error';

export function listAssistantAssets(kind?: AssistantAssetKind): AssistantAsset[] {
  return kind ? getAssistantAssetsFor(kind) : [
    ...getAssistantAssetsFor('chat'),
    ...getAssistantAssetsFor('asr'),
    ...getAssistantAssetsFor('tts'),
    ...getAssistantAssetsFor('vad'),
  ];
}

function fileFor(asset: AssistantAsset): File {
  const extension = asset.format === 'archive' ? '.tar.bz2' : asset.format === 'onnx' ? '.onnx' : '.gguf';
  return new File(catalogDir, `${asset.id}${extension}`);
}

export function getAssetStatus(id: string): AssetStatus {
  const asset = getAssistantAsset(id);
  if (!asset) return 'error';
  return fileFor(asset).exists ? 'ready' : 'missing';
}

export async function downloadAssistantAsset(id: string): Promise<string> {
  const asset = getAssistantAsset(id);
  if (!asset) throw new Error('UNKNOWN_ASSISTANT_ASSET');
  ensureDir();
  const result = await File.downloadFileAsync(asset.downloadUrl, fileFor(asset), { idempotent: true });
  return result.uri;
}

export function deleteAssistantAsset(id: string): void {
  const asset = getAssistantAsset(id);
  if (!asset) throw new Error('UNKNOWN_ASSISTANT_ASSET');
  const target = fileFor(asset);
  if (target.exists) target.delete();
}

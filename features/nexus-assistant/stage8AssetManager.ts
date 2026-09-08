import { Directory, File, Paths } from 'expo-file-system';
import { getAssistantAsset, getAssistantAssetsFor, type AssistantAsset, type AssistantAssetKind } from './modelCatalog';

const catalogDir = new Directory(Paths.document, 'nexus-assistant', 'stage8-assets');
const activeDownloads = new Map<string, Promise<string>>();

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

function tempFileFor(asset: AssistantAsset): File {
  const extension = asset.format === 'archive' ? '.tar.bz2' : asset.format === 'onnx' ? '.onnx' : '.gguf';
  return new File(catalogDir, `${asset.id}${extension}.download`);
}

function safeDelete(file: File): void {
  try {
    if (file.exists) file.delete();
  } catch {
    // Cleanup is best effort; never mask the original download error.
  }
}

function isUsableFile(asset: AssistantAsset, file: File): boolean {
  if (!file.exists || file.size <= 0) return false;
  // Catalog sizes are advisory in some upstream releases; never reject a valid
  // remote file solely because a release changed its byte count.
  return true;
}

export function getAssetStatus(id: string): AssetStatus {
  const asset = getAssistantAsset(id);
  if (!asset) return 'error';
  return isUsableFile(asset, fileFor(asset)) ? 'ready' : 'missing';
}

async function performDownload(id: string): Promise<string> {
  const asset = getAssistantAsset(id);
  if (!asset) throw new Error('UNKNOWN_ASSISTANT_ASSET');
  ensureDir();

  const target = fileFor(asset);
  const temp = tempFileFor(asset);

  if (isUsableFile(asset, target)) return target.uri;
  safeDelete(temp);

  try {
    await File.downloadFileAsync(asset.downloadUrl, temp, { idempotent: true });
    if (!isUsableFile(asset, temp)) {
      throw new Error(`ASSET_DOWNLOAD_INVALID:${id}`);
    }

    safeDelete(target);
    temp.move(target);

    if (!isUsableFile(asset, target)) {
      safeDelete(target);
      throw new Error(`ASSET_FINALIZE_FAILED:${id}`);
    }
    return target.uri;
  } catch (error) {
    safeDelete(temp);
    // A previously valid target is safer than a transient failed replacement.
    if (isUsableFile(asset, target)) return target.uri;
    throw error instanceof Error ? error : new Error(`ASSET_DOWNLOAD_FAILED:${id}`);
  }
}

export async function downloadAssistantAsset(id: string): Promise<string> {
  const active = activeDownloads.get(id);
  if (active) return active;
  const promise = performDownload(id).finally(() => activeDownloads.delete(id));
  activeDownloads.set(id, promise);
  return promise;
}

export function deleteAssistantAsset(id: string): void {
  const asset = getAssistantAsset(id);
  if (!asset) throw new Error('UNKNOWN_ASSISTANT_ASSET');
  safeDelete(fileFor(asset));
  safeDelete(tempFileFor(asset));
}

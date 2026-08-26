import * as FileSystem from 'expo-file-system';

export type FileManagerLocalModelCapability = 'classify' | 'summarize' | 'extract' | 'rename';

export type FileManagerLocalModelState = 'not-downloaded' | 'downloading' | 'ready' | 'failed';

export type FileManagerLocalModel = {
  id: string;
  version: string;
  sizeBytes: number;
  runtime: 'on-device';
  capabilities: readonly FileManagerLocalModelCapability[];
  state: FileManagerLocalModelState;
  modelUri?: string;
  infer(text: string, capability: FileManagerLocalModelCapability): string;
};

const MODEL_FILENAME = 'nexus-file-ai-smollm2-q4.gguf';
const MODEL_DIR = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory}models/file-manager/`;
const MODEL_URI = `${MODEL_DIR}${MODEL_FILENAME}`;

// Verified external reference: SmolLM2-135M Q4_K_M is ~105 MB, so this is intentionally lazy.
export const FILE_MANAGER_MODEL_MANIFEST = {
  id: 'smollm2-135m-instruct-q4_k_m',
  version: '1.0.0',
  sizeBytes: 105 * 1024 * 1024,
  runtime: 'on-device' as const,
  downloadUrl: 'https://huggingface.co/tensorblock/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_M.gguf',
  capabilities: ['classify', 'summarize', 'extract', 'rename'] as const,
};

export async function isLocalFileModelReady(): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(MODEL_URI);
  return info.exists && Number(info.size ?? 0) > 0;
}

export async function ensureLocalFileModel(
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (await isLocalFileModelReady()) return MODEL_URI;
  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });
  const download = FileSystem.createDownloadResumable(
    FILE_MANAGER_MODEL_MANIFEST.downloadUrl,
    MODEL_URI,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress?.(totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0);
    },
  );
  const result = await download.downloadAsync();
  if (!result?.uri) throw new Error('The File Manager AI model could not be downloaded.');
  return result.uri;
}

export const FILE_MANAGER_LOCAL_MODEL: FileManagerLocalModel = {
  id: FILE_MANAGER_MODEL_MANIFEST.id,
  version: FILE_MANAGER_MODEL_MANIFEST.version,
  sizeBytes: FILE_MANAGER_MODEL_MANIFEST.sizeBytes,
  runtime: 'on-device',
  capabilities: FILE_MANAGER_MODEL_MANIFEST.capabilities,
  state: 'not-downloaded',
  infer(text, capability) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return 'No readable text was found.';
    if (capability === 'summarize') return (normalized.match(/[^.!?]+[.!?]+/g) ?? [normalized]).slice(0, 3).join(' ').slice(0, 900);
    if (capability === 'extract') return normalized.slice(0, 4000);
    if (capability === 'rename') return normalized.split(/[.!?]/)[0].replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 70) || 'Nexus File';
    return normalized.slice(0, 240);
  },
};

import { downloadAssistantAsset, getAssetStatus } from './stage8AssetManager';
import { getAssistantAsset } from './modelCatalog';

export type LazyAssetResult = {
  id: string;
  uri: string;
  downloaded: boolean;
};

/**
 * Resolves an asset only when the caller actually needs it.
 * No startup prefetch is performed by this helper.
 */
export async function ensureAssistantAsset(id: string): Promise<LazyAssetResult> {
  const asset = getAssistantAsset(id);
  if (!asset) throw new Error('UNKNOWN_ASSISTANT_ASSET');
  const existing = getAssetStatus(id);
  if (existing === 'ready') {
    const { getAssistantAssetPath } = await import('./stage8AssetPaths');
    const uri = getAssistantAssetPath(id);
    if (!uri) throw new Error('ASSISTANT_ASSET_PATH_UNAVAILABLE');
    return { id, uri, downloaded: false };
  }
  const uri = await downloadAssistantAsset(id);
  return { id, uri, downloaded: true };
}

export async function ensureChatModel() {
  return ensureAssistantAsset('chat-smollm2-360m-q4km');
}

export async function ensureVoiceInputModels() {
  const vad = await ensureAssistantAsset('vad-silero');
  const asr = await ensureAssistantAsset('asr-moonshine-tiny-en-int8-v2');
  return { vad, asr };
}

export async function ensureVoiceOutputModel() {
  return ensureAssistantAsset('tts-piper-en-us-lessac-medium');
}

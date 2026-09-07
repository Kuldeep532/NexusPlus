import { ASSISTANT_MODELS, type AssistantModel } from './assistantConfig';

export type AssistantAssetKind = 'chat' | 'asr' | 'tts' | 'vad';

export type AssistantAsset = AssistantModel & {
  downloadUrl: string;
};

/**
 * Canonical assistant asset catalog used by the Stage 8 storage manager.
 * Keep this as an adapter over assistantConfig so model metadata has one source
 * of truth and missing catalog files cannot break the Android bundle.
 */
export const ASSISTANT_ASSET_CATALOG: readonly AssistantAsset[] = ASSISTANT_MODELS
  .filter((model): model is AssistantModel & { kind: AssistantAssetKind } =>
    model.kind === 'chat' || model.kind === 'asr' || model.kind === 'tts' || model.kind === 'vad',
  )
  .map((model) => ({
    ...model,
    downloadUrl: model.url,
  }));

export function getAssistantAsset(id: string): AssistantAsset | null {
  return ASSISTANT_ASSET_CATALOG.find((asset) => asset.id === id) ?? null;
}

export function getAssistantAssetsFor(kind: AssistantAssetKind): AssistantAsset[] {
  return ASSISTANT_ASSET_CATALOG.filter((asset) => asset.kind === kind);
}

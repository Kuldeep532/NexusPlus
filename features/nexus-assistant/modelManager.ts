import { ASSISTANT_MODELS, ASSISTANT_VOICES, type AssistantModel, type AssistantVoice } from './assistantConfig';
import { downloadOnnxModel, deleteOnnxModel, resolveOnnxModelPath } from './onnxRuntimeManager';
import { downloadAssistantAsset, deleteAssistantAsset } from './stage8AssetManager';
import { downloadVoice, removeVoice } from '../voice-library/voiceStore';
import { UNIQUE_VOICE_CATALOG } from '../voice-library/voiceCatalog';

export function getAssistantModels(): AssistantModel[] {
  return [...ASSISTANT_MODELS];
}

export function getAssistantVoices(): AssistantVoice[] {
  return [...ASSISTANT_VOICES];
}

export async function downloadAssistantModel(modelId: string): Promise<string> {
  const model = ASSISTANT_MODELS.find((item) => item.id === modelId);
  if (!model) throw new Error('Unknown Nexus Assistant model.');
  if (model.kind !== 'chat') throw new Error('Requested asset is not a chat model.');
  return model.format === 'onnx'
    ? downloadOnnxModel(model.id)
    : downloadAssistantAsset(model.id);
}

export function getAssistantModelPath(modelId: string): string | null {
  const model = ASSISTANT_MODELS.find((item) => item.id === modelId);
  if (!model) return null;
  return model.format === 'onnx' ? resolveOnnxModelPath(modelId) : null;
}

export async function deleteAssistantModel(modelId: string): Promise<void> {
  const model = ASSISTANT_MODELS.find((item) => item.id === modelId);
  if (model?.format === 'onnx') {
    deleteOnnxModel(modelId);
    return;
  }
  try { deleteAssistantAsset(modelId); } catch {}
}

export async function downloadAssistantVoice(voiceId: string): Promise<string> {
  const voice = ASSISTANT_VOICES.find((item) => item.id === voiceId);
  const canonical = UNIQUE_VOICE_CATALOG.find((item) => item.id === voiceId);
  if (!voice || !canonical) throw new Error('Unknown Nexus Assistant voice.');
  const installed = await downloadVoice(canonical);
  return installed.modelPath;
}

export async function deleteAssistantVoice(voiceId: string): Promise<void> {
  if (!UNIQUE_VOICE_CATALOG.some((item) => item.id === voiceId)) return;
  await removeVoice(voiceId);
}
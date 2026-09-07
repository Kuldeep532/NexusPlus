import { Directory, File, Paths } from 'expo-file-system';
import { ASSISTANT_MODELS, ASSISTANT_VOICES, type AssistantModel, type AssistantVoice } from './assistantConfig';
import { downloadAssistantAsset, deleteAssistantAsset } from './stage8AssetManager';

const modelsDir = new Directory(Paths.document, 'nexus-assistant', 'models');
const voicesDir = new Directory(Paths.document, 'nexus-assistant', 'voices');

function ensureDir(directory: Directory): void {
  directory.create({ idempotent: true, intermediates: true });
}

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
  return downloadAssistantAsset(model.id);
}

export async function deleteAssistantModel(modelId: string): Promise<void> {
  ensureDir(modelsDir);
  for (const name of [`${modelId}.gguf`, `${modelId}.tar.bz2`, `${modelId}.onnx`]) {
    const file = new File(modelsDir, name);
    if (file.exists) file.delete();
  }
  try { deleteAssistantAsset(modelId); } catch { /* no canonical asset to remove */ }
}

export async function downloadAssistantVoice(voiceId: string): Promise<string> {
  const voice = ASSISTANT_VOICES.find((item) => item.id === voiceId);
  if (!voice) throw new Error('Unknown Nexus Assistant voice.');
  return downloadAssistantAsset(voice.id);
}

export async function deleteAssistantVoice(voiceId: string): Promise<void> {
  ensureDir(voicesDir);
  for (const extension of ['.onnx', '.tar.bz2', '.json']) {
    const file = new File(voicesDir, `${voiceId}${extension}`);
    if (file.exists) file.delete();
  }
  try { deleteAssistantAsset(voiceId); } catch { /* no canonical asset to remove */ }
}
